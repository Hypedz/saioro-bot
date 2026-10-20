import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { montarAjuda } from '../../lib/ajuda.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra os comandos do bot, separados por categoria.')
    .addStringOption((opcao) =>
      opcao
        .setName('comando')
        .setDescription('Ver detalhes de um comando específico')
        .setAutocomplete(false),
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

    const opcoes = (comando.data.options ?? [])
      .map((o) => `\`${o.required ? `<${o.name}>` : `[${o.name}]`}\` — ${o.description}`)
      .join('\n');

    const painel = montarAjuda(interaction.client, comando.categoria).embeds[0];
    painel
      .setTitle(`/${comando.data.name}`)
      .setDescription(
        [
          comando.data.description,
          opcoes ? `\n**Opções**\n${opcoes}` : '',
        ].join('\n'),
      );

    await interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
  },
};
