import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { embedErro } from '../../lib/embeds.js';
import { criarSorteio } from '../../lib/sorteios.js';
import { parseDuracao } from '../../lib/tempo.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sorteio')
    .setDescription('Cria um sorteio com botão de participar.')
    .addStringOption((o) =>
      o.setName('premio').setDescription('O que será sorteado').setRequired(true).setMaxLength(200),
    )
    .addStringOption((o) =>
      o
        .setName('tempo')
        .setDescription('Duração (ex: 10m, 2h, 1d)')
        .setRequired(true)
        .setMaxLength(20),
    )
    .addIntegerOption((o) =>
      o.setName('vencedores').setDescription('Quantos vencedores (padrão: 1)').setMinValue(1).setMaxValue(20),
    ),

  async execute(interaction) {
    const premio = interaction.options.getString('premio', true);
    const tempoTexto = interaction.options.getString('tempo', true);
    const vencedores = interaction.options.getInteger('vencedores') ?? 1;

    const duracao = parseDuracao(tempoTexto);
    if (!duracao) {
      return interaction.reply({
        content: 'Não entendi o tempo. Use algo como `30s`, `10m`, `2h` ou `1d` (máximo 30 dias).',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.channel?.isTextBased()) {
      return interaction.reply({
        content: 'Só dá para criar sorteio em canal de texto.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const sorteio = await criarSorteio(interaction.channel, {
        premio,
        duracaoMs: duracao,
        vencedores,
        hostId: interaction.user.id,
      });

      await interaction.editReply({
        content: `🎉 Sorteio criado! [Ir para a mensagem](https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${sorteio.message_id})`,
      });
    } catch (erro) {
      console.error('[ERRO] Falha ao criar sorteio:', erro);
      await interaction.editReply({ embeds: [embedErro('Não consegui criar o sorteio.')] });
    }
  },
};
