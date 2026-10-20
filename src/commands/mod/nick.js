import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { problemaComAlvo } from '../../lib/moderacao.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Troca o apelido de um membro (vazio para restaurar).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((o) => o.setName('membro').setDescription('Quem alterar').setRequired(true))
    .addStringOption((o) =>
      o.setName('apelido').setDescription('Novo apelido (deixe vazio para remover)').setMaxLength(32),
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro', true);
    const apelido = interaction.options.getString('apelido');

    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    const problema = problemaComAlvo(interaction, membro);
    if (problema) {
      return interaction.reply({ content: problema, flags: MessageFlags.Ephemeral });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.reply({
        content: 'Preciso da permissão **Gerenciar Apelidos**.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!membro.manageable) {
      return interaction.reply({
        content: 'Não consigo mudar o apelido desse membro (hierarquia).',
        flags: MessageFlags.Ephemeral,
      });
    }

    await membro.setNickname(apelido?.trim() || null, `Por ${interaction.user.tag}`);

    await interaction.reply({
      embeds: [
        embed(
          '📝 Apelido alterado',
          apelido?.trim()
            ? `<@${usuario.id}> agora é **${apelido.trim()}**.`
            : `O apelido de <@${usuario.id}> foi removido.`,
          CORES.sucesso,
        ),
      ],
    });
  },
};
