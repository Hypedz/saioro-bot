import {
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { db } from '../db.js';
import { CORES, embed } from './embeds.js';
import { configuracoes } from './settings.js';

const TIPOS_CANAL = new Set([
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildForum,
]);

const PADRAO = {
  ativo: false,
  canal: null,
  limite: 5,
  janela: 30,
  contaDias: 7,
  acao: 'alerta',
  duracao: 10,
};

const historico = new Map();
const ultimoAlerta = new Map();

export function obterConfigAntiraid(guildId) {
  const linha = db.prepare('SELECT * FROM antiraid_config WHERE guild_id = ?').get(guildId);

  if (!linha) return { ...PADRAO };

  return {
    ativo: Boolean(linha.ativo),
    canal: linha.canal_id ?? null,
    limite: Math.max(1, Number(linha.limite) || PADRAO.limite),
    janela: Math.max(1, Number(linha.janela) || PADRAO.janela),
    contaDias: Math.max(0, Number(linha.conta_dias) || 0),
    acao: linha.acao === 'lockdown' ? 'lockdown' : 'alerta',
    duracao: Math.max(1, Number(linha.duracao) || PADRAO.duracao),
  };
}

export function salvarConfigAntiraid(guildId, mudancas) {
  const atual = { ...obterConfigAntiraid(guildId), ...mudancas };

  db.prepare(`
    INSERT INTO antiraid_config (
      guild_id, ativo, canal_id, limite, janela, conta_dias, acao, duracao
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      ativo      = excluded.ativo,
      canal_id   = excluded.canal_id,
      limite     = excluded.limite,
      janela     = excluded.janela,
      conta_dias = excluded.conta_dias,
      acao       = excluded.acao,
      duracao    = excluded.duracao
  `).run(
    guildId,
    atual.ativo ? 1 : 0,
    atual.canal ?? null,
    atual.limite,
    atual.janela,
    atual.contaDias,
    atual.acao,
    atual.duracao,
  );

  return atual;
}

export function lockdownAtivo(guildId) {
  const linhas = db
    .prepare('SELECT channel_id, termina FROM antiraid_lockdown WHERE guild_id = ?')
    .all(guildId);

  return {
    ativo: linhas.length > 0,
    canais: linhas.length,
    termina: linhas.length
      ? Math.max(...linhas.map((linha) => Number(linha.termina) || 0))
      : null,
  };
}

/** Canal de alerta: o configurado no anti-raid ou, na falta dele, o de logs. */
export async function canalAntiraid(guild, cfg = obterConfigAntiraid(guild.id)) {
  const id = cfg.canal ?? configuracoes(guild.id).logs;
  if (!id) return null;

  return (
    guild.channels.cache.get(id) ??
    (await guild.channels.fetch(id).catch(() => null))
  );
}

function estadoAnterior(canal, guildId) {
  const overwrite = canal.permissionOverwrites.cache.get(guildId);
  if (!overwrite) return null;
  if (overwrite.deny.has(PermissionFlagsBits.SendMessages)) return 0;
  if (overwrite.allow.has(PermissionFlagsBits.SendMessages)) return 1;
  return null;
}

/** Tranca os canais de texto para @everyone e guarda o estado anterior. */
export async function iniciarLockdown(guild, duracaoMin, motivo = 'Anti-raid') {
  const eu = guild.members.me ?? (await guild.members.fetchMe().catch(() => null));
  if (!eu?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return {
      ok: false,
      motivo: 'Preciso da permissão **Gerenciar Canais** para iniciar o lockdown.',
    };
  }

  const atual = lockdownAtivo(guild.id);
  if (atual.ativo) return { ok: true, jaAtivo: true, ...atual };

  await guild.channels.fetch().catch(() => {});

  const termina = Date.now() + Math.max(1, Number(duracaoMin) || 10) * 60_000;
  const canais = [...guild.channels.cache.values()].filter((canal) =>
    TIPOS_CANAL.has(canal.type),
  );
  const inserir = db.prepare(`
    INSERT OR REPLACE INTO antiraid_lockdown (guild_id, channel_id, anterior, termina)
    VALUES (?, ?, ?, ?)
  `);

  let total = 0;

  for (const canal of canais) {
    const permissoes = canal.permissionsFor(guild.roles.everyone);
    if (!permissoes?.has(PermissionFlagsBits.SendMessages)) continue;

    const anterior = estadoAnterior(canal, guild.id);

    // Já está trancado para @everyone; não precisa mexer nem guardar estado.
    if (anterior === 0) continue;

    try {
      await canal.permissionOverwrites.edit(
        guild.roles.everyone,
        { SendMessages: false },
        { reason: String(motivo).slice(0, 500) },
      );
      inserir.run(guild.id, canal.id, anterior, termina);
      total += 1;
    } catch (erro) {
      console.error(
        `[ERRO] Anti-raid: não consegui trancar #${canal.name}:`,
        erro.message,
      );
    }
  }

  return { ok: true, jaAtivo: false, canais: total, termina: total ? termina : null };
}

/** Devolve os canais ao estado anterior. Mantém linhas que falharem para tentar de novo. */
export async function encerrarLockdown(guild, motivo = 'Lockdown anti-raid encerrado') {
  const linhas = db
    .prepare('SELECT * FROM antiraid_lockdown WHERE guild_id = ?')
    .all(guild.id);
  const apagar = db.prepare(
    'DELETE FROM antiraid_lockdown WHERE guild_id = ? AND channel_id = ?',
  );

  let total = 0;

  for (const linha of linhas) {
    const canal =
      guild.channels.cache.get(linha.channel_id) ??
      (await guild.channels.fetch(linha.channel_id).catch(() => null));

    if (!canal) {
      apagar.run(guild.id, linha.channel_id);
      continue;
    }

    try {
      const valor =
        linha.anterior === null || linha.anterior === undefined
          ? null
          : Boolean(linha.anterior);

      await canal.permissionOverwrites.edit(
        guild.roles.everyone,
        { SendMessages: valor },
        { reason: String(motivo).slice(0, 500) },
      );
      apagar.run(guild.id, linha.channel_id);
      total += 1;
    } catch (erro) {
      console.error(
        `[ERRO] Anti-raid: não consegui destrancar #${canal.name}:`,
        erro.message,
      );
    }
  }

  return total;
}

/** Destranca os canais cujo prazo venceu. */
export async function tickAntiraid(client) {
  const guilds = db
    .prepare('SELECT DISTINCT guild_id FROM antiraid_lockdown WHERE termina <= ?')
    .all(Date.now());

  for (const { guild_id: guildId } of guilds) {
    const guild =
      client.guilds.cache.get(guildId) ??
      (await client.guilds.fetch(guildId).catch(() => null));

    if (!guild) {
      db.prepare('DELETE FROM antiraid_lockdown WHERE guild_id = ?').run(guildId);
      continue;
    }

    const total = await encerrarLockdown(guild);
    if (!total) continue;

    const cfg = obterConfigAntiraid(guildId);
    const canal = await canalAntiraid(guild, cfg);

    if (canal?.isTextBased()) {
      await canal
        .send({
          embeds: [
            embed(
              '🔓 Lockdown encerrado',
              `Os canais foram restaurados (${total} canal(is)). O anti-raid continua ativo.`,
              CORES.sucesso,
            ),
          ],
          allowedMentions: { parse: [] },
        })
        .catch(() => {});
    }
  }
}

/**
 * Detecta entradas em massa ou várias contas novas na janela configurada.
 * O histórico fica em memória e reinicia junto com o bot.
 */
export async function processarEntradaAntiraid(member) {
  const guild = member.guild;
  if (!guild || member.user.bot) return null;

  const cfg = obterConfigAntiraid(guild.id);
  if (!cfg.ativo) return null;

  const agora = Date.now();
  const janelaMs = cfg.janela * 1000;
  const lista = (historico.get(guild.id) ?? []).filter(
    (item) => agora - item.em <= janelaMs,
  );

  const dias = Math.max(0, Math.floor((agora - member.user.createdTimestamp) / 86_400_000));
  const nova = cfg.contaDias > 0 && dias < cfg.contaDias;

  lista.push({
    id: member.id,
    nome: member.user.username,
    em: agora,
    dias,
    nova,
  });

  historico.set(guild.id, lista);

  const novas = lista.filter((item) => item.nova).length;
  const limiteContas = Math.max(2, Math.ceil(cfg.limite / 2));
  const porVolume = lista.length >= cfg.limite;
  const porContas = cfg.contaDias > 0 && novas >= limiteContas;

  if (!porVolume && !porContas) return null;

  const cooldown = Math.max(60_000, janelaMs * 2);
  if ((ultimoAlerta.get(guild.id) ?? 0) + cooldown > agora) return null;

  ultimoAlerta.set(guild.id, agora);
  historico.set(guild.id, []);

  const canal = await canalAntiraid(guild, cfg);
  if (!canal?.isTextBased()) {
    console.warn(
      `[AVISO] Anti-raid disparou em ${guild.id}, mas não há canal de alerta configurado.`,
    );
    return null;
  }

  let acao = 'Somente alerta';
  let resultadoLockdown = null;

  if (cfg.acao === 'lockdown') {
    resultadoLockdown = await iniciarLockdown(
      guild,
      cfg.duracao,
      `Anti-raid: ${lista.length} entrada(s) em ${cfg.janela}s`,
    );

    if (!resultadoLockdown.ok) {
      acao = `Alerta (lockdown falhou: ${resultadoLockdown.motivo})`;
    } else if (resultadoLockdown.jaAtivo) {
      acao = `Lockdown já estava ativo (${resultadoLockdown.canais} canal(is))`;
    } else if (resultadoLockdown.canais === 0) {
      acao = 'Lockdown não alterou canais (já trancados ou sem permissão)';
    } else {
      acao = `Lockdown por ${cfg.duracao} min (${resultadoLockdown.canais} canal(is))`;
    }
  }

  const entradas = lista
    .slice(-10)
    .map((item) => {
      const idade =
        item.dias <= 0 ? 'menos de 1 dia' : `${item.dias} dia(s)`;
      return `<@${item.id}> — conta há ${idade}${item.nova ? ' ⚠️' : ''}`;
    })
    .join('\n');

  const contas = cfg.contaDias
    ? `**${novas}** conta(s) com menos de **${cfg.contaDias}** dias.`
    : 'Checagem de idade de conta desligada.';

  const painel = embed(
    '🚨 Possível raid detectado',
    `**${lista.length}** entrada(s) em **${cfg.janela}s**.\n${contas}`,
    CORES.erro,
  ).addFields(
    { name: 'Ação', value: acao },
    { name: 'Últimas entradas', value: entradas || '—' },
  );

  await canal
    .send({
      embeds: [painel],
      allowedMentions: { parse: [] },
    })
    .catch((erro) => console.error('[ERRO] Anti-raid: alerta não enviado:', erro.message));

  return {
    disparou: true,
    entradas: lista.length,
    contasNovas: novas,
    lockdown: resultadoLockdown,
  };
}
