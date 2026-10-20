import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Silencia um membro por um tempo.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opcao) =>
      opcao.setName('membro').setDescription('Quem vai ficar de castigo').setRequired(true),
    )
    .addIntegerOption((opcao) =>
      opcao
        .setName('minutos')
        .setDescription('Duracao em minutos (1 a 1440)')
        .setMinValue(1)
        .setMaxValue(1440)
        .setRequired(true),
    )
    .addStringOption((opcao) =>
      opcao.setName('motivo').setDescription('Motivo do castigo').setMaxLength(300),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando so funciona dentro de um servidor.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const usuario = interaction.options.getUser('membro', true);
    const minutos = interaction.options.getInteger('minutos', true);
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';

    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (!membro) {
      return interaction.reply({
        content: 'Nao encontrei esse membro no servidor.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!membro.moderatable) {
      return interaction.reply({
        content: 'Nao posso castigar esse membro. Ele tem um cargo acima do meu.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await membro.timeout(minutos * 60 * 1000, motivo);

    await interaction.reply({
      content: `🔇 ${usuario} ficou de castigo por **${minutos} min**.\nMotivo: ${motivo}`,
    });
  },
};
