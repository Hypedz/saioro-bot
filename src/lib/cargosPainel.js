import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db } from '../db.js';
import { CORES, embed } from './embeds.js';

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

/** Monta o painel reutilizável do /cargos-painel e do painel inicial. */
export function montarPainelCargos(guild, cargos) {
  const linhas = [];
  let atual = new ActionRowBuilder();

  for (const item of cargos) {
    const cargo = guild.roles.cache.get(item.role_id);
    if (!cargo) continue;

    const botao = new ButtonBuilder()
      .setCustomId(`cargo:${cargo.id}`)
      .setLabel(cargo.name.slice(0, 80))
      .setStyle(ButtonStyle.Secondary);

    if (item.emoji) botao.setEmoji(item.emoji);

    atual.addComponents(botao);

    if (atual.components.length === 5) {
      linhas.push(atual);
      atual = new ActionRowBuilder();
    }
  }

  if (atual.components.length > 0) linhas.push(atual);

  const painel = embed(
    '🎭 Escolha seus cargos',
    'Clique para receber ou remover um cargo. Clique de novo para sair.',
    CORES.principal,
  );

  return { embeds: [painel], components: linhas.slice(0, 5) };
}
