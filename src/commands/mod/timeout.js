import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { CORES_LOG, enviarLog } from '../../lib/logs.js';
import { avisarNoPrivado, problemaComAlvo } from '../../lib/moderacao.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Silencia um membro por um tempo (0 minutos = remover o castigo).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('membro').setDescription('Quem castigar').setRequired(true))
    .addIntegerOption((o) =>
      o
        .setName('minutos')
        .setDescription('Duração em minutos (0 a 10080)')
        .setMinValue(0)
        .setMaxValue(10080)
        .setRequired(true),
    )
    .addStringOption((o) => o.setName('motivo').setDescription('Motivo').setMaxLength(300)),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro', true);
    const minutos = interaction.options.getInteger('minutos', true);
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';

    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    const problema = problemaComAlvo(interaction, membro);
    if (problema) {
      return interaction.reply({ content: problema, flags: MessageFlags.Ephemeral });
    }

    if (!membro.moderatable) {
      return interaction.reply({
        content: 'Não consigo castigar esse membro (permissões ou hierarquia).',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (minutos === 0) {
      await membro.timeout(null, `Castigo removido por ${interaction.user.tag}`);
      await interaction.reply({
        embeds: [embed('🔊 Castigo removido', `<@${usuario.id}> pode falar de novo.`, CORES.sucesso)],
      });
      return;
    }

    await avisarNoPrivado(
      usuario,
      `Você ficou de castigo em ${interaction.guild.name}`,
      `**Duração:** ${minutos} minuto(s)\n**Motivo:** ${motivo}`,
    );

    await membro.timeout(minutos * 60_000, `${motivo} (por ${interaction.user.tag})`);

    await interaction.reply({
      embeds: [
        embed(
          '🔇 Castigo',
          `<@${usuario.id}> está silenciado por **${minutos} minuto(s)**.\n**Motivo:** ${motivo}`,
          CORES.aviso,
        ),
      ],
    });

    await enviarLog(
      interaction.guild,
      embed(
        '🔇 Castigo',
        `<@${usuario.id}> por **${minutos} min** — por ${interaction.user}.\n**Motivo:** ${motivo}`,
        CORES_LOG.moderacao,
      ),
    );
  },
};
