import { db } from '../db.js';
import { CORES_LOG, enviarLog } from './logs.js';
import { embed } from './embeds.js';
import { marcarAcaoDoBot } from './moderacao.js';

export function registrarTempban({ guildId, userId, moderatorId, motivo, expiraEm }) {
  db.prepare(`
    INSERT INTO tempbans (guild_id, user_id, moderator_id, motivo, expira_em)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      moderator_id = excluded.moderator_id,
      motivo       = excluded.motivo,
      expira_em    = excluded.expira_em
  `).run(guildId, userId, moderatorId, motivo, expiraEm);
}

export function tempbanDoUsuario(guildId, userId) {
  return db.prepare('SELECT * FROM tempbans WHERE guild_id = ? AND user_id = ?').get(guildId, userId) ?? null;
}

export function removerTempban(guildId, userId) {
  return db.prepare('DELETE FROM tempbans WHERE guild_id = ? AND user_id = ?').run(guildId, userId).changes;
}

function vencidos(agora = Date.now()) {
  return db.prepare('SELECT * FROM tempbans WHERE expira_em <= ?').all(agora);
}

/**
 * Desbane quem cumpriu o tempban. Roda no start e a cada minuto.
 * Se o Discord falhar, o registro fica e tentamos de novo no proximo ciclo.
 */
export async function tickTempbans(client) {
  for (const registro of vencidos()) {
    const guild = client.guilds.cache.get(registro.guild_id);
    if (!guild) continue;

    const banido = await guild.bans.fetch(registro.user_id).catch(() => null);

    if (banido) {
      marcarAcaoDoBot('unban', registro.user_id);

      const removido = await guild.bans
        .remove(registro.user_id, 'Tempban expirado')
        .then(() => true)
        .catch((erro) => {
          console.error('[ERRO] Tempban não removido:', erro.message);
          return false;
        });

      if (!removido) continue;

      await enviarLog(
        guild,
        embed(
          '⏰ Tempban expirado',
          `<@${registro.user_id}> (\`${registro.user_id}\`) foi desbanido automaticamente.`,
          CORES_LOG.moderacao,
        ),
      );
    }

    removerTempban(registro.guild_id, registro.user_id);
  }
}
