import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  StringSelectMenuBuilder,
} from 'discord.js';
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

/** Subcomandos (e grupos) de um comando, se houver. */
export function subcomandos(comando) {
  return (comando.data.options ?? []).filter((opcao) => {
    // Builders só expõem o tipo no toJSON(); comandos já serializados têm .type.
    const tipo = typeof opcao.toJSON === 'function' ? opcao.toJSON().type : opcao.type;

    return (
      tipo === ApplicationCommandOptionType.Subcommand ||
      tipo === ApplicationCommandOptionType.SubcommandGroup
    );
  });
}

/** Assinatura curta: "membro <motivo>" ou "ver | adicionar | remover". */
function assinatura(comando) {
  const subs = subcomandos(comando);
  if (subs.length) return ` ${subs.map((sub) => sub.name).join(' | ')}`;

  const opcoes = comando.data.options ?? [];
  if (!opcoes.length) return '';

  return ` ${opcoes
    .map((opcao) => (opcao.required ? `<${opcao.name}>` : `[${opcao.name}]`))
    .join(' ')}`;
}

/** Monta o painel do /help para uma categoria. */
export function montarAjuda(client, categoria = 'util') {
  const info = CATEGORIAS[categoria] ?? CATEGORIAS.util;

  const comandos = [...client.commands.values()]
    .filter((comando) => comando.categoria === categoria)
    .sort((a, b) => a.data.name.localeCompare(b.data.name));

  const lista = comandos.length
    ? comandos
        .map(
          (comando) =>
            `**/${comando.data.name}**${assinatura(comando)}\n${comando.data.description}`,
        )
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
