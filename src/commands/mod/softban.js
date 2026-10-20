import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { CORES_LOG, enviarLog } from '../../lib/logs.js';
import { avisarNoPrivado, marcarAcaoDoBot, problemaComAlvo } from '../../lib/moderacao.js';
import { removerTempban } from '../../lib/tempbans.js';

export default {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Bane e desbane na hora, só para apagar as mensagens recentes.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('membro').setDescription('Quem limpar').setRequired(true))
    .addStringOption((o) => o.setName('motivo').setDescription('Motivo').setMaxLength(300))
    .addIntegerOption((o) =>
      o
        .setName('apagar')
        .setDescription('Quanto apagar (padrão: 7 dias)')
        .addChoices(
          { name: 'Últimas 24 horas', value: 1 },
          { name: 'Últimos 7 dias', value: 7 },
        ),
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro', true);
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';
    const dias = interaction.options.getInteger('apagar') ?? 7;

    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    const problema = problemaComAlvo(interaction, membro);
    if (problema) {
      return interaction.reply({ content: problema, flags: MessageFlags.Ephemeral });
    }

    const jaBanido = await interaction.guild.bans.fetch(usuario.id).catch(() => null);
    if (jaBanido) {
      return interaction.reply({
        content: 'Esse usuário já está banido. Use `/unban` para removê-lo.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await avisarNoPrivado(
      usuario,
      `Você foi removido de ${interaction.guild.name}`,
      `**Motivo:** ${motivo}\nSuas mensagens recentes foram apagadas. Você pode voltar com um novo convite.`,
    );

    marcarAcaoDoBot('ban', usuario.id);
    marcarAcaoDoBot('unban', usuario.id);

    await membro.ban({
      reason: `Softban: ${motivo} (por ${interaction.user.tag})`,
      deleteMessageSeconds: dias * 86400,
    });

    const desbanido = await interaction.guild.bans
      .remove(usuario.id, `Softban: ${motivo}`)
      .then(() => true)
      .catch((erro) => {
        console.error('[ERRO] Softban não conseguiu desbanir:', erro.message);
        return false;
      });

    if (!desbanido) {
      return interaction.reply({
        content:
          'Apliquei o banimento e apaguei as mensagens, mas **não consegui desbanir**. Use `/unban` com o ID: `' +
          usuario.id +
          '`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    removerTempban(interaction.guild.id, usuario.id);

    const painel = embed(
      '🧹 Softban',
      `<@${usuario.id}> foi retirado e pode voltar com um novo convite.`,
      CORES.aviso,
    ).addFields(
      { name: 'Motivo', value: motivo },
      { name: 'Mensagens apagadas', value: `${dias} dia(s)`, inline: true },
      { name: 'Por', value: `${interaction.user}`, inline: true },
    );

    await interaction.reply({ embeds: [painel] });
    await enviarLog(
      interaction.guild,
      embed(
        '🧹 Softban',
        `<@${usuario.id}> (\`${usuario.id}\`) por ${interaction.user}.\n**Motivo:** ${motivo}\n**Mensagens apagadas:** ${dias} dia(s)`,
        CORES_LOG.moderacao,
      ),
    );
  },
};
