import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db } from '../db.js';
import { CORES, embed } from './embeds.js';

export function obterSugestao(messageId) {
  return db.prepare('SELECT * FROM sugestoes WHERE message_id = ?').get(messageId) ?? null;
}

export function votosSugestao(messageId) {
  const positivos = db
    .prepare("SELECT COUNT(*) AS n FROM sugestao_votos WHERE message_id = ? AND voto = 1")
    .get(messageId).n;
  const negativos = db
    .prepare("SELECT COUNT(*) AS n FROM sugestao_votos WHERE message_id = ? AND voto = -1")
    .get(messageId).n;

  return { positivos: Number(positivos), negativos: Number(negativos) };
}

export function registroVoto(messageId, userId) {
  const linha = db
    .prepare('SELECT voto FROM sugestao_votos WHERE message_id = ? AND user_id = ?')
    .get(messageId, userId);
  return linha ? Number(linha.voto) : 0;
}

const ROTULO_STATUS = {
  aberta: '🟡 Aberta',
  aprovada: '✅ Aprovada',
  recusada: '❌ Recusada',
};

const COR_STATUS = {
  aberta: CORES.principal,
  aprovada: CORES.sucesso,
  recusada: CORES.erro,
};

export function embedSugestao(sugestao) {
  const { positivos, negativos } = votosSugestao(sugestao.message_id);

  const painel = embed(
    '💡 Sugestão',
    sugestao.texto,
    COR_STATUS[sugestao.status] ?? CORES.principal,
  ).addFields(
    { name: '👍 A favor', value: `**${positivos}**`, inline: true },
    { name: '👎 Contra', value: `**${negativos}**`, inline: true },
    { name: 'Status', value: ROTULO_STATUS[sugestao.status] ?? sugestao.status, inline: true },
  );

  if (!sugestao.anonimo) painel.setFooter({ text: `Sugerido por ${sugestao.autor_id}` });

  return painel;
}

export function botoesSugestao(sugestao) {
  const encerrada = sugestao.status !== 'aberta';

  const votos = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`sugestao:1:${sugestao.message_id}`)
      .setLabel('A favor')
      .setEmoji('👍')
      .setStyle(ButtonStyle.Success)
      .setDisabled(encerrada),
    new ButtonBuilder()
      .setCustomId(`sugestao:-1:${sugestao.message_id}`)
      .setLabel('Contra')
      .setEmoji('👎')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(encerrada),
  );

  const staff = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`sugestao:aprovada:${sugestao.message_id}`)
      .setLabel('Aprovar')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(encerrada),
    new ButtonBuilder()
      .setCustomId(`sugestao:recusada:${sugestao.message_id}`)
      .setLabel('Recusar')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(encerrada),
  );

  return [votos, staff];
}

export async function criarSugestao(canal, { texto, autorId, anonimo }) {
  const mensagem = await canal.send({ embeds: [embed('💡 Sugestão', texto, CORES.principal)] });

  db.prepare(`
    INSERT INTO sugestoes (message_id, channel_id, guild_id, autor_id, texto, anonimo, status, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, 'aberta', ?)
  `).run(mensagem.id, canal.id, canal.guild.id, autorId, texto, anonimo ? 1 : 0, Date.now());

  const sugestao = obterSugestao(mensagem.id);

  await mensagem.edit({
    embeds: [embedSugestao(sugestao)],
    components: botoesSugestao(sugestao),
  });

  return sugestao;
}

/** Vota (ou remove o voto se clicar de novo na mesma opcao). */
export function votarSugestao(messageId, userId, voto) {
  const sugestao = obterSugestao(messageId);
  if (!sugestao) return { ok: false, motivo: 'Sugestão não encontrada.' };
  if (sugestao.status !== 'aberta') return { ok: false, motivo: 'Essa sugestão já foi encerrada.' };

  const atual = registroVoto(messageId, userId);

  if (atual === voto) {
    db.prepare('DELETE FROM sugestao_votos WHERE message_id = ? AND user_id = ?').run(messageId, userId);
    return { ok: true, removido: true, ...votosSugestao(messageId) };
  }

  db.prepare(`
    INSERT INTO sugestao_votos (message_id, user_id, voto) VALUES (?, ?, ?)
    ON CONFLICT(message_id, user_id) DO UPDATE SET voto = excluded.voto
  `).run(messageId, userId, voto);

  return { ok: true, removido: false, ...votosSugestao(messageId) };
}

export function definirStatusSugestao(messageId, status) {
  db.prepare('UPDATE sugestoes SET status = ? WHERE message_id = ?').run(status, messageId);
  return obterSugestao(messageId);
}
