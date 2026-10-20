import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lista os comandos do bot.'),

  async execute(interaction) {
    const comandos = [...interaction.client.commands.values()].sort((a, b) =>
      a.data.name.localeCompare(b.data.name),
    );

    const lista = comandos
      .map((comando) => `**/${comando.data.name}**\n${comando.data.description}`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Comandos disponiveis')
      .setDescription(lista || 'Nenhum comando carregado.')
      .setFooter({ text: `${comandos.length} comando(s)` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
