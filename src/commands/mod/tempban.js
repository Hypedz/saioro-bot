import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { CORES_LOG, enviarLog } from '../../lib/logs.js';
import { avisarNoPrivado, marcarAcaoDoBot, problemaComAlvo } from '../../lib/moderacao.js';
import { formatarDuracao, parseDuracao, quandoTermina } from '../../lib/tempo.js';
import { registrarTempban } from '../../lib/tempbans.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Bane um membro por um tempo e desbane sozinho depois.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('membro').setDescription('Quem banir').setRequired(true))
    .addStringOption((o) =>
      o
        .setName('duracao')
        .setDescription('Ex.: 30m, 2h, 7d (máximo 30 dias)')
        .setRequired(true)
        .setMaxLength(20),
    )
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
    const duracaoTexto = interaction.options.getString('duracao', true);
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';
    const dias = interaction.options.getInteger('apagar') ?? 0;

    const duracao = parseDuracao(duracaoTexto);
    if (!duracao) {
      return interaction.reply({
        content: 'Não entendi a duração. Use algo como `30m`, `2h` ou `7d` (máximo 30 dias).',
        flags: MessageFlags.Ephemeral,
      });
    }

    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    const problema = problemaComAlvo(interaction, membro);
    if (problema) {
      return interaction.reply({ content: problema, flags: MessageFlags.Ephemeral });
    }

    const jaBanido = await interaction.guild.bans.fetch(usuario.id).catch(() => null);
    if (jaBanido) {
      return interaction.reply({
        content: 'Esse usuário já está banido. Use `/unban` para remover ou `/tempban` não é necessário.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await avisarNoPrivado(
      usuario,
      `Você foi banido temporariamente de ${interaction.guild.name}`,
      `**Motivo:** ${motivo}\n**Duração:** ${formatarDuracao(duracao)}\n**Volta:** ${quandoTermina(duracao)}`,
    );

    marcarAcaoDoBot('ban', usuario.id);

    await membro.ban({
      reason: `Tempban de ${formatarDuracao(duracao)}: ${motivo} (por ${interaction.user.tag})`,
      deleteMessageSeconds: dias * 86400,
    });

    registrarTempban({
      guildId: interaction.guild.id,
      userId: usuario.id,
      moderatorId: interaction.user.id,
      motivo,
      expiraEm: Date.now() + duracao,
    });

    const painel = embed(
      '⏳ Banimento temporário',
      `<@${usuario.id}> foi banido por **${formatarDuracao(duracao)}**.`,
      CORES.erro,
    ).addFields(
      { name: 'Motivo', value: motivo },
      { name: 'Termina', value: quandoTermina(duracao), inline: true },
      { name: 'Por', value: `${interaction.user}`, inline: true },
      { name: 'Mensagens apagadas', value: dias ? `${dias} dia(s)` : 'nenhuma', inline: true },
    );

    await interaction.reply({ embeds: [painel] });
    await enviarLog(
      interaction.guild,
      embed(
        '⏳ Banimento temporário',
        `<@${usuario.id}> (\`${usuario.id}\`) por ${interaction.user}.\n**Motivo:** ${motivo}\n**Duração:** ${formatarDuracao(duracao)}`,
        CORES_LOG.moderacao,
      ),
    );
  },
};
