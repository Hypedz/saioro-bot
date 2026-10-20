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
    .setName('embed')
    .setDescription('Cria um embed personalizado.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName('canal').setDescription('Onde publicar (padrão: este canal)')),

  async execute(interaction) {
    const canal = interaction.options.getChannel('canal') ?? interaction.channel;

    if (!canal?.isTextBased()) {
      return interaction.reply({
        content: 'Escolha um canal de texto.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`embed:${canal.id}`)
      .setTitle('Criar embed');

    const campos = [
      new TextInputBuilder()
        .setCustomId('titulo')
        .setLabel('Título (opcional)')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(256)
        .setRequired(false),
      new TextInputBuilder()
        .setCustomId('descricao')
        .setLabel('Descrição')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(4000)
        .setRequired(false),
      new TextInputBuilder()
        .setCustomId('cor')
        .setLabel('Cor hex (ex: #E0713E) — opcional')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(7)
        .setRequired(false),
      new TextInputBuilder()
        .setCustomId('imagem')
        .setLabel('URL de imagem — opcional')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(500)
        .setRequired(false),
      new TextInputBuilder()
        .setCustomId('rodape')
        .setLabel('Rodapé — opcional')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(200)
        .setRequired(false),
    ];

    modal.addComponents(campos.map((campo) => new ActionRowBuilder().addComponents(campo)));

    await interaction.showModal(modal);
  },
};
