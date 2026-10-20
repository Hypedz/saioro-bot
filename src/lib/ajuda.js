import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { CORES, embed } from './embeds.js';

export const CATEGORIAS = {
  util: { nome: 'Utilidade', emoji: '🧰' },
  mod: { nome: 'Moderação', emoji: '🛡️' },
  fun: { nome: 'Diversão', emoji: '🎲' },
  social: { nome: 'Social', emoji: '🎉' },
  config: { nome: 'Configuração', emoji: '⚙️' },
};

function opcoesDoMenu(categoriaAtual) {
  return Object.entries(CATEGORIAS).map(([valor, info]) => ({
    label: info.nome,
    value: valor,
    emoji: info.emoji,
    default: valor === categoriaAtual,
  }));
}

/** Monta o painel do /help para uma categoria. */
export function montarAjuda(client, categoria = 'util') {
  const info = CATEGORIAS[categoria] ?? CATEGORIAS.util;

  const comandos = [...client.commands.values()]
    .filter((comando) => comando.categoria === categoria)
    .sort((a, b) => a.data.name.localeCompare(b.data.name));

  const lista = comandos.length
    ? comandos
        .map((comando) => {
          const opcoes = comando.data.options?.length
            ? ` ${comando.data.options.map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`)).join(' ')}`
            : '';
          return `**/${comando.data.name}**${opcoes}\n${comando.data.description}`;
        })
        .join('\n\n')
    : '_Nenhum comando nesta categoria ainda._';

  const embedAjuda = embed(
    `${info.emoji} ${info.nome}`,
    lista,
    CORES.principal,
  ).setFooter({
    text: `${comandos.length} comando(s) • ${client.commands.size} no total`,
  });

  const menu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ajuda')
      .setPlaceholder('Escolha uma categoria')
      .addOptions(opcoesDoMenu(categoria)),
  );

  return { embeds: [embedAjuda], components: [menu] };
}
