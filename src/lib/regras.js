import { db } from '../db.js';

/** Guarda a última versão publicada para o painel inicial. */
export function salvarRegras(guildId, { titulo, texto, channelId, messageId }) {
  db.prepare(`
    INSERT INTO regras (guild_id, titulo, texto, channel_id, message_id, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      titulo        = excluded.titulo,
      texto         = excluded.texto,
      channel_id    = excluded.channel_id,
      message_id    = excluded.message_id,
      atualizado_em = excluded.atualizado_em
  `).run(guildId, titulo, texto, channelId ?? null, messageId ?? null, Date.now());
}

export function obterRegras(guildId) {
  return db.prepare('SELECT * FROM regras WHERE guild_id = ?').get(guildId) ?? null;
}
