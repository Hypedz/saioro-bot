import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Define o modo lento de um canal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((o) =>
      o
        .setName('segundos')
        .setDescription('0 desliga o modo lento (máx: 21600)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true),
    )
    .addChannelOption((o) => o.setName('canal').setDescription('Canal (padrão: este)')),

  async execute(interaction) {
    const segundos = interaction.options.getInteger('segundos', true);
    const canal = interaction.options.getChannel('canal') ?? interaction.channel;

    if (!canal?.isTextBased() || typeof canal.setRateLimitPerUser !== 'function') {
      return interaction.reply({
        content: 'Esse canal não aceita modo lento.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!canal.permissionsFor(interaction.guild.members.me)?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: `Preciso da permissão **Gerenciar Canais** em ${canal}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    await canal.setRateLimitPerUser(segundos, `Por ${interaction.user.tag}`);

    const frase = segundos
      ? `Modo lento de ${canal} definido para **${segundos}s**.`
      : `Modo lento de ${canal} **desligado**.`;

    await interaction.reply({ embeds: [embed('🐢 Modo lento', frase, CORES.sucesso)] });
  },
};
