import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import {
  botoesPerfil,
  modalPerfil,
  montarPerfil,
  obterPerfil,
  selecaoCampos,
} from '../../lib/perfis.js';

export default {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Cartão de membro personalizável: bio, cor, imagem e campos.')
    .addSubcommand((sub) =>
      sub
        .setName('ver')
        .setDescription('Mostra o cartão (o seu ou de outro membro)')
        .addUserOption((o) => o.setName('membro').setDescription('Quem mostrar (padrão: você)')),
    )
    .addSubcommand((sub) => sub.setName('editar').setDescription('Abre o formulário de edição'))
    .addSubcommand((sub) =>
      sub.setName('campos').setDescription('Escolhe o que aparece no cartão'),
    )
    .addSubcommand((sub) =>
      sub.setName('remover').setDescription('Volta o cartão ao padrão (apaga a personalização)'),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;
    const userId = interaction.user.id;

    if (sub === 'ver') {
      const alvo = interaction.options.getMember('membro') ?? interaction.member;
      const perfil = obterPerfil(guild.id, alvo.id);

      return interaction.reply({
        embeds: [montarPerfil(alvo, perfil)],
        components: botoesPerfil(alvo.id, userId),
        allowedMentions: { parse: [] },
      });
    }

    if (sub === 'editar') {
      return interaction.showModal(modalPerfil(obterPerfil(guild.id, userId), userId));
    }

    if (sub === 'campos') {
      return interaction.reply({
        content:
          '🎛️ Marque o que deve aparecer no seu cartão. Desmarcar tudo deixa apenas título, bio e imagem.',
        components: [selecaoCampos(obterPerfil(guild.id, userId), userId)],
        flags: MessageFlags.Ephemeral,
      });
    }

    // remover
    const confirmar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`perfil:reset:${userId}`)
        .setLabel('Apagar personalização')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`perfil:cancelar:${userId}`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({
      content: 'Isso apaga título, bio, pronomes, cor e imagem. Os campos voltam ao padrão.',
      components: [confirmar],
      flags: MessageFlags.Ephemeral,
    });
  },
};
