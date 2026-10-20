import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { CORES_LOG, enviarLog } from '../../lib/logs.js';
import { avisarNoPrivado, problemaComAlvo } from '../../lib/moderacao.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um membro do servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('membro').setDescription('Quem banir').setRequired(true))
    .addStringOption((o) => o.setName('motivo').setDescription('Motivo do banimento').setMaxLength(300))
    .addIntegerOption((o) =>
      o
        .setName('apagar')
        .setDescription('Apagar mensagens recentes dele')
        .addChoices(
          { name: 'Não apagar', value: 0 },
          { name: 'Últimas 24 horas', value: 1 },
          { name: 'Últimos 7 dias', value: 7 },
        ),
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro', true);
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';
    const dias = interaction.options.getInteger('apagar') ?? 0;

    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    const problema = problemaComAlvo(interaction, membro);
    if (problema) {
      return interaction.reply({ content: problema, flags: MessageFlags.Ephemeral });
    }

    await avisarNoPrivado(
      usuario,
      `Você foi banido de ${interaction.guild.name}`,
      `**Motivo:** ${motivo}`,
    );

    await membro.ban({ reason: `${motivo} (por ${interaction.user.tag})`, deleteMessageSeconds: dias * 86400 });

    const painel = embed('🔨 Banimento', `<@${usuario.id}> foi banido.`, CORES.erro).addFields(
      { name: 'Motivo', value: motivo },
      { name: 'Por', value: `${interaction.user}`, inline: true },
      { name: 'Mensagens apagadas', value: dias ? `${dias} dia(s)` : 'nenhuma', inline: true },
    );

    await interaction.reply({ embeds: [painel] });
    await enviarLog(
      interaction.guild,
      embed('🔨 Banimento', `<@${usuario.id}> (\`${usuario.id}\`) foi banido por ${interaction.user}.\n**Motivo:** ${motivo}`, CORES_LOG.moderacao),
    );
  },
};
