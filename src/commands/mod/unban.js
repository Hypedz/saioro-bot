import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { CORES_LOG, enviarLog } from '../../lib/logs.js';
import { marcarAcaoDoBot } from '../../lib/moderacao.js';
import { removerTempban } from '../../lib/tempbans.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Remove o banimento de um usuário.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) =>
      o.setName('id').setDescription('ID do usuário banido').setRequired(true).setMinLength(15),
    )
    .addStringOption((o) => o.setName('motivo').setDescription('Motivo').setMaxLength(300)),

  async execute(interaction) {
    const id = interaction.options.getString('id', true).trim();
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';

    if (!/^\d{15,25}$/.test(id)) {
      return interaction.reply({
        content: 'Isso não parece um ID válido. Copie o ID do usuário (Modo desenvolvedor → Copiar ID).',
        flags: MessageFlags.Ephemeral,
      });
    }

    const banido = await interaction.guild.bans.fetch(id).catch(() => null);
    if (!banido) {
      return interaction.reply({
        content: 'Esse usuário não está banido neste servidor.',
        flags: MessageFlags.Ephemeral,
      });
    }

    marcarAcaoDoBot('unban', id);
    await interaction.guild.bans.remove(id, `${motivo} (por ${interaction.user.tag})`);
    removerTempban(interaction.guild.id, id);

    await interaction.reply({
      embeds: [
        embed('✅ Banimento removido', `${banido.user} (\`${id}\`) pode voltar.`, CORES.sucesso),
      ],
    });

    await enviarLog(
      interaction.guild,
      embed(
        '✅ Banimento removido',
        `${banido.user.tag} (\`${id}\`) por ${interaction.user}.\n**Motivo:** ${motivo}`,
        CORES_LOG.moderacao,
      ),
    );
  },
};
