import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { apagarAviso } from '../../lib/moderacao.js';

export default {
  data: new SlashCommandBuilder()
    .setName('delwarn')
    .setDescription('Apaga uma advertência pelo número do registro.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addIntegerOption((o) =>
      o.setName('id').setDescription('Número mostrado em /warns (ex: 12)').setRequired(true).setMinValue(1),
    ),

  async execute(interaction) {
    const id = interaction.options.getInteger('id', true);
    const apagados = apagarAviso(interaction.guild.id, id);

    if (!apagados) {
      return interaction.reply({
        content: `Não achei o aviso \`#${id}\` neste servidor. Use \`/warns\` para ver os números.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      embeds: [embed('🗑️ Aviso apagado', `O registro \`#${id}\` foi removido.`, CORES.sucesso)],
    });
  },
};
