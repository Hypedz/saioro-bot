import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

const REGRAS = {
  pedra: 'tesoura',
  papel: 'pedra',
  tesoura: 'papel',
};

const EMOJI = { pedra: '🪨', papel: '📄', tesoura: '✂️' };

export default {
  data: new SlashCommandBuilder()
    .setName('ppt')
    .setDescription('Pedra, papel e tesoura contra o bot.')
    .addStringOption((o) =>
      o
        .setName('escolha')
        .setDescription('Sua jogada')
        .setRequired(true)
        .addChoices(
          { name: 'Pedra', value: 'pedra' },
          { name: 'Papel', value: 'papel' },
          { name: 'Tesoura', value: 'tesoura' },
        ),
    ),

  async execute(interaction) {
    const jogador = interaction.options.getString('escolha', true);
    const bot = Object.keys(EMOJI)[Math.floor(Math.random() * 3)];

    const resultado =
      jogador === bot
        ? 'Empate!'
        : REGRAS[jogador] === bot
          ? 'Você ganhou! 🎉'
          : 'Eu ganhei! 🤖';

    await interaction.reply({
      embeds: [
        embed(
          '🪨📄✂️',
          `Você: ${EMOJI[jogador]} **${jogador}**\nEu: ${EMOJI[bot]} **${bot}**\n\n**${resultado}**`,
          jogador === bot ? CORES.neutro : REGRAS[jogador] === bot ? CORES.sucesso : CORES.erro,
        ),
      ],
    });
  },
};
