import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { adicionarFaq, listarFaq, menuFaq, removerFaq, resumoFaq } from '../../lib/faq.js';

function podeGerenciar(interaction) {
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild));
}

export default {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Perguntas frequentes do servidor.')
    .addSubcommand((sub) => sub.setName('ver').setDescription('Abre o menu de perguntas'))
    .addSubcommand((sub) =>
      sub
        .setName('adicionar')
        .setDescription('Adiciona ou atualiza uma pergunta (staff)')
        .addStringOption((o) =>
          o.setName('pergunta').setDescription('A pergunta').setRequired(true).setMaxLength(100),
        )
        .addStringOption((o) =>
          o.setName('resposta').setDescription('A resposta').setRequired(true).setMaxLength(1900),
        )
        .addStringOption((o) =>
          o.setName('categoria').setDescription('Ex.: Regras, Cargos, Eventos').setMaxLength(50),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remover')
        .setDescription('Remove uma pergunta (staff)')
        .addStringOption((o) =>
          o
            .setName('pergunta')
            .setDescription('Comece a digitar para buscar')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) => sub.setName('listar').setDescription('Lista todas as perguntas (staff)')),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;

    if (sub === 'ver') {
      const itens = listarFaq(guild.id);

      if (itens.length === 0) {
        return interaction.reply({
          content:
            'Ainda não há perguntas cadastradas.\nStaff pode adicionar com `/faq adicionar`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        content: resumoFaq(itens),
        components: [menuFaq(itens)],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!podeGerenciar(interaction)) {
      return interaction.reply({
        content: 'Só quem gerencia o servidor pode mexer no FAQ.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'adicionar') {
      const pergunta = interaction.options.getString('pergunta', true).trim();
      const resposta = interaction.options.getString('resposta', true).trim();
      const categoria = interaction.options.getString('categoria')?.trim() || null;

      const { atualizada } = adicionarFaq({
        guildId: guild.id,
        pergunta,
        resposta,
        categoria,
        autorId: interaction.user.id,
      });

      const painel = embed(
        atualizada ? '♻️ Pergunta atualizada' : '✅ Pergunta salva',
        `**${pergunta}**\n\n${resposta}`,
        CORES.sucesso,
      );
      if (categoria) painel.setFooter({ text: categoria });

      return interaction.reply({ embeds: [painel], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'remover') {
      const bruto = interaction.options.getString('pergunta', true).trim();

      if (!/^\d+$/.test(bruto)) {
        return interaction.reply({
          content: 'Escolha uma pergunta da lista que aparece enquanto você digita.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const removidos = removerFaq(guild.id, Number(bruto));

      return interaction.reply({
        content: removidos
          ? '🗑️ Pergunta removida.'
          : 'Essa pergunta não existe mais. Use `/faq listar` para ver as atuais.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // listar
    const itens = listarFaq(guild.id);

    if (itens.length === 0) {
      return interaction.reply({
        content: 'Nenhuma pergunta cadastrada. Use `/faq adicionar`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const linhas = itens
      .slice(0, 30)
      .map((item) => `• **${item.pergunta}**${item.categoria ? ` — ${item.categoria}` : ''}`);

    const resto =
      itens.length > 30 ? `\n… e mais ${itens.length - 30} pergunta(s).` : '';

    return interaction.reply({
      embeds: [
        embed(`📖 FAQ (${itens.length})`, `${linhas.join('\n').slice(0, 3900)}${resto}`, CORES.principal),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },

  async autocomplete(interaction) {
    if (!interaction.guildId) return interaction.respond([]);

    const foco = interaction.options.getFocused().toLowerCase();

    const opcoes = listarFaq(interaction.guildId)
      .filter((item) => item.pergunta.toLowerCase().includes(foco))
      .slice(0, 25)
      .map((item) => ({
        name: item.pergunta.slice(0, 100),
        value: String(item.id),
      }));

    return interaction.respond(opcoes);
  },
};
