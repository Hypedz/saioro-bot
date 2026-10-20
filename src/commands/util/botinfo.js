import { SlashCommandBuilder, version as discordVersion } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { formatarDuracao } from '../../lib/tempo.js';

function megabytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Mostra informações técnicas do bot.'),

  async execute(interaction) {
    const { client } = interaction;
    const memoria = process.memoryUsage();

    const painel = embed(client.user.username, null, CORES.principal)
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Servidores', value: `**${client.guilds.cache.size}**`, inline: true },
        { name: 'Usuários', value: `**${client.guilds.cache.reduce((t, g) => t + g.memberCount, 0)}**`, inline: true },
        { name: 'Comandos', value: `**${client.commands.size}**`, inline: true },
        { name: 'Online há', value: formatarDuracao(client.uptime ?? 0), inline: true },
        { name: 'Ping', value: `${Math.round(client.ws.ping)} ms`, inline: true },
        { name: 'Memória', value: megabytes(memoria.rss), inline: true },
        {
          name: 'Versões',
          value: `Node **${process.version}** • discord.js **v${discordVersion}**`,
          inline: false,
        },
      )
      .setFooter({ text: `Criado em ${client.user.createdAt.toLocaleDateString('pt-BR')}` });

    await interaction.reply({ embeds: [painel] });
  },
};
