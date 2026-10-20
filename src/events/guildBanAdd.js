import { AuditLogEvent, EmbedBuilder, Events } from 'discord.js';
import { CORES_LOG, enviarLog } from '../lib/logs.js';

export default {
  name: Events.GuildBanAdd,

  async execute(ban) {
    let executor = null;
    try {
      const auditoria = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 3 });
      const registro = auditoria.entries.find(
        (entrada) => entrada.target?.id === ban.user.id && Date.now() - entrada.createdTimestamp < 10_000,
      );
      executor = registro?.executor ?? null;
    } catch {
      // sem permissão de auditoria
    }

    await enviarLog(
      ban.guild,
      new EmbedBuilder()
        .setColor(CORES_LOG.moderacao)
        .setTitle('🔨 Banimento')
        .setDescription(`${ban.user} (\`${ban.user.id}\`)`)
        .setThumbnail(ban.user.displayAvatarURL())
        .setFooter({ text: executor ? `Por ${executor.tag}` : 'Autor desconhecido' }),
    );
  },
};
