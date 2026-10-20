import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

/** Gera uma porcentagem estável para o mesmo par de IDs. */
function calcular(idA, idB) {
  const chave = [idA, idB].sort().join('');
  let hash = 0;
  for (const caractere of chave) {
    hash = (hash * 31 + caractere.charCodeAt(0)) % 100000;
  }
  return hash % 101;
}

function frase(porcento) {
  if (porcento >= 90) return 'Feito um para o outro. 💞';
  if (porcento >= 70) return 'Tem química aí. 😍';
  if (porcento >= 50) return 'Pode dar certo. 😊';
  if (porcento >= 30) return 'Amizade colorida. 😐';
  if (porcento >= 10) return 'Melhor como amigos. 🙃';
  return 'Foge enquanto pode. 💀';
}

export default {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Calcula a compatibilidade entre duas pessoas.')
    .addUserOption((o) => o.setName('pessoa1').setDescription('Primeira pessoa').setRequired(true))
    .addUserOption((o) => o.setName('pessoa2').setDescription('Segunda pessoa (padrão: você)')),

  async execute(interaction) {
    const pessoa1 = interaction.options.getUser('pessoa1', true);
    const pessoa2 = interaction.options.getUser('pessoa2') ?? interaction.user;

    if (pessoa1.id === pessoa2.id) {
      return interaction.reply({
        content: 'Autoamor é importante, mas escolha duas pessoas diferentes. 😅',
        flags: MessageFlags.Ephemeral,
      });
    }

    const porcento = calcular(pessoa1.id, pessoa2.id);
    const cheio = Math.round(porcento / 10);

    await interaction.reply({
      embeds: [
        embed(
          '💘 Ship',
          [
            `**${pessoa1.username}** + **${pessoa2.username}**`,
            '',
            `${'█'.repeat(cheio)}${'░'.repeat(10 - cheio)} **${porcento}%**`,
            '',
            frase(porcento),
          ].join('\n'),
          porcento >= 50 ? 0xeb459e : CORES.neutro,
        ),
      ],
    });
  },
};
