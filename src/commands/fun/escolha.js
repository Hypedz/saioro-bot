import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('escolha')
    .setDescription('Sorteia uma opção entre as que você der.')
    .addStringOption((o) =>
      o
        .setName('opcoes')
        .setDescription('Separe por " | " (ex: pizza | sushi | hambúrguer)')
        .setRequired(true)
        .setMaxLength(500),
    ),

  async execute(interaction) {
    const opcoes = interaction.options
      .getString('opcoes', true)
      .split('|')
      .map((o) => o.trim())
      .filter(Boolean);

    if (opcoes.length < 2) {
      return interaction.reply({
        content: 'Me dê pelo menos duas opções separadas por `|`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)];

    await interaction.reply({
      embeds: [
        embed(
          '🎯 Escolha',
          `Entre ${opcoes.length} opções, eu escolho:\n\n**${escolhida}**`,
          CORES.destaque,
        ).setFooter({ text: opcoes.join(' • ') }),
      ],
    });
  },
};
