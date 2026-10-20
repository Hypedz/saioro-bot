import { db } from '../db.js';

export function criarSnippet({ guildId, nome, conteudo, autorId }) {
  const existente = db
    .prepare('SELECT id FROM snippets WHERE guild_id = ? AND nome = ?')
    .get(guildId, nome);

  if (existente) {
    db.prepare('UPDATE snippets SET conteudo = ?, autor_id = ?, criado_em = ? WHERE id = ?').run(
      conteudo,
      autorId,
      Date.now(),
      existente.id,
    );
    return { id: Number(existente.id), atualizado: true };
  }

  const resultado = db
    .prepare('INSERT INTO snippets (guild_id, nome, conteudo, autor_id, criado_em) VALUES (?, ?, ?, ?, ?)')
    .run(guildId, nome, conteudo, autorId, Date.now());

  return { id: Number(resultado.lastInsertRowid), atualizado: false };
}

export function obterSnippet(guildId, nome) {
  return db
    .prepare('SELECT * FROM snippets WHERE guild_id = ? AND nome = ?')
    .get(guildId, nome.toLowerCase());
}

export function listarSnippets(guildId) {
  return db
    .prepare('SELECT nome, autor_id, criado_em FROM snippets WHERE guild_id = ? ORDER BY nome ASC')
    .all(guildId);
}

export function apagarSnippet(guildId, nome) {
  return db.prepare('DELETE FROM snippets WHERE guild_id = ? AND nome = ?').run(guildId, nome).changes;
}
