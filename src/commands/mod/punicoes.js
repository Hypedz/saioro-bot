import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../db.js';
import { CORES, dataCurta, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('punicoes')
    .setDescription('Mostra o histórico de punições do servidor.')
    .addUserOption((o) => o.setName('membro').setDescription('Filtrar por um membro'))
    .addIntegerOption((o) =>
      o.setName('limite').setDescription('Quantas mostrar (padrão: 15)').setMinValue(1).setMaxValue(50),
    ),

  async execute(interaction) {
    const membro = interaction.options.getUser('membro');
    const limite = interaction.options.getInteger('limite') ?? 15;
    const guildId = interaction.guild.id;

    const filtro = membro ? 'AND user_id = ?' : '';
    const parametros = membro ? [guildId, membro.id] : [guildId];

    const linhas = db
      .prepare(
        `SELECT * FROM avisos WHERE guild_id = ? ${filtro} ORDER BY id DESC LIMIT ?`,
      )
      .all(...parametros, limite);

    const total = db
      .prepare(`SELECT COUNT(*) AS n FROM avisos WHERE guild_id = ? ${filtro}`)
      .get(...parametros).n;

    if (linhas.length === 0) {
      return interaction.reply({
        embeds: [
          embed(
            '🛡️ Punições',
            membro ? `${membro} não tem advertências.` : 'Nenhuma advertência registrada.',
            CORES.sucesso,
          ),
        ],
      });
    }

    const lista = linhas
      .map(
        (aviso) =>
          `**#${aviso.id}** <@${aviso.user_id}> — ${aviso.motivo}\npor <@${aviso.moderator_id}> • ${dataCurta(aviso.criado_em)}`,
      )
      .join('\n\n');

    await interaction.reply({
      embeds: [
        embed(
          membro ? `🛡️ Punições de ${membro.username}` : '🛡️ Punições do servidor',
          lista,
          CORES.aviso,
        ).setFooter({
          text: `Mostrando ${linhas.length} de ${total} registro(s)`,
        }),
      ],
    });
  },
};
