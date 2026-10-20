import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Destranca o canal para @everyone.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((o) => o.setName('canal').setDescription('Canal (padrão: este)')),

  async execute(interaction) {
    const canal = interaction.options.getChannel('canal') ?? interaction.channel;

    if (!canal?.isTextBased()) {
      return interaction.reply({
        content: 'Esse canal não pode ser destrancado.',
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
      { SendMessages: null },
      { reason: `Destrancado por ${interaction.user.tag}` },
    );

    await interaction.reply({
      embeds: [embed('🔓 Canal aberto', `${canal} voltou a aceitar mensagens.`, CORES.sucesso)],
    });
  },
};
