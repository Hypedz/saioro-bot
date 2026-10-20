import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { montarAjuda, subcomandos } from '../../lib/ajuda.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra os comandos do bot, separados por categoria.')
    .addStringOption((opcao) =>
      opcao
        .setName('comando')
        .setDescription('Ver detalhes de um comando específico')
        .setAutocomplete(true),
    ),

  async execute(interaction) {
    const alvo = interaction.options.getString('comando');

    if (!alvo) {
      return interaction.reply({
        ...montarAjuda(interaction.client, 'util'),
        flags: MessageFlags.Ephemeral,
      });
    }

    const comando = interaction.client.commands.get(alvo.replace(/^\//, '').toLowerCase());
    if (!comando) {
      return interaction.reply({
        content: `Não achei o comando \`${alvo}\`. Use \`/help\` para ver a lista.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const subs = subcomandos(comando);
    const opcoes = comando.data.options ?? [];

    let detalhe = '';

    if (subs.length) {
      detalhe = [
        '**Subcomandos**',
        ...subs.map((sub) => `\`${sub.name}\` — ${sub.description}`),
      ].join('\n');
    } else if (opcoes.length) {
      detalhe = [
        '**Opções**',
        ...opcoes.map(
          (opcao) =>
            `\`${opcao.required ? `<${opcao.name}>` : `[${opcao.name}]`}\` — ${opcao.description}`,
        ),
      ].join('\n');
    }

    const painel = montarAjuda(interaction.client, comando.categoria).embeds[0];
    painel
      .setTitle(`/${comando.data.name}`)
      .setDescription([comando.data.description, detalhe ? `\n${detalhe}` : ''].join('\n'));

    await interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
  },

  async autocomplete(interaction) {
    const foco = interaction.options.getFocused().replace(/^\//, '').toLowerCase();

    const opcoes = [...interaction.client.commands.values()]
      .filter((comando) => comando.data.name.includes(foco))
      .sort((a, b) => a.data.name.localeCompare(b.data.name))
      .slice(0, 25)
      .map((comando) => ({
        name: `/${comando.data.name}`,
        value: comando.data.name,
      }));

    return interaction.respond(opcoes);
  },
};
