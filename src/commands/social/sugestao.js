import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { configuracoes } from '../../lib/settings.js';
import { criarSugestao } from '../../lib/sugestoes.js';
import { embedErro } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sugestao')
    .setDescription('Envia uma sugestão para o canal de sugestões.')
    .addStringOption((o) =>
      o.setName('texto').setDescription('Sua sugestão').setRequired(true).setMaxLength(1500),
    )
    .addBooleanOption((o) =>
      o.setName('anonimo').setDescription('Não mostrar quem sugeriu'),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const cfg = configuracoes(interaction.guild.id);
    const canal = cfg.sugestoes
      ? interaction.guild.channels.cache.get(cfg.sugestoes)
      : interaction.channel;

    if (!canal?.isTextBased() || typeof canal.send !== 'function') {
      return interaction.reply({
        content: 'O canal de sugestões não está configurado. Peça para a staff rodar `/config sugestoes`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const sugestao = await criarSugestao(canal, {
        texto: interaction.options.getString('texto', true),
        autorId: interaction.user.id,
        anonimo: interaction.options.getBoolean('anonimo') ?? false,
      });

      await interaction.editReply({
        content: `✅ Sugestão enviada! [Ver mensagem](https://discord.com/channels/${interaction.guildId}/${canal.id}/${sugestao.message_id})`,
      });
    } catch (erro) {
      console.error('[ERRO] Falha ao criar sugestão:', erro);
      await interaction.editReply({ embeds: [embedErro('Não consegui enviar a sugestão.')] });
    }
  },
};
