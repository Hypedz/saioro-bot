import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { apagarSnippet, criarSnippet, listarSnippets, obterSnippet } from '../../lib/snippets.js';

const NOME = /^[a-z0-9_-]{2,32}$/;

function normalizar(nome) {
  return nome.trim().toLowerCase();
}

export default {
  data: new SlashCommandBuilder()
    .setName('snippet')
    .setDescription('Salva e consulta trechos de código.')
    .addSubcommand((sub) =>
      sub
        .setName('criar')
        .setDescription('Cria ou atualiza um snippet')
        .addStringOption((o) =>
          o
            .setName('nome')
            .setDescription('Nome curto (letras, números, - e _)')
            .setRequired(true)
            .setMaxLength(32),
        )
        .addStringOption((o) =>
          o.setName('codigo').setDescription('O código').setRequired(true).setMaxLength(1900),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('ver')
        .setDescription('Mostra um snippet')
        .addStringOption((o) => o.setName('nome').setDescription('Nome do snippet').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('listar').setDescription('Lista os snippets do servidor'))
    .addSubcommand((sub) =>
      sub
        .setName('apagar')
        .setDescription('Apaga um snippet')
        .addStringOption((o) => o.setName('nome').setDescription('Nome do snippet').setRequired(true)),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'criar') {
      const nome = normalizar(interaction.options.getString('nome', true));

      if (!NOME.test(nome)) {
        return interaction.reply({
          content: 'Nome inválido. Use de 2 a 32 caracteres: letras minúsculas, números, `-` ou `_`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const { atualizado } = criarSnippet({
        guildId,
        nome,
        conteudo: interaction.options.getString('codigo', true),
        autorId: interaction.user.id,
      });

      return interaction.reply({
        content: atualizado
          ? `♻️ Snippet \`${nome}\` atualizado. Use \`/snippet ver ${nome}\`.`
          : `✅ Snippet \`${nome}\` criado. Use \`/snippet ver ${nome}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'ver') {
      const nome = normalizar(interaction.options.getString('nome', true));
      const snippet = obterSnippet(guildId, nome);

      if (!snippet) {
        return interaction.reply({
          content: `Não achei o snippet \`${nome}\`. Veja a lista com \`/snippet listar\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        content: `**${snippet.nome}** — por <@${snippet.autor_id}>\n\`\`\`\n${snippet.conteudo}\n\`\`\``,
      });
    }

    if (sub === 'listar') {
      const snippets = listarSnippets(guildId);

      if (snippets.length === 0) {
        return interaction.reply({
          content: 'Nenhum snippet salvo ainda. Crie com `/snippet criar`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        embeds: [
          embed(
            `Snippets de ${interaction.guild.name}`,
            snippets.map((s) => `\`${s.nome}\``).join(' • '),
            CORES.principal,
          ).setFooter({ text: `${snippets.length} snippet(s) • /snippet ver <nome>` }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const nome = normalizar(interaction.options.getString('nome', true));
    const snippet = obterSnippet(guildId, nome);

    if (!snippet) {
      return interaction.reply({
        content: `Não achei o snippet \`${nome}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const podeApagar =
      snippet.autor_id === interaction.user.id ||
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

    if (!podeApagar) {
      return interaction.reply({
        content: 'Só quem criou o snippet (ou quem gerencia o servidor) pode apagar.',
        flags: MessageFlags.Ephemeral,
      });
    }

    apagarSnippet(guildId, nome);

    return interaction.reply({
      content: `🗑️ Snippet \`${nome}\` apagado.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
