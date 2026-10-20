import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('servericon')
    .setDescription('Mostra o ícone e o banner do servidor em tamanho cheio.'),

  async execute(interaction) {
    const { guild } = interaction;
    if (!guild) {
      return interaction.reply({ content: 'Só funciona em servidores.', flags: MessageFlags.Ephemeral });
    }

    const icone = guild.iconURL({ size: 4096 });
    if (!icone) {
      return interaction.reply({ content: 'Este servidor não tem ícone.', flags: MessageFlags.Ephemeral });
    }

    const painel = embed(guild.name, null, CORES.principal)
      .setImage(icone)
      .addFields({ name: 'Ícone', value: `[abrir em 4096px](${icone})` });

    const banner = guild.bannerURL({ size: 2048 });
    if (banner) painel.addFields({ name: 'Banner', value: `[abrir](${banner})` });

    await interaction.reply({ embeds: [painel] });
  },
};
