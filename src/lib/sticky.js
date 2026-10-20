import { db } from '../db.js';

const PENDENTES = new Map();
const INTERVALO = 3000;

export function obterSticky(channelId) {
  return db.prepare('SELECT * FROM sticky WHERE channel_id = ?').get(channelId) ?? null;
}

export function salvarSticky(guildId, channelId, messageId, texto) {
  db.prepare(`
    INSERT INTO sticky (channel_id, guild_id, message_id, texto) VALUES (?, ?, ?, ?)
    ON CONFLICT(channel_id) DO UPDATE SET
      message_id = excluded.message_id,
      texto      = excluded.texto
  `).run(channelId, guildId, messageId, texto);
}

export function atualizarMensagemSticky(channelId, messageId) {
  db.prepare('UPDATE sticky SET message_id = ? WHERE channel_id = ?').run(messageId, channelId);
}

export function removerSticky(channelId) {
  return db.prepare('DELETE FROM sticky WHERE channel_id = ?').run(channelId).changes;
}

/**
 * Agenda a repostagem da mensagem fixa. Junta varias mensagens seguidas
 * num unico repost, para nao floodar o canal.
 */
export function agendarSticky(client, channelId) {
  if (PENDENTES.has(channelId)) return;

  const timer = setTimeout(async () => {
    PENDENTES.delete(channelId);

    const sticky = obterSticky(channelId);
    if (!sticky) return;

    const canal = await client.channels.fetch(channelId).catch(() => null);
    if (!canal?.isTextBased()) return;

    if (sticky.message_id) {
      const antiga = await canal.messages.fetch(sticky.message_id).catch(() => null);
      await antiga?.delete().catch(() => {});
    }

    const nova = await canal
      .send({ content: sticky.texto, allowedMentions: { parse: [] } })
      .catch(() => null);

    if (nova) atualizarMensagemSticky(channelId, nova.id);
  }, INTERVALO);

  PENDENTES.set(channelId, timer);
}

export function cancelarPendente(channelId) {
  const timer = PENDENTES.get(channelId);
  if (timer) {
    clearTimeout(timer);
    PENDENTES.delete(channelId);
  }
}
