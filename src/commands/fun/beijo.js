import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { buscarGif } from '../../lib/gifs.js';

export default {
  data: new SlashCommandBuilder()
    .setName('beijo')
    .setDescription('Manda um beijo para alguém.')
    .addUserOption((o) => o.setName('membro').setDescription('Quem recebe').setRequired(true)),

  async execute(interaction) {
    const alvo = interaction.options.getUser('membro', true);
    const gif = await buscarGif('kiss');

    const painel = embed(
      '😘 Beijo',
      `<@${interaction.user.id}> mandou um beijo para <@${alvo.id}>!`,
      0xeb459e,
    );

    if (gif) painel.setImage(gif);

    await interaction.reply({ embeds: [painel] });
  },
};
