import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dado')
    .setDescription('Rola dados.')
    .addIntegerOption((o) =>
      o.setName('lados').setDescription('Quantos lados (padrão: 6)').setMinValue(2).setMaxValue(1000),
    )
    .addIntegerOption((o) =>
      o.setName('quantidade').setDescription('Quantos dados (padrão: 1)').setMinValue(1).setMaxValue(10),
    ),

  async execute(interaction) {
    const lados = interaction.options.getInteger('lados') ?? 6;
    const quantidade = interaction.options.getInteger('quantidade') ?? 1;

    const resultados = Array.from({ length: quantidade }, () => 1 + Math.floor(Math.random() * lados));
    const total = resultados.reduce((soma, n) => soma + n, 0);

    const descricao =
      quantidade === 1
        ? `🎲 Você tirou **${resultados[0]}** (d${lados}).`
        : `🎲 ${quantidade}d${lados}: ${resultados.map((n) => `\`${n}\``).join(' + ')} = **${total}**`;

    await interaction.reply({ embeds: [embed('Dados', descricao, CORES.destaque)] });
  },
};
