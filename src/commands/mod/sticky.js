import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import {
  cancelarPendente,
  obterSticky,
  removerSticky,
  salvarSticky,
} from '../../lib/sticky.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sticky')
    .setDescription('Mensagem que fica sempre no fim do canal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName('definir')
        .setDescription('Define a mensagem fixa deste canal')
        .addStringOption((o) =>
          o.setName('texto').setDescription('Mensagem').setRequired(true).setMaxLength(1900),
        ),
    )
    .addSubcommand((sub) => sub.setName('remover').setDescription('Remove a mensagem fixa'))
    .addSubcommand((sub) => sub.setName('ver').setDescription('Mostra a mensagem fixa atual')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const canal = interaction.channel;

    if (!canal?.isTextBased()) {
      return interaction.reply({
        content: 'Só funciona em canal de texto.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'definir') {
      const texto = interaction.options.getString('texto', true);

      const anterior = obterSticky(canal.id);
      if (anterior?.message_id) {
        const antiga = await canal.messages.fetch(anterior.message_id).catch(() => null);
        await antiga?.delete().catch(() => {});
      }

      const mensagem = await canal.send({ content: texto, allowedMentions: { parse: [] } });
      salvarSticky(interaction.guild.id, canal.id, mensagem.id, texto);

      return interaction.reply({
        content: `✅ Mensagem fixa definida. Ela volta ao fim do canal sempre que alguém falar.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'remover') {
      cancelarPendente(canal.id);

      const atual = obterSticky(canal.id);
      if (!atual) {
        return interaction.reply({
          content: 'Este canal não tem mensagem fixa.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (atual.message_id) {
        const antiga = await canal.messages.fetch(atual.message_id).catch(() => null);
        await antiga?.delete().catch(() => {});
      }

      removerSticky(canal.id);

      return interaction.reply({
        content: '🗑️ Mensagem fixa removida.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const atual = obterSticky(canal.id);
    if (!atual) {
      return interaction.reply({
        content: 'Este canal não tem mensagem fixa. Crie com `/sticky definir`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      embeds: [embed('📌 Mensagem fixa', atual.texto, CORES.principal)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
