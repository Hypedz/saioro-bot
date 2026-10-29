import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { db } from '../db.js';
import { CORES, embed } from './embeds.js';

export const STATUS_CANDIDATURA = {
  pendente: { rotulo: '🟡 Pendente', cor: CORES.aviso },
  aprovada: { rotulo: '🟢 Aprovada', cor: CORES.sucesso },
  recusada: { rotulo: '🔴 Recusada', cor: CORES.erro },
};

export function modalCandidatura() {
  return new ModalBuilder()
    .setCustomId('candidatura:enviar')
    .setTitle('Candidatura à staff')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('nome_idade')
          .setLabel('Nome e idade')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('motivacao')
          .setLabel('Por que quer entrar na staff?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1500),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('disponibilidade')
          .setLabel('Quanto tempo por dia você tem?')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(200),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('experiencia')
          .setLabel('Experiência anterior (opcional)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(1000),
      ),
    );
}

export function obterCandidatura(id) {
  return db.prepare('SELECT * FROM candidaturas WHERE id = ?').get(Number(id)) ?? null;
}

export function temCandidaturaPendente(guildId, userId) {
  return Boolean(
    db
      .prepare(
        "SELECT 1 AS x FROM candidaturas WHERE guild_id = ? AND user_id = ? AND status = 'pendente'",
      )
      .get(guildId, userId),
  );
}

function respostasDe(candidatura) {
  try {
    return JSON.parse(candidatura.respostas);
  } catch {
    return {};
  }
}

export function embedCandidatura(candidatura) {
  const status = STATUS_CANDIDATURA[candidatura.status] ?? STATUS_CANDIDATURA.pendente;
  const respostas = respostasDe(candidatura);

  const painel = embed(
    `📝 Candidatura #${candidatura.id}`,
    `**Por que quer entrar**\n${String(respostas.motivacao ?? '_não informado_').slice(0, 4000)}`,
    status.cor,
  ).addFields(
    { name: 'Candidato', value: `<@${candidatura.user_id}>`, inline: true },
    { name: 'Status', value: status.rotulo, inline: true },
    { name: 'Nome e idade', value: String(respostas.nome_idade ?? '_não informado_').slice(0, 1024) },
    {
      name: 'Disponibilidade',
      value: String(respostas.disponibilidade ?? '_não informado_').slice(0, 1024),
      inline: true,
    },
  );

  if (respostas.experiencia) {
    painel.addFields({ name: 'Experiência', value: String(respostas.experiencia).slice(0, 1024) });
  }

  const quando = new Date(candidatura.criado_em).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  painel.setFooter({ text: `#${candidatura.id} • recebida em ${quando}` });
  return painel;
}

export function botoesCandidatura(candidatura) {
  const decidida = candidatura.status !== 'pendente';

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`candidatura:aprovar:${candidatura.id}`)
      .setLabel('Aprovar')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
      .setDisabled(decidida),
    new ButtonBuilder()
      .setCustomId(`candidatura:recusar:${candidatura.id}`)
      .setLabel('Recusar')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(decidida),
  );
}

/** Registra e publica a candidatura no canal da staff. */
export async function criarCandidatura(canal, { guildId, userId, cargoId, respostas }) {
  const resultado = db
    .prepare(`
      INSERT INTO candidaturas (
        guild_id, user_id, cargo_id, respostas, status, channel_id, message_id, criado_em
      )
      VALUES (?, ?, ?, ?, 'pendente', ?, '', ?)
    `)
    .run(guildId, userId, cargoId ?? null, JSON.stringify(respostas), canal.id, Date.now());

  const id = Number(resultado.lastInsertRowid);
  const candidatura = obterCandidatura(id);

  let mensagem;

  try {
    mensagem = await canal.send({
      embeds: [embedCandidatura(candidatura)],
      components: [botoesCandidatura(candidatura)],
    });
  } catch (erro) {
    db.prepare('DELETE FROM candidaturas WHERE id = ?').run(id);
    throw erro;
  }

  db.prepare('UPDATE candidaturas SET message_id = ? WHERE id = ?').run(mensagem.id, id);

  return { ...candidatura, message_id: mensagem.id };
}

export function atualizarStatusCandidatura(id, status, staffId) {
  db.prepare(`
    UPDATE candidaturas
    SET status = ?, decidido_por = ?, decidido_em = ?
    WHERE id = ?
  `).run(status, staffId, Date.now(), Number(id));

  return obterCandidatura(id);
}

export function contarCandidaturasPendentes(guildId) {
  return Number(
    db
      .prepare(
        "SELECT COUNT(*) AS total FROM candidaturas WHERE guild_id = ? AND status = 'pendente'",
      )
      .get(guildId)?.total ?? 0,
  );
}

/** Lista candidaturas para a central da staff. */
export function listarCandidaturas(guildId, { status = null, limite = 10 } = {}) {
  const filtro = status && STATUS_CANDIDATURA[status] ? status : null;
  const quantidade = Math.min(Math.max(Number(limite) || 10, 1), 20);
  const where = filtro ? 'AND status = ?' : '';
  const parametros = filtro ? [guildId, filtro, quantidade] : [guildId, quantidade];

  return db
    .prepare(`
      SELECT * FROM candidaturas
      WHERE guild_id = ? ${where}
      ORDER BY id DESC
      LIMIT ?
    `)
    .all(...parametros);
}

/** Contagem por status, para o rodapé da central. */
export function contarCandidaturasPorStatus(guildId) {
  const totais = Object.fromEntries(
    Object.keys(STATUS_CANDIDATURA).map((status) => [status, 0]),
  );

  for (const linha of db
    .prepare('SELECT status, COUNT(*) AS total FROM candidaturas WHERE guild_id = ? GROUP BY status')
    .all(guildId)) {
    if (linha.status in totais) totais[linha.status] = Number(linha.total);
  }

  return totais;
}
