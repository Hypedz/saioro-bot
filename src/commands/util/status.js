import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SlashCommandBuilder, version as discordVersion } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { formatarDuracao } from '../../lib/tempo.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function tamanhoBanco() {
  try {
    const { size } = statSync(path.join(raiz, 'dados', 'bot.db'));
    return `${(size / 1024).toFixed(0)} KB`;
  } catch {
    return '—';
  }
}

export default {
  data: new SlashCommandBuilder().setName('status').setDescription('Mostra o estado atual do bot.'),

  async execute(interaction) {
    const { client } = interaction;
    const memoria = process.memoryUsage();

    const painel = embed('📈 Status', null, CORES.sucesso).addFields(
      { name: 'Online há', value: formatarDuracao(client.uptime ?? 0), inline: true },
      { name: 'Ping', value: `${Math.round(client.ws.ping)} ms`, inline: true },
      { name: 'Memória', value: `${(memoria.rss / 1024 / 1024).toFixed(0)} MB`, inline: true },
      { name: 'Servidores', value: `${client.guilds.cache.size}`, inline: true },
      {
        name: 'Usuários',
        value: `${client.guilds.cache.reduce((t, g) => t + g.memberCount, 0)}`,
        inline: true,
      },
      { name: 'Comandos', value: `${client.commands.size}`, inline: true },
      { name: 'Banco', value: tamanhoBanco(), inline: true },
      { name: 'Node', value: `v${process.versions.node}`, inline: true },
      { name: 'discord.js', value: `v${discordVersion}`, inline: true },
    );

    await interaction.reply({ embeds: [painel] });
  },
};
