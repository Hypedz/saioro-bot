import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import {
  STATUS_DENUNCIA,
  contarDenunciasPorStatus,
  listarDenuncias,
} from '../../lib/denuncias.js';

const ESCOLHAS_STATUS = [
  { name: 'Aberta', value: 'aberta' },
  { name: 'Em análise', value: 'analise' },
  { name: 'Resolvida', value: 'resolvida' },
  { name: 'Arquivada', value: 'arquivada' },
];

function urlMensagem(guildId, denuncia) {
  if (!denuncia.channel_id || !denuncia.message_id) return null;
  return `https://discord.com/channels/${guildId}/${denuncia.channel_id}/${denuncia.message_id}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('denuncias')
    .setDescription('Central da staff: lista as denúncias recebidas.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('listar')
        .setDescription('Lista as denúncias, da mais recente para a mais antiga')
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
    const lista = listarDenuncias(interaction.guild.id, { status, limite });
    const totais = contarDenunciasPorStatus(interaction.guild.id);

    const rodape = [
      `Abertas: ${totais.aberta}`,
      `Em análise: ${totais.analise}`,
      `Resolvidas: ${totais.resolvida}`,
      `Arquivadas: ${totais.arquivada}`,
    ].join(' • ');

    if (!lista.length) {
      return interaction.reply({
        embeds: [
          embed(
            '🚨 Central de denúncias',
            status
              ? 'Nenhuma denúncia com esse status.'
              : 'Nenhuma denúncia registrada ainda.',
            CORES.principal,
          ).setFooter({ text: rodape }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const linhas = lista.map((denuncia) => {
      const situacao = STATUS_DENUNCIA[denuncia.status] ?? STATUS_DENUNCIA.aberta;
      const autor = denuncia.anonimo ? 'Anônimo' : `<@${denuncia.autor_id}>`;
      const link = urlMensagem(interaction.guild.id, denuncia);
      const quando = Math.floor(denuncia.criado_em / 1000);

      return [
        `**#${denuncia.id} — ${situacao.rotulo}**`,
        `Alvo: <@${denuncia.alvo_id}> • Por: ${autor}`,
        `<t:${quando}:R>${link ? ` • [abrir denúncia](${link})` : ''}`,
      ].join('\n');
    });

    const painel = embed(
      '🚨 Central de denúncias',
      linhas.join('\n\n'),
      CORES.principal,
    ).setFooter({ text: rodape });

    return interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
  },
};
