import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import {
  adicionarCargoPainel,
  listarCargosPainel,
  removerCargoPainel,
} from '../../lib/cargosPainel.js';

function montarPainel(guild, cargos) {
  const linhas = [];
  let atual = new ActionRowBuilder();

  for (const item of cargos) {
    const cargo = guild.roles.cache.get(item.role_id);
    if (!cargo) continue;

    const botao = new ButtonBuilder()
      .setCustomId(`cargo:${cargo.id}`)
      .setLabel(cargo.name.slice(0, 80))
      .setStyle(ButtonStyle.Secondary);

    if (item.emoji) botao.setEmoji(item.emoji);

    atual.addComponents(botao);

    if (atual.components.length === 5) {
      linhas.push(atual);
      atual = new ActionRowBuilder();
    }
  }

  if (atual.components.length > 0) linhas.push(atual);

  const painel = embed(
    '🎭 Escolha seus cargos',
    'Clique para receber ou remover um cargo. Clique de novo para sair.',
    CORES.principal,
  );

  return { embeds: [painel], components: linhas.slice(0, 5) };
}

export default {
  data: new SlashCommandBuilder()
    .setName('cargos-painel')
    .setDescription('Painel de cargos que os membros escolhem sozinhos.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('adicionar')
        .setDescription('Adiciona um cargo ao painel')
        .addRoleOption((o) => o.setName('cargo').setDescription('Cargo').setRequired(true))
        .addStringOption((o) =>
          o.setName('emoji').setDescription('Emoji do botão (opcional)').setMaxLength(5),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remover')
        .setDescription('Remove um cargo do painel')
        .addRoleOption((o) => o.setName('cargo').setDescription('Cargo').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('listar').setDescription('Lista os cargos do painel'))
    .addSubcommand((sub) =>
      sub
        .setName('publicar')
        .setDescription('Publica o painel no canal')
        .addChannelOption((o) => o.setName('canal').setDescription('Canal (padrão: este)')),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;
    const eu = guild.members.me;

    if (sub === 'adicionar') {
      const cargo = interaction.options.getRole('cargo', true);
      const emoji = interaction.options.getString('emoji');

      if (cargo.id === guild.id) {
        return interaction.reply({
          content: 'O cargo @everyone não pode entrar no painel.',
          flags: MessageFlags.Ephemeral,
        });
      }
      if (cargo.managed) {
        return interaction.reply({
          content: 'Esse cargo é gerenciado por integração e não pode ser dado na mão.',
          flags: MessageFlags.Ephemeral,
        });
      }
      if (cargo.position >= eu.roles.highest.position) {
        return interaction.reply({
          content: 'Esse cargo está acima do meu. Suba o cargo do bot e tente de novo.',
          flags: MessageFlags.Ephemeral,
        });
      }
      if (!eu.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: 'Preciso da permissão **Gerenciar Cargos**.',
          flags: MessageFlags.Ephemeral,
        });
      }

      adicionarCargoPainel(guild.id, cargo.id, emoji ?? null);

      return interaction.reply({
        content: `✅ ${cargo} adicionado ao painel. Publique com \`/cargos-painel publicar\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'remover') {
      const cargo = interaction.options.getRole('cargo', true);
      const removidos = removerCargoPainel(guild.id, cargo.id);

      return interaction.reply({
        content: removidos
          ? `🗑️ ${cargo} saiu do painel.`
          : `${cargo} não estava no painel.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'listar') {
      const cargos = listarCargosPainel(guild.id);

      if (cargos.length === 0) {
        return interaction.reply({
          content: 'O painel está vazio. Use `/cargos-painel adicionar`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        embeds: [
          embed(
            '🎭 Cargos no painel',
            cargos
              .map((item) => `<@&${item.role_id}>${item.emoji ? ` ${item.emoji}` : ''}`)
              .join('\n'),
            CORES.principal,
          ).setFooter({ text: `${cargos.length} cargo(s)` }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const canal = interaction.options.getChannel('canal') ?? interaction.channel;
    if (!canal?.isTextBased()) {
      return interaction.reply({
        content: 'Escolha um canal de texto.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const cargos = listarCargosPainel(guild.id);
    if (cargos.length === 0) {
      return interaction.reply({
        content: 'Adicione cargos antes de publicar: `/cargos-painel adicionar`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const mensagem = await canal.send(montarPainel(guild, cargos));

    await interaction.reply({
      content: `✅ Painel publicado em ${canal}: ${mensagem.url}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
