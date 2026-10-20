import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { apagarLembrete, criarLembrete, listarLembretes } from '../../lib/lembretes.js';
import { formatarDuracao, parseDuracao } from '../../lib/tempo.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lembrete')
    .setDescription('Cria e gerencia lembretes.')
    .addSubcommand((sub) =>
      sub
        .setName('criar')
        .setDescription('Cria um lembrete')
        .addStringOption((o) =>
          o.setName('tempo').setDescription('Quando avisar (ex: 10m, 2h, 1d)').setRequired(true),
        )
        .addStringOption((o) =>
          o.setName('texto').setDescription('O que lembrar').setRequired(true).setMaxLength(500),
        ),
    )
    .addSubcommand((sub) => sub.setName('listar').setDescription('Mostra seus lembretes'))
    .addSubcommand((sub) =>
      sub
        .setName('cancelar')
        .setDescription('Cancela um lembrete')
        .addIntegerOption((o) =>
          o.setName('id').setDescription('Número mostrado em /lembrete listar').setRequired(true).setMinValue(1),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') {
      const tempoTexto = interaction.options.getString('tempo', true);
      const texto = interaction.options.getString('texto', true);
      const duracao = parseDuracao(tempoTexto);

      if (!duracao) {
        return interaction.reply({
          content: 'Não entendi o tempo. Use `30s`, `10m`, `2h` ou `1d` (máximo 30 dias).',
          flags: MessageFlags.Ephemeral,
        });
      }

      const quando = Date.now() + duracao;
      const id = criarLembrete({
        userId: interaction.user.id,
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        texto,
        quando,
      });

      return interaction.reply({
        embeds: [
          embed(
            '⏰ Lembrete criado',
            `Daqui a **${formatarDuracao(duracao)}** eu aviso você aqui.\n\n**${texto}**\n\n\`#${id}\``,
            CORES.sucesso,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'listar') {
      const lembretes = listarLembretes(interaction.user.id);

      if (lembretes.length === 0) {
        return interaction.reply({
          content: 'Você não tem lembretes. Crie com `/lembrete criar`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const lista = lembretes
        .map(
          (lembrete) =>
            `**#${lembrete.id}** — ${lembrete.texto}\n${`<t:${Math.floor(lembrete.quando / 1000)}:R>`}`,
        )
        .join('\n\n');

      return interaction.reply({
        embeds: [embed('⏰ Seus lembretes', lista, CORES.principal)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const id = interaction.options.getInteger('id', true);
    const apagados = apagarLembrete(id, interaction.user.id);

    return interaction.reply({
      content: apagados ? `Lembrete \`#${id}\` cancelado.` : `Não achei o lembrete \`#${id}\`.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
