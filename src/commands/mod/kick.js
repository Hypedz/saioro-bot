import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { CORES_LOG, enviarLog } from '../../lib/logs.js';
import { avisarNoPrivado, problemaComAlvo } from '../../lib/moderacao.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um membro do servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName('membro').setDescription('Quem expulsar').setRequired(true))
    .addStringOption((o) => o.setName('motivo').setDescription('Motivo').setMaxLength(300)),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro', true);
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';

    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    const problema = problemaComAlvo(interaction, membro);
    if (problema) {
      return interaction.reply({ content: problema, flags: MessageFlags.Ephemeral });
    }

    if (!membro.kickable) {
      return interaction.reply({
        content: 'Não consigo expulsar esse membro (permissões ou hierarquia).',
        flags: MessageFlags.Ephemeral,
      });
    }

    await avisarNoPrivado(
      usuario,
      `Você foi expulso de ${interaction.guild.name}`,
      `**Motivo:** ${motivo}`,
    );

    await membro.kick(`${motivo} (por ${interaction.user.tag})`);

    await interaction.reply({
      embeds: [
        embed('👢 Expulsão', `<@${usuario.id}> foi expulso.\n**Motivo:** ${motivo}`, CORES.aviso),
      ],
    });

    await enviarLog(
      interaction.guild,
      embed(
        '👢 Expulsão',
        `<@${usuario.id}> (\`${usuario.id}\`) por ${interaction.user}.\n**Motivo:** ${motivo}`,
        CORES_LOG.moderacao,
      ),
    );
  },
};
