import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { configuracoes } from '../../lib/settings.js';
import { modalDenuncia } from '../../lib/denuncias.js';

export default {
  data: new SlashCommandBuilder()
    .setName('denunciar')
    .setDescription('Envia uma denúncia privada para a staff.')
    .addUserOption((o) =>
      o.setName('alvo').setDescription('Quem você está denunciando').setRequired(true),
    )
    .addBooleanOption((o) =>
      o.setName('anonimo').setDescription('Não mostrar seu nome para a staff'),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const alvo = interaction.options.getUser('alvo', true);

    if (alvo.id === interaction.user.id) {
      return interaction.reply({
        content: 'Você não pode denunciar a si mesmo.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (alvo.bot) {
      return interaction.reply({
        content: 'Para problemas com um bot, fale diretamente com a staff.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const canalId = configuracoes(interaction.guild.id).denuncias;
    const canal = canalId
      ? interaction.guild.channels.cache.get(canalId) ??
        (await interaction.guild.channels.fetch(canalId).catch(() => null))
      : null;

    if (!canal?.isTextBased() || typeof canal.send !== 'function') {
      return interaction.reply({
        content:
          'O canal de denúncias não está configurado. Peça para a staff rodar `/config denuncias`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const permissoes = canal.permissionsFor(interaction.guild.members.me);

    if (
      !permissoes?.has(PermissionFlagsBits.SendMessages) ||
      !permissoes?.has(PermissionFlagsBits.EmbedLinks)
    ) {
      return interaction.reply({
        content:
          'Não consigo enviar embeds no canal de denúncias. Peça para a staff revisar as permissões.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const anonimo = interaction.options.getBoolean('anonimo') ?? false;

    return interaction.showModal(modalDenuncia(alvo.id, anonimo));
  },
};
