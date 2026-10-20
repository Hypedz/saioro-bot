import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { db } from '../db.js';

export function listarFaq(guildId) {
  return db
    .prepare('SELECT * FROM faq WHERE guild_id = ? ORDER BY categoria IS NULL, categoria, pergunta')
    .all(guildId);
}

export function contarFaq(guildId) {
  return Number(
    db.prepare('SELECT COUNT(*) AS total FROM faq WHERE guild_id = ?').get(guildId)?.total ?? 0,
  );
}

export function obterFaq(guildId, id) {
  return db.prepare('SELECT * FROM faq WHERE guild_id = ? AND id = ?').get(guildId, id) ?? null;
}

/**
 * Mesma pergunta (ignorando maiúsculas/minúsculas) atualiza a resposta,
 * em vez de criar uma duplicata.
 * @returns {{ id: number, atualizada: boolean }}
 */
export function adicionarFaq({ guildId, pergunta, resposta, categoria, autorId }) {
  const existente = db
    .prepare('SELECT id FROM faq WHERE guild_id = ? AND pergunta COLLATE NOCASE = ?')
    .get(guildId, pergunta);

  if (existente) {
    db.prepare(`
      UPDATE faq
         SET pergunta  = ?,
             resposta  = ?,
             categoria = ?,
             autor_id  = ?,
             criado_em = ?
       WHERE id = ?
    `).run(pergunta, resposta, categoria ?? null, autorId, Date.now(), existente.id);

    return { id: Number(existente.id), atualizada: true };
  }

  const resultado = db.prepare(`
    INSERT INTO faq (guild_id, pergunta, resposta, categoria, autor_id, criado_em)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(guildId, pergunta, resposta, categoria ?? null, autorId, Date.now());

  return { id: Number(resultado.lastInsertRowid), atualizada: false };
}

export function removerFaq(guildId, id) {
  return db.prepare('DELETE FROM faq WHERE guild_id = ? AND id = ?').run(guildId, id).changes;
}

/** Cabeçalho do menu, avisando quando o Discord corta em 25. */
export function resumoFaq(itens) {
  const total = itens.length;
  const corte = total > 25 ? ` — mostrando 25 de ${total}` : '';
  return `📖 **Perguntas frequentes** (${total})${corte}`;
}

/** Menu de selecao com ate 25 perguntas (limite do Discord). */
export function menuFaq(itens) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('faq:mostrar')
    .setPlaceholder('Escolha uma pergunta');

  if (itens.length === 0) {
    menu.addOptions([{ label: 'Nenhuma pergunta cadastrada', value: '0' }]).setDisabled(true);
    return new ActionRowBuilder().addComponents(menu);
  }

  menu.addOptions(
    itens.slice(0, 25).map((item) => ({
      label: item.pergunta.slice(0, 100),
      description: (item.categoria ?? 'Pergunta frequente').slice(0, 100),
      value: String(item.id),
    })),
  );

  return new ActionRowBuilder().addComponents(menu);
}
