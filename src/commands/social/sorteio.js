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
    )
    .addRoleOption((o) =>
      o.setName('cargo').setDescription('Só quem tem este cargo pode participar'),
    )
    .addIntegerOption((o) =>
      o
        .setName('conta')
        .setDescription('Idade mínima da conta em dias (padrão: sem exigência)')
        .setMinValue(0)
        .setMaxValue(3650),
    )
    .addIntegerOption((o) =>
      o
        .setName('mensagens')
        .setDescription('Mínimo de mensagens enviadas no servidor (padrão: sem exigência)')
        .setMinValue(0)
        .setMaxValue(1_000_000),
    ),

  async execute(interaction) {
    const premio = interaction.options.getString('premio', true);
    const tempoTexto = interaction.options.getString('tempo', true);
    const vencedores = interaction.options.getInteger('vencedores') ?? 1;
    const requisitoCargo = interaction.options.getRole('cargo')?.id ?? null;
    const requisitoConta = interaction.options.getInteger('conta') ?? 0;
    const requisitoMensagens = interaction.options.getInteger('mensagens') ?? 0;

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
        requisitoCargo,
        requisitoConta,
        requisitoMensagens,
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
