import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Mostra o banner de um usuário.')
    .addUserOption((o) => o.setName('membro').setDescription('Quem ver (padrão: você)')),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro') ?? interaction.user;
    const completo = await usuario.fetch(true).catch(() => usuario);

    if (!completo.banner) {
      return interaction.reply({
        content: `${usuario} não tem banner (ou ele é um dos banners padrão do Nitro).`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const url = completo.bannerURL({ size: 1024 });

    await interaction.reply({
      embeds: [
        embed(`Banner de ${usuario.username}`, null, CORES.principal)
          .setImage(url)
          .addFields({ name: 'Link', value: `[abrir em 1024px](${url})` }),
      ],
    });
  },
};
