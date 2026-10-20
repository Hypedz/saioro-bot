import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Tranca o canal para @everyone.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((o) => o.setName('canal').setDescription('Canal (padrão: este)'))
    .addStringOption((o) => o.setName('motivo').setDescription('Motivo').setMaxLength(200)),

  async execute(interaction) {
    const canal = interaction.options.getChannel('canal') ?? interaction.channel;
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';

    if (!canal?.isTextBased()) {
      return interaction.reply({
        content: 'Esse canal não pode ser trancado.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!canal.permissionsFor(interaction.guild.members.me)?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: `Preciso da permissão **Gerenciar Canais** em ${canal}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    await canal.permissionOverwrites.edit(
      interaction.guild.roles.everyone,
      { SendMessages: false },
      { reason: `${motivo} (por ${interaction.user.tag})` },
    );

    await interaction.reply({
      embeds: [embed('🔒 Canal trancado', `${canal} está fechado.\n**Motivo:** ${motivo}`, CORES.aviso)],
    });
  },
};
