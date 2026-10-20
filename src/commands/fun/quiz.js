import { SlashCommandBuilder } from 'discord.js';
import { criarQuiz, montarBotoesQuiz, registrarQuiz } from '../../lib/quiz.js';

export default {
  data: new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Pergunta de conhecimentos gerais com botões.'),

  async execute(interaction) {
    const { pergunta, painel, autorId } = criarQuiz(interaction.channel, interaction.user.id);

    await interaction.reply({
      embeds: [painel],
      allowedMentions: { parse: [] },
    });

    const mensagem = await interaction.fetchReply();
    registrarQuiz(mensagem.id, pergunta.correta, autorId);
    await mensagem.edit({ components: montarBotoesQuiz(mensagem.id, pergunta.opcoes) });
  },
};
