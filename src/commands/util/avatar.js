import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Mostra o avatar de um membro em tamanho cheio.')
    .addUserOption((opcao) =>
      opcao.setName('membro').setDescription('Quem ver (padrão: você)'),
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro') ?? interaction.user;
    const completo = await usuario.fetch(true).catch(() => usuario);

    const painel = embed(usuario.username, null, CORES.principal)
      .setImage(completo.displayAvatarURL({ size: 1024, extension: 'png' }))
      .addFields(
        {
          name: 'Avatar',
          value: `[png](${completo.displayAvatarURL({ size: 1024, extension: 'png' })}) • [webp](${completo.displayAvatarURL(
            { size: 1024, extension: 'webp' },
          )})`,
          inline: true,
        },
      );

    if (completo.banner) {
      painel.addFields({
        name: 'Banner',
        value: `[abrir](${completo.bannerURL({ size: 1024 })})`,
        inline: true,
      });
    }

    await interaction.reply({ embeds: [painel] });
  },
};
