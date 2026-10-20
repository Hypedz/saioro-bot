import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { formatarDuracao } from '../../lib/tempo.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Mostra a latência e o tempo online do bot.'),

  async execute(interaction) {
    await interaction.reply({ content: 'Calculando...' });
    const enviada = await interaction.fetchReply();
    const resposta = enviada.createdTimestamp - interaction.createdTimestamp;
    const websocket = Math.round(interaction.client.ws.ping);
    const online = formatarDuracao(interaction.client.uptime ?? 0);

    const painel = embed('🏓 Pong!', null, CORES.sucesso).addFields(
      { name: 'Resposta', value: `**${resposta} ms**`, inline: true },
      { name: 'WebSocket', value: `**${websocket} ms**`, inline: true },
      { name: 'Online há', value: `**${online}**`, inline: true },
    );

    await interaction.editReply({ content: '', embeds: [painel] });
  },
};
