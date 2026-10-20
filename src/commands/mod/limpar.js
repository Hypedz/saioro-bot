import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('limpar')
    .setDescription('Apaga mensagens deste canal (até 100).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) =>
      o
        .setName('quantidade')
        .setDescription('Quantas mensagens olhar (1 a 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .addUserOption((o) =>
      o.setName('usuario').setDescription('Apagar somente as mensagens desta pessoa'),
    ),

  async execute(interaction) {
    const quantidade = interaction.options.getInteger('quantidade', true);
    const usuario = interaction.options.getUser('usuario');
    const canal = interaction.channel;

    if (!canal?.isTextBased() || typeof canal.bulkDelete !== 'function') {
      return interaction.reply({
        content: 'Não consigo apagar mensagens neste tipo de canal.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const mensagens = await canal.messages.fetch({ limit: quantidade }).catch(() => null);
    if (!mensagens) {
      return interaction.editReply('Não consegui ler as mensagens deste canal.');
    }

    const alvo = usuario ? mensagens.filter((m) => m.author.id === usuario.id) : mensagens;

    if (alvo.size === 0) {
      return interaction.editReply(
        usuario
          ? `Não achei mensagens de ${usuario} nas últimas ${quantidade}.`
          : 'Não há mensagens para apagar.',
      );
    }

    try {
      // true = ignora mensagens com mais de 14 dias (o Discord não deixa apagar).
      const apagadas = await canal.bulkDelete(alvo, true);
      await interaction.editReply(`🧹 ${apagadas.size} mensagem(ns) apagada(s).`);
    } catch (erro) {
      console.error('[ERRO] Falha ao limpar mensagens:', erro);
      await interaction.editReply(
        'Não consegui apagar. Confira se tenho **Gerenciar Mensagens** e se as mensagens têm menos de 14 dias.',
      );
    }
  },
};
