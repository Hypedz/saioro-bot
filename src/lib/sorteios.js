import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db } from '../db.js';
import { CORES, embed } from './embeds.js';

export function obterSorteio(messageId) {
  return db.prepare('SELECT * FROM sorteios WHERE message_id = ?').get(messageId) ?? null;
}

export function contarParticipantes(messageId) {
  const linha = db
    .prepare('SELECT COUNT(*) AS total FROM sorteio_participantes WHERE message_id = ?')
    .get(messageId);
  return Number(linha?.total ?? 0);
}

export function embedSorteio(sorteio) {
  const total = contarParticipantes(sorteio.message_id);
  const fim = Math.floor(sorteio.termina / 1000);

  return embed(
    '🎉 Sorteio',
    [
      `**Prêmio:** ${sorteio.premio}`,
      `**Vencedores:** ${sorteio.vencedores}`,
      `**Participantes:** ${total}`,
      sorteio.encerrado
        ? '**Status:** encerrado'
        : `**Termina:** <t:${fim}:R> (<t:${fim}:f>)`,
    ].join('\n'),
    sorteio.encerrado ? CORES.neutro : CORES.destaque,
  ).setFooter({ text: `Sorteio de ${sorteio.host_id}` });
}

function botoes(messageId, encerrado) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`sorteio:entrar:${messageId}`)
      .setLabel('Participar')
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(Boolean(encerrado)),
    new ButtonBuilder()
      .setCustomId(`sorteio:encerrar:${messageId}`)
      .setLabel('Encerrar agora')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(Boolean(encerrado)),
  );
}

/** Cria a mensagem do sorteio no canal e registra no banco. */
export async function criarSorteio(canal, { premio, duracaoMs, vencedores, hostId }) {
  const termina = Date.now() + duracaoMs;

  const mensagem = await canal.send({
    embeds: [embed('🎉 Sorteio', 'Preparando...', CORES.destaque)],
  });

  db.prepare(`
    INSERT INTO sorteios (message_id, channel_id, guild_id, premio, host_id, termina, vencedores)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(mensagem.id, canal.id, canal.guild.id, premio, hostId, termina, vencedores);

  const sorteio = db.prepare('SELECT * FROM sorteios WHERE message_id = ?').get(mensagem.id);

  await mensagem.edit({
    embeds: [embedSorteio(sorteio)],
    components: [botoes(mensagem.id, false)],
  });

  return sorteio;
}

export function entrarSorteio(messageId, userId) {
  const sorteio = db.prepare('SELECT * FROM sorteios WHERE message_id = ?').get(messageId);
  if (!sorteio) return { ok: false, motivo: 'Sorteio nao encontrado.' };
  if (sorteio.encerrado) return { ok: false, motivo: 'Este sorteio ja foi encerrado.' };

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

/** Encerra o sorteio, sorteia e anuncia. Retorna os vencedores (ou null). */
export async function encerrarSorteio(client, messageId) {
  const sorteio = db.prepare('SELECT * FROM sorteios WHERE message_id = ?').get(messageId);
  if (!sorteio || sorteio.encerrado) return null;

  db.prepare('UPDATE sorteios SET encerrado = 1 WHERE message_id = ?').run(messageId);

  const participantes = db
    .prepare('SELECT user_id FROM sorteio_participantes WHERE message_id = ?')
    .all(messageId)
    .map((linha) => linha.user_id);

  const vencedores = sortear(participantes, sorteio.vencedores);

  const atualizado = { ...sorteio, encerrado: 1 };
  const canal = await client.channels.fetch(sorteio.channel_id).catch(() => null);

  if (canal?.isTextBased()) {
    const mensagem = await canal.messages.fetch(messageId).catch(() => null);
    if (mensagem) {
      await mensagem
        .edit({ embeds: [embedSorteio(atualizado)], components: [botoes(messageId, true)] })
        .catch(() => {});
    }

    const texto = vencedores.length
      ? `🎉 ${vencedores.map((id) => `<@${id}>`).join(', ')} ganhou **${sorteio.premio}**!`
      : `😕 O sorteio de **${sorteio.premio}** acabou sem participantes.`;

    await canal.send(texto).catch(() => {});
  }

  return vencedores;
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
