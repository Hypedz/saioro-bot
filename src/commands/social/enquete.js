import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { criarEnquete } from '../../lib/enquetes.js';
import { embedErro } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('enquete')
    .setDescription('Cria uma enquete com votação por botões.')
    .addStringOption((o) =>
      o.setName('pergunta').setDescription('A pergunta').setRequired(true).setMaxLength(250),
    )
    .addStringOption((o) =>
      o
        .setName('opcoes')
        .setDescription('Separe por " | " (2 a 10 opções)')
        .setRequired(true)
        .setMaxLength(900),
    ),

  async execute(interaction) {
    const pergunta = interaction.options.getString('pergunta', true);
    const opcoes = interaction.options
      .getString('opcoes', true)
      .split('|')
      .map((o) => o.trim())
      .filter(Boolean);

    if (opcoes.length < 2 || opcoes.length > 10) {
      return interaction.reply({
        content: 'Preciso de 2 a 10 opções separadas por `|`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.channel?.isTextBased()) {
      return interaction.reply({
        content: 'Só dá para criar enquete em canal de texto.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await criarEnquete(interaction.channel, {
        pergunta,
        opcoes,
        autorId: interaction.user.id,
      });
      await interaction.editReply({ content: '📊 Enquete criada!' });
    } catch (erro) {
      console.error('[ERRO] Falha ao criar enquete:', erro);
      await interaction.editReply({ embeds: [embedErro('Não consegui criar a enquete.')] });
    }
  },
};
