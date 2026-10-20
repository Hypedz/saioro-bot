import { db } from '../db.js';

export function criarLembrete({ userId, channelId, guildId, texto, quando }) {
  const resultado = db
    .prepare(
      'INSERT INTO lembretes (user_id, channel_id, guild_id, texto, quando) VALUES (?, ?, ?, ?, ?)',
    )
    .run(userId, channelId ?? null, guildId ?? null, texto, quando);

  return Number(resultado.lastInsertRowid);
}

export function listarLembretes(userId) {
  return db
    .prepare('SELECT * FROM lembretes WHERE user_id = ? ORDER BY quando ASC LIMIT 25')
    .all(userId);
}

export function apagarLembrete(id, userId) {
  return db
    .prepare('DELETE FROM lembretes WHERE id = ? AND user_id = ?')
    .run(id, userId).changes;
}

/** Dispara os lembretes vencidos. */
export async function tickLembretes(client) {
  const prontos = db.prepare('SELECT * FROM lembretes WHERE quando <= ?').all(Date.now());

  for (const lembrete of prontos) {
    db.prepare('DELETE FROM lembretes WHERE id = ?').run(lembrete.id);

    const canal = lembrete.channel_id
      ? await client.channels.fetch(lembrete.channel_id).catch(() => null)
      : null;

    const texto = `<@${lembrete.user_id}> ⏰ **Lembrete:** ${lembrete.texto}`;

    if (canal?.isTextBased()) {
      await canal.send(texto).catch(() => {});
      continue;
    }

    // Canal sumiu (ou era DM): tenta no privado.
    const usuario = await client.users.fetch(lembrete.user_id).catch(() => null);
    await usuario?.send(`⏰ **Lembrete:** ${lembrete.texto}`).catch(() => {});
  }

  return prontos.length;
}
