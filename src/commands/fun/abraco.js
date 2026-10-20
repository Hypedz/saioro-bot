import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { buscarGif } from '../../lib/gifs.js';

export default {
  data: new SlashCommandBuilder()
    .setName('abraco')
    .setDescription('Manda um abraço para alguém.')
    .addUserOption((o) => o.setName('membro').setDescription('Quem recebe').setRequired(true)),

  async execute(interaction) {
    const alvo = interaction.options.getUser('membro', true);
    const gif = await buscarGif('hug');

    const painel = embed(
      '🤗 Abraço',
      `<@${interaction.user.id}> deu um abraço em <@${alvo.id}>!`,
      CORES.sucesso,
    );

    if (gif) painel.setImage(gif);

    await interaction.reply({ embeds: [painel] });
  },
};
