import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { configuracoes, salvarConfiguracoes } from '../../lib/settings.js';

const CANAIS = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

function canalValido(canal) {
  return Boolean(canal?.isTextBased() && typeof canal.send === 'function');
}

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configura boas-vindas, despedida, logs e cargo automático.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName('ver').setDescription('Mostra a configuração atual'))
    .addSubcommand((sub) =>
      sub
        .setName('boas-vindas')
        .setDescription('Define o canal de boas-vindas')
        .addChannelOption((o) =>
          o.setName('canal').setDescription('Canal de texto').setRequired(true).addChannelTypes(...CANAIS),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('despedida')
        .setDescription('Define o canal de despedida')
        .addChannelOption((o) =>
          o.setName('canal').setDescription('Canal de texto').setRequired(true).addChannelTypes(...CANAIS),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('logs')
        .setDescription('Define o canal de logs (mensagens apagadas, punições, entradas)')
        .addChannelOption((o) =>
          o.setName('canal').setDescription('Canal de texto').setRequired(true).addChannelTypes(...CANAIS),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('sugestoes')
        .setDescription('Define o canal onde o /sugestao publica')
        .addChannelOption((o) =>
          o.setName('canal').setDescription('Canal de texto').setRequired(true).addChannelTypes(...CANAIS),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('verificar-cargo')
        .setDescription('Cargo entregue pelo botão do painel /verificar')
        .addRoleOption((o) => o.setName('cargo').setDescription('Cargo').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('cargo-auto')
        .setDescription('Define o cargo dado automaticamente a quem entra')
        .addRoleOption((o) => o.setName('cargo').setDescription('Cargo').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('desativar')
        .setDescription('Desliga uma das configurações')
        .addStringOption((o) =>
          o
            .setName('opcao')
            .setDescription('O que desligar')
            .setRequired(true)
            .addChoices(
              { name: 'Boas-vindas', value: 'boasVindas' },
              { name: 'Despedida', value: 'despedida' },
              { name: 'Logs', value: 'logs' },
              { name: 'Cargo automático', value: 'cargoAuto' },
              { name: 'Sugestões', value: 'sugestoes' },
              { name: 'Cargo de verificação', value: 'verificarCargo' },
            ),
        ),
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

    if (sub === 'ver') {
      const cfg = configuracoes(guildId);
      const valor = (id, tipo) =>
        id ? (tipo === 'cargo' ? `<@&${id}>` : `<#${id}>`) : '_não definido_';

      const painel = embed('⚙️ Configuração do servidor', null, CORES.principal).addFields(
        { name: 'Boas-vindas', value: valor(cfg.boasVindas, 'canal'), inline: true },
        { name: 'Despedida', value: valor(cfg.despedida, 'canal'), inline: true },
        { name: 'Logs', value: valor(cfg.logs, 'canal'), inline: true },
        { name: 'Sugestões', value: valor(cfg.sugestoes, 'canal'), inline: true },
        { name: 'Cargo automático', value: valor(cfg.cargoAuto, 'cargo'), inline: true },
        { name: 'Cargo de verificação', value: valor(cfg.verificarCargo, 'cargo'), inline: true },
      );

      return interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'cargo-auto' || sub === 'verificar-cargo') {
      const cargo = interaction.options.getRole('cargo', true);
      const eu = interaction.guild.members.me;

      if (!eu.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: 'Preciso da permissão **Gerenciar Cargos** para isso.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (cargo.position >= eu.roles.highest.position) {
        return interaction.reply({
          content: 'Esse cargo está acima do meu. Coloque o cargo do bot acima dele e tente de novo.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (cargo.managed) {
        return interaction.reply({
          content: 'Esse cargo é gerenciado por uma integração e não pode ser dado manualmente.',
          flags: MessageFlags.Ephemeral,
        });
      }

      salvarConfiguracoes(guildId, {
        [sub === 'cargo-auto' ? 'cargoAuto' : 'verificarCargo']: cargo.id,
      });

      return interaction.reply({
        embeds: [
          embed(
            sub === 'cargo-auto' ? '✅ Cargo automático' : '✅ Cargo de verificação',
            sub === 'cargo-auto'
              ? `Quem entrar vai receber ${cargo}.`
              : `O botão do /verificar vai entregar ${cargo}.`,
            CORES.sucesso,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'desativar') {
      const opcao = interaction.options.getString('opcao', true);
      salvarConfiguracoes(guildId, { [opcao]: null });

      return interaction.reply({
        content: '✅ Configuração desligada.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const canal = interaction.options.getChannel('canal', true);

    if (!canalValido(canal)) {
      return interaction.reply({
        content: 'Escolha um canal de texto válido.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const mapa = {
      'boas-vindas': 'boasVindas',
      despedida: 'despedida',
      logs: 'logs',
      sugestoes: 'sugestoes',
    };
    const campo = mapa[sub];

    salvarConfiguracoes(guildId, { [campo]: canal.id });

    return interaction.reply({
      embeds: [embed('✅ Configurado', `${canal} agora é o canal de **${sub}**.`, CORES.sucesso)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
