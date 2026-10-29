import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { configuracoes } from '../../lib/settings.js';
import {
  encerrarLockdown,
  lockdownAtivo,
  obterConfigAntiraid,
  salvarConfigAntiraid,
} from '../../lib/antiraid.js';

const CANAIS = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

function resumo(cfg) {
  const limiteContas = Math.max(2, Math.ceil(cfg.limite / 2));

  return [
    `**Entradas:** ${cfg.limite} em ${cfg.janela}s`,
    `**Contas novas:** ${cfg.contaDias ? `${limiteContas} com menos de ${cfg.contaDias} dias` : 'checagem desligada'}`,
    `**Ação:** ${cfg.acao === 'lockdown' ? `lockdown por ${cfg.duracao} min` : 'somente alerta'}`,
  ].join('\n');
}

export default {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Proteção contra raids: alerta a staff e, opcionalmente, tranca os canais.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('ativar')
        .setDescription('Liga a detecção de raid')
        .addChannelOption((o) =>
          o
            .setName('canal')
            .setDescription('Canal de alertas (padrão: o de logs)')
            .addChannelTypes(...CANAIS),
        )
        .addIntegerOption((o) =>
          o
            .setName('limite')
            .setDescription('Entradas na janela para disparar (2 a 50; padrão: 5)')
            .setMinValue(2)
            .setMaxValue(50),
        )
        .addIntegerOption((o) =>
          o
            .setName('janela')
            .setDescription('Janela em segundos (5 a 300; padrão: 30)')
            .setMinValue(5)
            .setMaxValue(300),
        )
        .addIntegerOption((o) =>
          o
            .setName('conta')
            .setDescription('Idade mínima da conta em dias; 0 desliga (padrão: 7)')
            .setMinValue(0)
            .setMaxValue(365),
        )
        .addStringOption((o) =>
          o
            .setName('acao')
            .setDescription('O que fazer quando detectar (padrão: alerta)')
            .addChoices(
              { name: 'Somente alertar a staff', value: 'alerta' },
              { name: 'Alertar e trancar os canais por alguns minutos', value: 'lockdown' },
            ),
        )
        .addIntegerOption((o) =>
          o
            .setName('duracao')
            .setDescription('Minutos de lockdown (1 a 60; padrão: 10)')
            .setMinValue(1)
            .setMaxValue(60),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('desativar').setDescription('Desliga a proteção e destranca canais se preciso'),
    )
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('Mostra a configuração e o lockdown atual'),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const cfg = obterConfigAntiraid(guildId);

    if (sub === 'desativar') {
      salvarConfigAntiraid(guildId, { ativo: false });

      const atual = lockdownAtivo(guildId);
      const restaurados = atual.ativo
        ? await encerrarLockdown(interaction.guild, 'Anti-raid desativado pela staff')
        : 0;
      const restantes = lockdownAtivo(guildId).canais;

      const descricao = !atual.ativo
        ? 'A proteção foi desligada. Nenhum lockdown estava ativo.'
        : restantes
          ? `A proteção foi desligada, mas **${restantes}** canal(is) continuam trancados. Vou tentar restaurar a cada 30 segundos; se persistir, confira **Gerenciar Canais**.`
          : `A proteção foi desligada e **${restaurados}** canal(is) foram destrancados.`;

      return interaction.reply({
        embeds: [
          embed(
            '🛡️ Anti-raid desativado',
            descricao,
            restantes ? CORES.aviso : CORES.sucesso,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'status') {
      const atual = lockdownAtivo(guildId);
      const canalId = cfg.canal ?? configuracoes(guildId).logs;
      const podeLockdown = interaction.guild.members.me?.permissions.has(
        PermissionFlagsBits.ManageChannels,
      );

      const painel = embed(
        '🛡️ Anti-raid',
        cfg.ativo
          ? 'A proteção está **ativada**.'
          : 'A proteção está **desativada**. Use `/antiraid ativar`.',
        cfg.ativo ? CORES.sucesso : CORES.neutro,
      ).addFields(
        { name: 'Canal de alertas', value: canalId ? `<#${canalId}>` : '_não definido_' },
        { name: 'Gatilhos', value: resumo(cfg) },
        {
          name: 'Lockdown ativo',
          value: atual.ativo
            ? `🔒 ${atual.canais} canal(is) até <t:${Math.floor(atual.termina / 1000)}:R>`
            : '_nenhum_',
        },
        {
          name: 'Permissão de lockdown',
          value: podeLockdown
            ? '✅ Gerenciar Canais'
            : '❌ Falta **Gerenciar Canais** (só o alerta funciona)',
        },
      ).setFooter({
        text: 'O histórico de entradas fica em memória e reinicia junto com o bot.',
      });

      return interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
    }

    const canalOpcao = interaction.options.getChannel('canal');
    const canalId = canalOpcao?.id ?? cfg.canal ?? configuracoes(guildId).logs;
    const canal = canalId
      ? interaction.guild.channels.cache.get(canalId) ??
        (await interaction.guild.channels.fetch(canalId).catch(() => null))
      : null;

    if (!canal?.isTextBased() || typeof canal.send !== 'function') {
      return interaction.reply({
        content:
          'Configure um canal de alertas com `/antiraid ativar canal:#canal` ou `/config logs`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const permissoes = canal.permissionsFor(interaction.guild.members.me);
    if (
      !permissoes?.has(PermissionFlagsBits.SendMessages) ||
      !permissoes?.has(PermissionFlagsBits.EmbedLinks)
    ) {
      return interaction.reply({
        content: `Preciso de **Enviar mensagens** e **Inserir links** em ${canal}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const limite = interaction.options.getInteger('limite') ?? cfg.limite;
    const janela = interaction.options.getInteger('janela') ?? cfg.janela;
    const contaDias = interaction.options.getInteger('conta') ?? cfg.contaDias;
    const acao = interaction.options.getString('acao') ?? cfg.acao;
    const duracao = interaction.options.getInteger('duracao') ?? cfg.duracao;

    if (acao === 'lockdown') {
      if (
        !interaction.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)
      ) {
        return interaction.reply({
          content:
            'Para usar lockdown, preciso da permissão **Gerenciar Canais**. Escolha `alerta` ou libere a permissão.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    const salvo = salvarConfigAntiraid(guildId, {
      ativo: true,
      canal: canal.id,
      limite,
      janela,
      contaDias,
      acao: acao === 'lockdown' ? 'lockdown' : 'alerta',
      duracao,
    });

    return interaction.reply({
      embeds: [
        embed(
          '🛡️ Anti-raid ativado',
          `Alertas em ${canal}.\n${resumo(salvo)}`,
          CORES.sucesso,
        ).setFooter({
          text: 'Contas novas também contam como gatilho quando atingem metade do limite.',
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
