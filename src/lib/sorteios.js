import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db } from '../db.js';
import { CORES, embed } from './embeds.js';
import { contarMensagens } from './mensagens.js';

export function obterSorteio(messageId) {
  return db.prepare('SELECT * FROM sorteios WHERE message_id = ?').get(messageId) ?? null;
}

export function contarParticipantes(messageId) {
  const linha = db
    .prepare('SELECT COUNT(*) AS total FROM sorteio_participantes WHERE message_id = ?')
    .get(messageId);
  return Number(linha?.total ?? 0);
}

/** Vencedores da rodada mais recente. */
export function vencedoresDaRodada(messageId) {
  return db
    .prepare(`
      SELECT user_id
      FROM sorteio_vencedores
      WHERE message_id = ?
        AND rodada = (SELECT MAX(rodada) FROM sorteio_vencedores WHERE message_id = ?)
    `)
    .all(messageId, messageId)
    .map((linha) => linha.user_id);
}

function textoRequisitos(sorteio) {
  const itens = [];

  if (sorteio.requisito_cargo) itens.push(`cargo <@&${sorteio.requisito_cargo}>`);
  if (sorteio.requisito_conta > 0) {
    itens.push(`conta com ${sorteio.requisito_conta} dia(s)`);
  }
  if (sorteio.requisito_mensagens > 0) {
    itens.push(`${sorteio.requisito_mensagens} mensagem(ns) no servidor`);
  }

  return itens.length ? itens.join(' • ') : 'nenhum';
}

export function embedSorteio(sorteio) {
  const total = contarParticipantes(sorteio.message_id);
  const fim = Math.floor(sorteio.termina / 1000);
  const vencedores = sorteio.encerrado ? vencedoresDaRodada(sorteio.message_id) : [];

  const linhas = [
    `**Prêmio:** ${sorteio.premio}`,
    `**Vencedores:** ${sorteio.vencedores}`,
    `**Participantes:** ${total}`,
    `**Requisitos:** ${textoRequisitos(sorteio)}`,
    sorteio.encerrado
      ? '**Status:** encerrado'
      : `**Termina:** <t:${fim}:R> (<t:${fim}:f>)`,
  ];

  if (sorteio.encerrado) {
    linhas.push(
      `**Resultado:** ${
        vencedores.length ? vencedores.map((id) => `<@${id}>`).join(', ') : '_ninguém_'
      }`,
    );
  }

  return embed(
    '🎉 Sorteio',
    linhas.join('\n'),
    sorteio.encerrado ? CORES.neutro : CORES.destaque,
  ).setFooter({ text: `Sorteio de ${sorteio.host_id}` });
}

function botoes(messageId, encerrado) {
  if (encerrado) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`sorteio:rerolar:${messageId}`)
        .setLabel('Sortear novamente')
        .setEmoji('🔁')
        .setStyle(ButtonStyle.Primary),
    );
  }

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`sorteio:entrar:${messageId}`)
      .setLabel('Participar')
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`sorteio:encerrar:${messageId}`)
      .setLabel('Encerrar agora')
      .setStyle(ButtonStyle.Secondary),
  );
}

/** Cria a mensagem do sorteio no canal e registra no banco. */
export async function criarSorteio(
  canal,
  { premio, duracaoMs, vencedores, hostId, requisitoCargo = null, requisitoConta = 0, requisitoMensagens = 0 },
) {
  const termina = Date.now() + duracaoMs;

  const mensagem = await canal.send({
    embeds: [embed('🎉 Sorteio', 'Preparando...', CORES.destaque)],
  });

  db.prepare(`
    INSERT INTO sorteios (
      message_id, channel_id, guild_id, premio, host_id, termina, vencedores,
      requisito_cargo, requisito_conta, requisito_mensagens
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    mensagem.id,
    canal.id,
    canal.guild.id,
    premio,
    hostId,
    termina,
    vencedores,
    requisitoCargo,
    Math.max(0, requisitoConta),
    Math.max(0, requisitoMensagens),
  );

  const sorteio = obterSorteio(mensagem.id);

  await mensagem.edit({
    embeds: [embedSorteio(sorteio)],
    components: [botoes(mensagem.id, false)],
  });

  return sorteio;
}

/** Lista o que falta para o membro cumprir os requisitos (vazio = pode participar). */
export function verificarRequisitos(sorteio, membro) {
  const faltas = [];

  if (sorteio.requisito_cargo && !membro.roles?.cache?.has(sorteio.requisito_cargo)) {
    faltas.push(`precisa do cargo <@&${sorteio.requisito_cargo}>`);
  }

  if (sorteio.requisito_conta > 0) {
    const criadaEm = Number(membro.user?.createdTimestamp ?? 0);
    const dias = criadaEm ? Math.floor((Date.now() - criadaEm) / 86_400_000) : 0;
    if (dias < sorteio.requisito_conta) {
      faltas.push(`sua conta tem ${dias} dia(s); o mínimo é ${sorteio.requisito_conta}`);
    }
  }

  if (sorteio.requisito_mensagens > 0) {
    const total = contarMensagens(sorteio.guild_id, membro.id);
    if (total < sorteio.requisito_mensagens) {
      faltas.push(`você enviou ${total}; o mínimo é ${sorteio.requisito_mensagens} mensagem(ns)`);
    }
  }

  return faltas;
}

export function entrarSorteio(messageId, userId) {
  const sorteio = obterSorteio(messageId);
  if (!sorteio) return { ok: false, motivo: 'Sorteio não encontrado.' };
  if (sorteio.encerrado) return { ok: false, motivo: 'Este sorteio já foi encerrado.' };

  const jaParticipava = Boolean(
    db
      .prepare('SELECT 1 AS x FROM sorteio_participantes WHERE message_id = ? AND user_id = ?')
      .get(messageId, userId),
  );

  if (!jaParticipava) {
    db.prepare('INSERT INTO sorteio_participantes (message_id, user_id) VALUES (?, ?)').run(
      messageId,
      userId,
    );
  }

  return { ok: true, jaParticipava, total: contarParticipantes(messageId) };
}

function sortear(lista, quantidade) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, quantidade);
}

/** Sorteia uma nova rodada, ignorando quem já ganhou neste sorteio. */
async function sortearRodada(client, messageId) {
  const sorteio = obterSorteio(messageId);
  if (!sorteio) return { vencedores: [], rodada: 0 };

  const anteriores = new Set(
    db
      .prepare('SELECT user_id FROM sorteio_vencedores WHERE message_id = ?')
      .all(messageId)
      .map((linha) => linha.user_id),
  );

  const participantes = db
    .prepare('SELECT user_id FROM sorteio_participantes WHERE message_id = ?')
    .all(messageId)
    .map((linha) => linha.user_id)
    .filter((id) => !anteriores.has(id));

  const rodada =
    Number(
      db.prepare('SELECT MAX(rodada) AS r FROM sorteio_vencedores WHERE message_id = ?').get(messageId)
        ?.r ?? 0,
    ) + 1;

  const vencedores = sortear(participantes, sorteio.vencedores);

  const inserir = db.prepare(`
    INSERT OR IGNORE INTO sorteio_vencedores (message_id, user_id, rodada)
    VALUES (?, ?, ?)
  `);

  for (const id of vencedores) inserir.run(messageId, id, rodada);

  const atualizado = obterSorteio(messageId);
  const canal = await client.channels.fetch(sorteio.channel_id).catch(() => null);

  if (canal?.isTextBased()) {
    const mensagem = await canal.messages.fetch(messageId).catch(() => null);
    if (mensagem) {
      await mensagem
        .edit({ embeds: [embedSorteio(atualizado)], components: [botoes(messageId, true)] })
        .catch(() => {});
    }

    const texto = vencedores.length
      ? `🎉 ${rodada > 1 ? 'Novo sorteio: ' : ''}${vencedores
          .map((id) => `<@${id}>`)
          .join(', ')} ${vencedores.length > 1 ? 'ganharam' : 'ganhou'} **${sorteio.premio}**!`
      : `😕 O sorteio de **${sorteio.premio}** acabou sem participantes.`;

    await canal.send(texto).catch(() => {});
  }

  return { vencedores, rodada };
}

/** Encerra o sorteio, sorteia e anuncia. Retorna os vencedores (ou null). */
export async function encerrarSorteio(client, messageId) {
  const sorteio = obterSorteio(messageId);
  if (!sorteio || sorteio.encerrado) return null;

  db.prepare('UPDATE sorteios SET encerrado = 1 WHERE message_id = ?').run(messageId);

  const resultado = await sortearRodada(client, messageId);
  return resultado.vencedores;
}

/** Novo sorteio entre quem ainda não ganhou. */
export async function rerolarSorteio(client, messageId) {
  const sorteio = obterSorteio(messageId);
  if (!sorteio) return { ok: false, motivo: 'Esse sorteio não existe mais.' };
  if (!sorteio.encerrado) {
    return { ok: false, motivo: 'Encerre o sorteio antes de sortear novamente.' };
  }

  const total = contarParticipantes(messageId);
  const jaGanharam = Number(
    db
      .prepare('SELECT COUNT(*) AS total FROM sorteio_vencedores WHERE message_id = ?')
      .get(messageId)?.total ?? 0,
  );

  if (total === 0) return { ok: false, motivo: 'Este sorteio não teve participantes.' };
  if (jaGanharam >= total) {
    return { ok: false, motivo: 'Todos os participantes já ganharam; não há mais ninguém para sortear.' };
  }

  const resultado = await sortearRodada(client, messageId);
  return { ok: true, ...resultado };
}

/** Encerra os sorteios cujo tempo acabou. */
export function tickSorteios(client) {
  const vencidos = db
    .prepare('SELECT message_id FROM sorteios WHERE encerrado = 0 AND termina <= ?')
    .all(Date.now());

  for (const { message_id: id } of vencidos) {
    encerrarSorteio(client, id).catch((erro) =>
      console.error('[ERRO] Falha ao encerrar sorteio:', erro),
    );
  }
}
