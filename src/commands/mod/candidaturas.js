import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import {
  STATUS_CANDIDATURA,
  contarCandidaturasPorStatus,
  listarCandidaturas,
} from '../../lib/candidaturas.js';

const ESCOLHAS_STATUS = [
  { name: 'Pendente', value: 'pendente' },
  { name: 'Aprovada', value: 'aprovada' },
  { name: 'Recusada', value: 'recusada' },
];

function urlMensagem(guildId, candidatura) {
  if (!candidatura.channel_id || !candidatura.message_id) return null;
  return `https://discord.com/channels/${guildId}/${candidatura.channel_id}/${candidatura.message_id}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('candidaturas')
    .setDescription('Central da staff: lista as candidaturas recebidas.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('listar')
        .setDescription('Lista as candidaturas, da mais recente para a mais antiga')
        .addStringOption((o) =>
          o
            .setName('status')
            .setDescription('Filtra por status')
            .addChoices(...ESCOLHAS_STATUS),
        )
        .addIntegerOption((o) =>
          o
            .setName('limite')
            .setDescription('Quantidade de resultados (1 a 20; padrão: 10)')
            .setMinValue(1)
            .setMaxValue(20),
        ),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const status = interaction.options.getString('status');
    const limite = interaction.options.getInteger('limite') ?? 10;
    const lista = listarCandidaturas(interaction.guild.id, { status, limite });
    const totais = contarCandidaturasPorStatus(interaction.guild.id);

    const rodape = [
      `Pendentes: ${totais.pendente}`,
      `Aprovadas: ${totais.aprovada}`,
      `Recusadas: ${totais.recusada}`,
    ].join(' • ');

    if (!lista.length) {
      return interaction.reply({
        embeds: [
          embed(
            '📝 Central de candidaturas',
            status
              ? 'Nenhuma candidatura com esse status.'
              : 'Nenhuma candidatura registrada ainda.',
            CORES.principal,
          ).setFooter({ text: rodape }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const linhas = lista.map((candidatura) => {
      const situacao = STATUS_CANDIDATURA[candidatura.status] ?? STATUS_CANDIDATURA.pendente;
      const cargo = candidatura.cargo_id
        ? `<@&${candidatura.cargo_id}>`
        : '_não definido_';
      const link = urlMensagem(interaction.guild.id, candidatura);
      const quando = Math.floor(candidatura.criado_em / 1000);

      return [
        `**#${candidatura.id} — ${situacao.rotulo}**`,
        `Candidato: <@${candidatura.user_id}> • Cargo: ${cargo}`,
        `<t:${quando}:R>${link ? ` • [abrir candidatura](${link})` : ''}`,
      ].join('\n');
    });

    const painel = embed(
      '📝 Central de candidaturas',
      linhas.join('\n\n'),
      CORES.principal,
    ).setFooter({ text: rodape });

    return interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
  },
};
