import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { formatarDuracao, parseDuracao } from '../../lib/tempo.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timestamp')
    .setDescription('Gera códigos de data/hora para usar nas mensagens.')
    .addStringOption((o) =>
      o
        .setName('quando')
        .setDescription('Daqui a quanto tempo (ex: 10m, 2h, 1d)')
        .setRequired(true)
        .setMaxLength(30),
    ),

  async execute(interaction) {
    const texto = interaction.options.getString('quando', true);
    const duracao = parseDuracao(texto);

    if (!duracao) {
      return interaction.reply({
        content: 'Não entendi. Use algo como `10m`, `2h` ou `1d`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const segundos = Math.floor((Date.now() + duracao) / 1000);

    const linhas = [
      ['Data e hora completas', `<t:${segundos}:f>`],
      ['Data curta', `<t:${segundos}:d>`],
      ['Hora', `<t:${segundos}:t>`],
      ['Data longa', `<t:${segundos}:F>`],
      ['Relativo', `<t:${segundos}:R>`],
      ['Completo curto', `<t:${segundos}:D>`],
    ];

    await interaction.reply({
      embeds: [
        embed(
          '🕒 Timestamp',
          `Daqui a **${formatarDuracao(duracao)}**.\n\n` +
            linhas.map(([nome, codigo]) => `**${nome}:** \`${codigo}\` → ${codigo}`).join('\n'),
          CORES.principal,
        ).setFooter({ text: 'Copie o código entre crases e cole na mensagem' }),
      ],
    });
  },
};
