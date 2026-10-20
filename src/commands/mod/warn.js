import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { dataCurta, embed, CORES } from '../../lib/embeds.js';
import { CORES_LOG, enviarLog } from '../../lib/logs.js';
import { avisarNoPrivado, contarAvisos, problemaComAlvo, registrarAviso } from '../../lib/moderacao.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Dá uma advertência a um membro.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('membro').setDescription('Quem advertir').setRequired(true))
    .addStringOption((o) =>
      o.setName('motivo').setDescription('Motivo da advertência').setRequired(true).setMaxLength(300),
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro', true);
    const motivo = interaction.options.getString('motivo', true);

    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    const problema = problemaComAlvo(interaction, membro);
    if (problema) {
      return interaction.reply({ content: problema, flags: MessageFlags.Ephemeral });
    }

    const id = registrarAviso({
      guildId: interaction.guild.id,
      userId: usuario.id,
      moderatorId: interaction.user.id,
      motivo,
    });

    const total = contarAvisos(interaction.guild.id, usuario.id);

    await avisarNoPrivado(
      usuario,
      `Você recebeu uma advertência em ${interaction.guild.name}`,
      `**Motivo:** ${motivo}\n**Total de avisos:** ${total}`,
    );

    await interaction.reply({
      embeds: [
        embed('⚠️ Advertência', `<@${usuario.id}> recebeu um aviso.`, CORES.aviso).addFields(
          { name: 'Motivo', value: motivo },
          { name: 'Registro', value: `\`#${id}\``, inline: true },
          { name: 'Total', value: `**${total}**`, inline: true },
        ),
      ],
    });

    await enviarLog(
      interaction.guild,
      embed(
        '⚠️ Advertência',
        `<@${usuario.id}> recebeu o aviso \`#${id}\` de ${interaction.user}.\n**Motivo:** ${motivo}\n**Total:** ${total}`,
        CORES_LOG.moderacao,
      ),
    );
  },
};
