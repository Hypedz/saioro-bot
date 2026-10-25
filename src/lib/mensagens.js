import { db } from '../db.js';

const somar = db.prepare(`
  INSERT INTO mensagens (guild_id, user_id, total)
  VALUES (?, ?, 1)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET total = total + 1
`);

const consultar = db.prepare('SELECT total FROM mensagens WHERE guild_id = ? AND user_id = ?');

/** Conta uma mensagem de membro (sem guardar conteúdo). */
export function contarMensagem(guildId, userId) {
  try {
    somar.run(guildId, userId);
  } catch (erro) {
    console.error('[ERRO] Falha ao contar mensagem:', erro.message);
  }
}

export function contarMensagens(guildId, userId) {
  return Number(consultar.get(guildId, userId)?.total ?? 0);
}
