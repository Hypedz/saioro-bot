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

/** Mesma pergunta duas vezes atualiza a resposta, em vez de duplicar. */
export function adicionarFaq({ guildId, pergunta, resposta, categoria, autorId }) {
  db.prepare(`
    INSERT INTO faq (guild_id, pergunta, resposta, categoria, autor_id, criado_em)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id, pergunta) DO UPDATE SET
      resposta  = excluded.resposta,
      categoria = excluded.categoria,
      autor_id  = excluded.autor_id,
      criado_em = excluded.criado_em
  `).run(guildId, pergunta, resposta, categoria ?? null, autorId, Date.now());
}

export function removerFaq(guildId, id) {
  return db.prepare('DELETE FROM faq WHERE guild_id = ? AND id = ?').run(guildId, id).changes;
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
