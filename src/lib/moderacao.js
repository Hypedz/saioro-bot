import { db } from '../db.js';

/** Retorna um texto de erro se o autor nao pode agir sobre o membro. */
export function problemaComAlvo(interaction, membro) {
  if (!membro) return 'Não encontrei esse membro no servidor.';

  const { guild, member: autor } = interaction;
  const eu = guild.members.me;

  if (membro.id === autor.id) return 'Você não pode fazer isso consigo mesmo.';
  if (membro.id === interaction.client.user.id) return 'Não posso fazer isso comigo mesmo.';
  if (membro.id === guild.ownerId) return 'Não dá para punir o dono do servidor.';

  if (autor.id !== guild.ownerId && autor.roles.highest.position <= membro.roles.highest.position) {
    return 'Esse membro tem cargo igual ou acima do seu.';
  }

  if (eu.roles.highest.position <= membro.roles.highest.position) {
    return 'Meu cargo está abaixo do cargo desse membro — não consigo agir nele.';
  }

  return null;
}

/** Tenta avisar o membro no privado. Falha silenciosamente se o DM estiver fechado. */
export async function avisarNoPrivado(usuario, titulo, descricao) {
  await usuario
    ?.send({ embeds: [{ color: 0xe74c3c, title: titulo, description: descricao }] })
    .catch(() => {});
}

export function registrarAviso({ guildId, userId, moderatorId, motivo }) {
  const resultado = db
    .prepare(
      'INSERT INTO avisos (guild_id, user_id, moderator_id, motivo, criado_em) VALUES (?, ?, ?, ?, ?)',
    )
    .run(guildId, userId, moderatorId, motivo, Date.now());

  return Number(resultado.lastInsertRowid);
}

export function avisosDoMembro(guildId, userId) {
  return db
    .prepare('SELECT * FROM avisos WHERE guild_id = ? AND user_id = ? ORDER BY id DESC')
    .all(guildId, userId);
}

export function contarAvisos(guildId, userId) {
  const linha = db
    .prepare('SELECT COUNT(*) AS total FROM avisos WHERE guild_id = ? AND user_id = ?')
    .get(guildId, userId);
  return Number(linha?.total ?? 0);
}

export function apagarAviso(guildId, id) {
  return db.prepare('DELETE FROM avisos WHERE guild_id = ? AND id = ?').run(guildId, id).changes;
}
