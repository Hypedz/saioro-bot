import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('moeda').setDescription('Joga uma moeda para o alto.'),

  async execute(interaction) {
    const cara = Math.random() < 0.5;
    await interaction.reply({
      embeds: [
        embed(
          '🪙 Cara ou coroa',
          cara ? 'Deu **cara**! 👑' : 'Deu **coroa**! 🪙',
          cara ? CORES.aviso : CORES.principal,
        ),
      ],
    });
  },
};
