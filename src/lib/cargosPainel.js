import { db } from '../db.js';

export function listarCargosPainel(guildId) {
  return db
    .prepare('SELECT * FROM cargos_painel WHERE guild_id = ? ORDER BY role_id ASC')
    .all(guildId);
}

export function adicionarCargoPainel(guildId, roleId, emoji) {
  db.prepare(`
    INSERT INTO cargos_painel (guild_id, role_id, emoji) VALUES (?, ?, ?)
    ON CONFLICT(guild_id, role_id) DO UPDATE SET emoji = excluded.emoji
  `).run(guildId, roleId, emoji ?? null);
}

export function removerCargoPainel(guildId, roleId) {
  return db.prepare('DELETE FROM cargos_painel WHERE guild_id = ? AND role_id = ?').run(guildId, roleId)
    .changes;
}
