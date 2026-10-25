import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { configuracoes, salvarConfiguracoes } from '../../lib/settings.js';
import {
  contarCandidaturasPendentes,
  modalCandidatura,
  temCandidaturaPendente,
} from '../../lib/candidaturas.js';

const CANAIS = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

const erro = (interaction, texto) =>
  interaction.reply({ content: texto, flags: MessageFlags.Ephemeral });

export default {
  data: new SlashCommandBuilder()
    .setName('candidatura')
    .setDescription('Candidaturas à staff: enviar, configurar, painel e status.')
    .addSubcommand((sub) => sub.setName('enviar').setDescription('Envia sua candidatura'))
    .addSubcommand((sub) =>
      sub
        .setName('configurar')
        .setDescription('Define o canal e o cargo da staff')
        .addChannelOption((o) =>
          o
            .setName('canal')
            .setDescription('Canal que recebe as candidaturas')
            .setRequired(true)
            .addChannelTypes(...CANAIS),
        )
        .addRoleOption((o) =>
          o.setName('cargo').setDescription('Cargo entregue quando aprovado').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('painel')
        .setDescription('Publica o botão de candidatura')
        .addChannelOption((o) =>
          o
            .setName('canal')
            .setDescription('Onde publicar (padrão: canal atual)')
            .addChannelTypes(...CANAIS),
        ),
    )
    .addSubcommand((sub) => sub.setName('status').setDescription('Mostra a configuração atual'))
    .addSubcommand((sub) => sub.setName('desativar').setDescription('Desliga as candidaturas')),

  async execute(interaction) {
    if (!interaction.guild) {
      return erro(interaction, 'Esse comando só funciona em servidores.');
    }

    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;
    const cfg = configuracoes(guild.id);

    if (sub === 'enviar') {
      if (!cfg.candidaturas || !cfg.candidaturaCargo) {
        return erro(interaction, 'As candidaturas não estão abertas. Avise a staff.');
      }

      if (temCandidaturaPendente(guild.id, interaction.user.id)) {
        return erro(interaction, 'Você já tem uma candidatura em análise. Aguarde a resposta.');
      }

      return interaction.showModal(modalCandidatura());
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return erro(interaction, 'Só quem gerencia o servidor pode configurar candidaturas.');
    }

    if (sub === 'configurar') {
      const canal = interaction.options.getChannel('canal', true);
      const cargo = interaction.options.getRole('cargo', true);
      const eu = guild.members.me;

      if (!canal.isTextBased() || typeof canal.send !== 'function') {
        return erro(interaction, 'Escolha um canal de texto válido.');
      }

      const permissoes = canal.permissionsFor(eu);

      if (
        !permissoes?.has(PermissionFlagsBits.SendMessages) ||
        !permissoes?.has(PermissionFlagsBits.EmbedLinks)
      ) {
        return erro(interaction, `Não consigo enviar embeds em ${canal}.`);
      }

      if (!eu.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return erro(interaction, 'Preciso da permissão **Gerenciar Cargos** para aprovar candidaturas.');
      }

      if (cargo.id === guild.id) {
        return erro(interaction, 'O cargo **@everyone** não pode ser usado como cargo de staff.');
      }

      if (cargo.managed || cargo.position >= eu.roles.highest.position) {
        return erro(
          interaction,
          'Não posso entregar esse cargo. Use um cargo abaixo do meu e que não seja de integração.',
        );
      }

      salvarConfiguracoes(guild.id, {
        candidaturas: canal.id,
        candidaturaCargo: cargo.id,
      });

      return interaction.reply({
        embeds: [
          embed(
            '✅ Candidaturas configuradas',
            `As candidaturas serão enviadas em ${canal}.\nQuem for aprovado recebe ${cargo}.`,
            CORES.sucesso,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'painel') {
      if (!cfg.candidaturas || !cfg.candidaturaCargo) {
        return erro(interaction, 'Configure primeiro com `/candidatura configurar`.');
      }

      const canal = interaction.options.getChannel('canal') ?? interaction.channel;

      if (!canal?.isTextBased() || typeof canal.send !== 'function') {
        return erro(interaction, 'Escolha um canal de texto válido.');
      }

      const permissoes = canal.permissionsFor(guild.members.me);

      if (
        !permissoes?.has(PermissionFlagsBits.SendMessages) ||
        !permissoes?.has(PermissionFlagsBits.EmbedLinks)
      ) {
        return erro(interaction, `Não consigo enviar embeds em ${canal}.`);
      }

      const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('candidatura:abrir')
          .setLabel('Candidatar-se')
          .setEmoji('📝')
          .setStyle(ButtonStyle.Primary),
      );

      const mensagem = await canal.send({
        embeds: [
          embed(
            '📝 Candidaturas abertas',
            'Quer entrar na staff? Clique no botão abaixo e responda ao formulário.\nA equipe analisa e responde no privado.',
            CORES.principal,
          ),
        ],
        components: [botao],
      });

      return interaction.reply({
        content: `✅ Painel publicado: ${mensagem.url}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'status') {
      const pendentes = contarCandidaturasPendentes(guild.id);
      const valor = (id, tipo) =>
        id ? (tipo === 'cargo' ? `<@&${id}>` : `<#${id}>`) : '_não definido_';

      return interaction.reply({
        embeds: [
          embed('📝 Candidaturas', null, CORES.principal).addFields(
            { name: 'Canal', value: valor(cfg.candidaturas, 'canal'), inline: true },
            { name: 'Cargo', value: valor(cfg.candidaturaCargo, 'cargo'), inline: true },
            { name: 'Pendentes', value: String(pendentes), inline: true },
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // desativar
    salvarConfiguracoes(guild.id, { candidaturas: null, candidaturaCargo: null });

    return interaction.reply({
      content: '✅ Candidaturas desligadas. As que já estavam em análise continuam salvas.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
