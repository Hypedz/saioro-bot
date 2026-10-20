import { SlashCommandBuilder } from 'discord.js';
import { dataCurta, embed, CORES } from '../../lib/embeds.js';
import { avisosDoMembro } from '../../lib/moderacao.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Mostra o histórico de advertências de um membro.')
    .addUserOption((o) => o.setName('membro').setDescription('Quem consultar').setRequired(true)),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro', true);
    const avisos = avisosDoMembro(interaction.guild.id, usuario.id);

    if (avisos.length === 0) {
      return interaction.reply({
        embeds: [embed('✅ Limpo', `${usuario} não tem nenhuma advertência.`, CORES.sucesso)],
      });
    }

    const lista = avisos
      .slice(0, 15)
      .map(
        (aviso) =>
          `**#${aviso.id}** — ${aviso.motivo}\npor <@${aviso.moderator_id}> • ${dataCurta(aviso.criado_em)}`,
      )
      .join('\n\n');

    const painel = embed(
      `⚠️ Advertências de ${usuario.username}`,
      lista,
      CORES.aviso,
    ).setFooter({
      text:
        avisos.length > 15
          ? `Mostrando 15 de ${avisos.length} avisos`
          : `${avisos.length} aviso(s)`,
    });

    await interaction.reply({ embeds: [painel] });
  },
};
