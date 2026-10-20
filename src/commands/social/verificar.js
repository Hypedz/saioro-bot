import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { configuracoes } from '../../lib/settings.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Publica o painel de verificação com botão de cargo.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName('canal').setDescription('Onde publicar (padrão: este canal)')),

  async execute(interaction) {
    const cfg = configuracoes(interaction.guild.id);

    if (!cfg.verificarCargo) {
      return interaction.reply({
        content: 'Defina primeiro o cargo com `/config verificar-cargo @cargo`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const cargo = interaction.guild.roles.cache.get(cfg.verificarCargo);
    if (!cargo) {
      return interaction.reply({
        content: 'O cargo configurado não existe mais. Rode `/config verificar-cargo` de novo.',
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

    const painel = embed(
      '✅ Verificação',
      `Clique no botão abaixo para receber o cargo **${cargo.name}** e liberar o servidor.`,
      CORES.sucesso,
    );

    const botao = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verificar:${cargo.id}`)
        .setLabel('Verificar')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
    );

    const mensagem = await canal.send({ embeds: [painel], components: [botao] });

    await interaction.reply({
      content: `✅ Painel publicado em ${canal}: ${mensagem.url}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
