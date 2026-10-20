import { AuditLogEvent, ChannelType, EmbedBuilder, Events } from 'discord.js';
import { CORES_LOG, enviarLog } from '../lib/logs.js';

const TIPOS = {
  [ChannelType.GuildText]: 'Texto',
  [ChannelType.GuildVoice]: 'Voz',
  [ChannelType.GuildCategory]: 'Categoria',
  [ChannelType.GuildAnnouncement]: 'Anúncios',
  [ChannelType.AnnouncementThread]: 'Thread de anúncios',
  [ChannelType.PublicThread]: 'Thread pública',
  [ChannelType.PrivateThread]: 'Thread privada',
  [ChannelType.GuildStageVoice]: 'Palco',
  [ChannelType.GuildForum]: 'Fórum',
  [ChannelType.GuildMedia]: 'Mídia',
};

export default {
  name: Events.ChannelCreate,

  async execute(canal) {
    if (!canal.guild) return;

    let executor = null;
    try {
      const auditoria = await canal.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 3 });
      const registro = auditoria.entries.find(
        (entrada) => entrada.target?.id === canal.id && Date.now() - entrada.createdTimestamp < 10_000,
      );
      executor = registro?.executor ?? null;
    } catch {
      // sem permissão de auditoria
    }

    await enviarLog(
      canal.guild,
      new EmbedBuilder()
        .setColor(CORES_LOG.entrada)
        .setTitle('📁 Canal criado')
        .setDescription(`**${canal.name}** (\`${canal.id}\`)\nTipo: ${TIPOS[canal.type] ?? canal.type}`)
        .setFooter({ text: executor ? `Por ${executor.tag}` : 'Autor desconhecido' }),
    );
  },
};
