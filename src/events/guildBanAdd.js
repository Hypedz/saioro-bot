import { AuditLogEvent, EmbedBuilder, Events } from 'discord.js';
import { CORES_LOG, enviarLog } from '../lib/logs.js';
import { foiAcaoDoBot } from '../lib/moderacao.js';

export default {
  name: Events.GuildBanAdd,

  async execute(ban) {
    if (foiAcaoDoBot('ban', ban.user.id)) return;

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

    // Banimentos feitos pelo próprio bot já são registrados pelo comando.
    if (executor?.id === ban.client.user.id) return;

    const painel = new EmbedBuilder()
      .setColor(CORES_LOG.moderacao)
      .setTitle('🔨 Banimento')
      .setDescription(`${ban.user} (\`${ban.user.id}\`)`)
      .setThumbnail(ban.user.displayAvatarURL())
      .setFooter({ text: executor ? `Por ${executor.tag}` : 'Autor desconhecido' });

    if (ban.reason) painel.addFields({ name: 'Motivo', value: ban.reason.slice(0, 1024) });

    await enviarLog(ban.guild, painel);
  },
};
