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
import { configuracoes } from '../../lib/settings.js';
import { contarFaq } from '../../lib/faq.js';

export default {
  data: new SlashCommandBuilder()
    .setName('regras')
    .setDescription('Publica as regras com o botão de verificação junto.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName('regras').setDescription('Texto das regras').setRequired(true).setMaxLength(4000),
    )
    .addStringOption((o) =>
      o.setName('titulo').setDescription('Título do painel (padrão: Regras do servidor)').setMaxLength(256),
    )
    .addChannelOption((o) =>
      o
        .setName('canal')
        .setDescription('Onde publicar (padrão: este canal)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addRoleOption((o) =>
      o
        .setName('cargo')
        .setDescription('Cargo entregue ao concordar (padrão: o de /config verificar-cargo)'),
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

    const texto = interaction.options.getString('regras', true);
    const titulo = interaction.options.getString('titulo') ?? 'Regras do servidor';
    const cfg = configuracoes(interaction.guild.id);

    const cargo =
      interaction.options.getRole('cargo') ??
      (cfg.verificarCargo
        ? interaction.guild.roles.cache.get(cfg.verificarCargo) ??
          (await interaction.guild.roles.fetch(cfg.verificarCargo).catch(() => null))
        : null);

    const eu = interaction.guild.members.me;
    const cargoInvalido =
      cargo && (cargo.managed || cargo.position >= eu.roles.highest.position);

    const temFaq = contarFaq(interaction.guild.id) > 0;

    const painel = embed(titulo, texto, CORES.principal);

    if (cargoInvalido) {
      painel.setFooter({ text: 'Sem botão de verificação: o cargo está acima do bot ou é gerenciado.' });
    } else if (cargo) {
      painel.setFooter({ text: 'Clique em "Li e concordo" para receber o cargo e liberar o servidor.' });
    } else if (!temFaq) {
      painel.setFooter({ text: 'Nenhum cargo de verificação configurado — o painel saiu sem botão.' });
    }

    const botoes = [];

    if (cargo && !cargoInvalido) {
      botoes.push(
        new ButtonBuilder()
          .setCustomId(`verificar:${cargo.id}`)
          .setLabel('Li e concordo')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success),
      );
    }

    if (temFaq) {
      botoes.push(
        new ButtonBuilder()
          .setCustomId('faq:abrir')
          .setLabel('Ver FAQ')
          .setEmoji('📖')
          .setStyle(ButtonStyle.Secondary),
      );
    }

    const componentes = botoes.length ? [new ActionRowBuilder().addComponents(...botoes)] : [];

    const mensagem = await canal.send({
      embeds: [painel],
      components: componentes,
      allowedMentions: { parse: [] },
    });

    const aviso = cargoInvalido
      ? `\n⚠️ O cargo **${cargo.name}** está acima do meu ou é gerenciado por integração, então o botão não foi incluído.`
      : cargo
        ? ''
        : '\n⚠️ Configure um cargo com `/config verificar-cargo` para o botão de verificação aparecer.';

    await interaction.reply({
      content: `✅ Regras publicadas em <#${canal.id}>: ${mensagem.url}${aviso}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
