import {
  ActionRowBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('anuncio')
    .setDescription('Publica um anúncio em embed.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName('canal').setDescription('Onde publicar (padrão: este canal)'))
    .addStringOption((o) =>
      o
        .setName('mencao')
        .setDescription('Avisar todo mundo?')
        .addChoices(
          { name: 'Ninguém', value: 'none' },
          { name: '@everyone', value: 'everyone' },
          { name: '@here', value: 'here' },
        ),
    ),

  async execute(interaction) {
    const canal = interaction.options.getChannel('canal') ?? interaction.channel;
    const mencao = interaction.options.getString('mencao') ?? 'none';

    if (!canal?.isTextBased()) {
      return interaction.reply({
        content: 'Escolha um canal de texto.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`anuncio:${canal.id}:${mencao}`)
      .setTitle('Novo anúncio');

    const titulo = new TextInputBuilder()
      .setCustomId('titulo')
      .setLabel('Título')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(256)
      .setRequired(true);

    const mensagem = new TextInputBuilder()
      .setCustomId('mensagem')
      .setLabel('Mensagem')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(4000)
      .setRequired(true);

    const cor = new TextInputBuilder()
      .setCustomId('cor')
      .setLabel('Cor (hex, ex: #5865F2) — opcional')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(7)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titulo),
      new ActionRowBuilder().addComponents(mensagem),
      new ActionRowBuilder().addComponents(cor),
    );

    await interaction.showModal(modal);
  },
};
