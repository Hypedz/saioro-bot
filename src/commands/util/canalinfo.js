import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { CORES, dataCurta, embed } from '../../lib/embeds.js';

const TIPOS = {
  [ChannelType.GuildText]: 'Texto',
  [ChannelType.GuildVoice]: 'Voz',
  [ChannelType.GuildCategory]: 'Categoria',
  [ChannelType.GuildAnnouncement]: 'Anúncios',
  [ChannelType.GuildStageVoice]: 'Palco',
  [ChannelType.GuildForum]: 'Fórum',
  [ChannelType.PublicThread]: 'Thread pública',
  [ChannelType.PrivateThread]: 'Thread privada',
  [ChannelType.GuildMedia]: 'Mídia',
};

export default {
  data: new SlashCommandBuilder()
    .setName('canalinfo')
    .setDescription('Mostra informações de um canal.')
    .addChannelOption((o) => o.setName('canal').setDescription('Canal (padrão: este)')),

  async execute(interaction) {
    const canal = interaction.options.getChannel('canal') ?? interaction.channel;

    const painel = embed(`#${canal.name}`, null, CORES.principal).addFields(
      { name: 'ID', value: `\`${canal.id}\``, inline: true },
      { name: 'Tipo', value: TIPOS[canal.type] ?? `tipo ${canal.type}`, inline: true },
      { name: 'Criado em', value: dataCurta(canal.createdAt), inline: false },
    );

    if (canal.parent) painel.addFields({ name: 'Categoria', value: canal.parent.name, inline: true });
    if (canal.topic) painel.addFields({ name: 'Tópico', value: canal.topic.slice(0, 400) });
    if (typeof canal.rateLimitPerUser === 'number') {
      painel.addFields(
        { name: 'Modo lento', value: canal.rateLimitPerUser ? `${canal.rateLimitPerUser}s` : 'desligado', inline: true },
        { name: 'NSFW', value: canal.nsfw ? 'sim' : 'não', inline: true },
      );
    }

    await interaction.reply({ embeds: [painel] });
  },
};
