import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

const FALLBACK = [
  'https://cdn.discordapp.com/embed/avatars/0.png',
  'https://cdn.discordapp.com/embed/avatars/1.png',
];

export default {
  data: new SlashCommandBuilder().setName('gato').setDescription('Manda uma foto aleatória de gato.'),

  async execute(interaction) {
    await interaction.deferReply();

    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), 5000);

    let url = null;
    try {
      const resposta = await fetch('https://api.thecatapi.com/v1/images/search', {
        signal: controle.signal,
      });
      const dados = await resposta.json();
      url = dados?.[0]?.url ?? null;
    } catch {
      url = null;
    } finally {
      clearTimeout(timer);
    }

    if (!url) {
      const imagem = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
      return interaction.editReply({
        embeds: [
          embed('🐱 Gato', '_A internet dos gatos falhou, mas aqui vai um consolo._', CORES.aviso).setThumbnail(
            imagem,
          ),
        ],
      });
    }

    await interaction.editReply({ embeds: [embed('🐱 Gato', null, CORES.principal).setImage(url)] });
  },
};
