import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('limpar')
    .setDescription('Apaga mensagens deste canal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opcao) =>
      opcao
        .setName('quantidade')
        .setDescription('Quantas mensagens apagar (1 a 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando so funciona dentro de um servidor.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const quantidade = interaction.options.getInteger('quantidade', true);
    const canal = interaction.channel;

    if (!canal?.isTextBased() || typeof canal.bulkDelete !== 'function') {
      return interaction.reply({
        content: 'Nao consigo apagar mensagens neste tipo de canal.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      // O segundo parametro "true" ignora mensagens com mais de 14 dias.
      const apagadas = await canal.bulkDelete(quantidade, true);
      await interaction.editReply(`🧹 ${apagadas.size} mensagem(ns) apagada(s).`);
    } catch (erro) {
      console.error('[ERRO] Falha ao limpar mensagens:', erro);
      await interaction.editReply(
        'Nao consegui apagar. Verifique se eu tenho a permissao **Gerenciar Mensagens**.',
      );
    }
  },
};
