import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Mostra a latencia do bot.'),

  async execute(interaction) {
    const enviada = await interaction.reply({ content: 'Calculando...', fetchReply: true });
    const resposta = enviada.createdTimestamp - interaction.createdTimestamp;
    const websocket = Math.round(interaction.client.ws.ping);

    await interaction.editReply(
      ['🏓 Pong!', `• Resposta: **${resposta} ms**`, `• WebSocket: **${websocket} ms**`].join('\n'),
    );
  },
};
