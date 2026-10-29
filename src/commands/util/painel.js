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
import { listarCargosPainel } from '../../lib/cargosPainel.js';
import { contarFaq } from '../../lib/faq.js';
import { obterRegras } from '../../lib/regras.js';
import { configuracoes } from '../../lib/settings.js';

const CANAIS = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

function botoesPainel() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('painel:regras')
      .setLabel('Regras')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('painel:cargos')
      .setLabel('Cargos')
      .setEmoji('🎭')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('painel:faq')
      .setLabel('FAQ')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('painel:candidatura')
      .setLabel('Candidatar-se')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('painel:denunciar')
      .setLabel('Denunciar')
      .setEmoji('🚨')
      .setStyle(ButtonStyle.Danger),
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Publica o painel inicial com atalhos para regras, cargos, FAQ, denúncias e candidaturas.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('publicar')
        .setDescription('Publica o painel no canal')
        .addChannelOption((o) =>
          o
            .setName('canal')
            .setDescription('Onde publicar (padrão: este canal)')
            .addChannelTypes(...CANAIS),
        )
        .addStringOption((o) =>
          o
            .setName('titulo')
            .setDescription('Título do painel (padrão: Central do servidor)')
            .setMaxLength(256),
        )
        .addStringOption((o) =>
          o
            .setName('descricao')
            .setDescription('Texto abaixo do título (padrão: mensagem de boas-vindas)')
            .setMaxLength(2000),
        ),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const canal = interaction.options.getChannel('canal') ?? interaction.channel;
    if (!canal?.isTextBased()) {
      return interaction.reply({
        content: 'Escolha um canal de texto.',
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

    const titulo = interaction.options.getString('titulo') ?? '✨ Central do servidor';
    const descricao =
      interaction.options.getString('descricao') ??
      `Bem-vindo(a) ao **${interaction.guild.name}**!\nUse os botões abaixo para acessar as informações e os canais de atendimento do servidor.`;

    const painel = embed(titulo, descricao, CORES.principal)
      .setFooter({
        text: `${interaction.guild.name} • ${interaction.guild.memberCount} membros`,
      })
      .setTimestamp();

    const icone = interaction.guild.iconURL({ size: 256 });
    if (icone) painel.setThumbnail(icone);

    const mensagem = await canal.send({
      embeds: [painel],
      components: [botoesPainel()],
      allowedMentions: { parse: [] },
    });

    const cfg = configuracoes(interaction.guild.id);
    const faltando = [];

    if (!obterRegras(interaction.guild.id)) faltando.push('regras (`/regras`)');
    if (!contarFaq(interaction.guild.id)) faltando.push('FAQ (`/faq adicionar`)');
    if (!listarCargosPainel(interaction.guild.id).length) {
      faltando.push('cargos (`/cargos-painel adicionar`)');
    }
    if (!cfg.denuncias) faltando.push('canal de denúncias (`/config denuncias`)');
    if (!cfg.candidaturas || !cfg.candidaturaCargo) {
      faltando.push('candidaturas (`/candidatura configurar`)');
    }

    return interaction.reply({
      content: [
        `✅ Painel publicado em ${canal}: ${mensagem.url}`,
        faltando.length ? `⚠️ Ainda falta configurar: ${faltando.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      flags: MessageFlags.Ephemeral,
    });
  },
};
