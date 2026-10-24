import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { configuracoes } from '../../lib/settings.js';
import {
  REGRAS,
  ativarAutomod,
  desativarAutomod,
  statusAutomod,
} from '../../lib/automod.js';

const GATILHOS = {
  1: 'palavra',
  3: 'spam',
  4: 'preset',
  5: 'menções',
  6: 'perfil',
};

const ACOES = {
  1: 'bloquear',
  2: 'alertar',
  3: 'castigar',
  4: 'bloquear interação',
};

const erro = (interaction, texto) =>
  interaction.reply({ content: texto, flags: MessageFlags.Ephemeral });

export default {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Regras nativas de AutoMod do Discord (sem intent de mensagens).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('ativar')
        .setDescription('Cria as regras que ainda não existem')
        .addChannelOption((o) =>
          o
            .setName('canal')
            .setDescription('Canal de alerta (padrão: o canal de logs)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        )
        .addIntegerOption((o) =>
          o
            .setName('tempo')
            .setDescription('Castigo em minutos (0 = sem castigo). Padrão: 10')
            .setMinValue(0)
            .setMaxValue(10080),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('Mostra as regras do bot e a badge de AutoMod'),
    )
    .addSubcommand((sub) =>
      sub.setName('desativar').setDescription('Remove as regras criadas pelo bot'),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return erro(interaction, 'Esse comando só funciona em servidores.');
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return erro(interaction, 'Só quem gerencia o servidor pode mexer no AutoMod.');
    }

    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;
    const eu = guild.members.me;

    if (!eu.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return erro(
        interaction,
        'Preciso da permissão **Gerenciar Servidor** para criar regras de AutoMod.',
      );
    }

    if (sub === 'ativar') {
      const configurado = configuracoes(guild.id).logs;
      const canal =
        interaction.options.getChannel('canal') ??
        (configurado ? guild.channels.cache.get(configurado) ?? null : null);

      if (!canal?.isTextBased()) {
        return erro(
          interaction,
          'Escolha um canal de alerta com a opção `canal:` ou configure um com `/config logs`.',
        );
      }

      if (!canal.permissionsFor(eu)?.has(PermissionFlagsBits.SendMessages)) {
        return erro(interaction, `Não consigo enviar mensagens em <#${canal.id}>.`);
      }

      const podeCastigar = eu.permissions.has(PermissionFlagsBits.ModerateMembers);
      const minutos = interaction.options.getInteger('tempo') ?? 10;
      const timeoutSegundos = podeCastigar ? minutos * 60 : 0;

      const resultado = await ativarAutomod(guild, {
        canalId: canal.id,
        timeoutSegundos,
      });

      const painel = embed(
        '🛡️ AutoMod ativado',
        'As regras valem para todos os membros, exceto os cargos de staff isentos.',
        CORES.sucesso,
      ).addFields(
        {
          name: 'Criadas agora',
          value: resultado.criadas.map((nome) => `• ${nome}`).join('\n') || '—',
          inline: true,
        },
        {
          name: 'Já existiam',
          value: resultado.existentes.map((nome) => `• ${nome}`).join('\n') || '—',
          inline: true,
        },
        { name: 'Canal de alerta', value: `<#${canal.id}>`, inline: true },
        {
          name: 'Castigo',
          value: podeCastigar
            ? minutos > 0
              ? `${minutos} minuto(s)`
              : 'desligado'
            : 'desligado (falta **Moderar Membros**)',
          inline: true,
        },
        { name: 'Cargos isentos', value: String(resultado.isentos), inline: true },
      );

      if (resultado.ignoradas.length) {
        painel.addFields({
          name: 'Ignoradas',
          value: resultado.ignoradas.join('\n').slice(0, 1000),
        });
      }

      if (resultado.falhas.length) {
        painel.addFields({
          name: '⚠️ Falhas',
          value: resultado.falhas.join('\n').slice(0, 1000),
        });
      }

      painel.setFooter({
        text: 'Badge AutoMod: são necessárias 100 regras em todos os servidores (máx. 10 por servidor).',
      });

      return interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'status') {
      const { regras, badge } = await statusAutomod(guild, interaction.client);

      const linhas = regras.length
        ? regras.map((item) => {
            const rotulo = REGRAS.find((modelo) => modelo.tipo === item.tipo)?.nome ?? item.tipo;

            if (!item.regra) {
              return `⚠️ **${rotulo}** — não encontrada no Discord`;
            }

            const acoes = item.regra.actions
              .map((acao) => ACOES[acao.type] ?? 'ação')
              .join(', ');

            const alerta = item.regra.actions.find((acao) => acao.type === 2)?.metadata?.channel;
            const onde = alerta ? ` · alerta em <#${alerta}>` : '';

            return `${item.regra.enabled ? '🟢' : '⚪'} **${item.regra.name}** — ${
              GATILHOS[item.regra.triggerType] ?? 'gatilho'
            } · ${acoes}${onde}`;
          })
        : ['Nenhuma regra criada pelo bot. Use `/automod ativar`.'];

      const painel = embed('🛡️ AutoMod', linhas.join('\n'), CORES.principal).addFields({
        name: 'Badge AutoMod',
        value: badge
          ? '✅ concedida'
          : '⏳ ainda não — são necessárias 100 regras em todos os servidores',
      });

      painel.setFooter({
        text: 'Só as regras do bot são listadas e removidas. O total da badge soma todos os servidores.',
      });

      return interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
    }

    // desativar
    const { removidas, falhas } = await desativarAutomod(guild);

    const painel = embed(
      '🗑️ AutoMod desativado',
      removidas.length
        ? `Removidas ${removidas.length} regra(s) do bot.`
        : 'Não havia regras do bot para remover.',
      CORES.aviso,
    );

    if (falhas.length) {
      painel.addFields({ name: '⚠️ Falhas', value: falhas.join('\n').slice(0, 1000) });
    }

    painel.setFooter({ text: 'Regras criadas à mão no painel do Discord não foram tocadas.' });

    return interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
  },
};
