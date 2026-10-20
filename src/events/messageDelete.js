import { AuditLogEvent, EmbedBuilder, Events } from 'discord.js';
import { CORES_LOG, enviarLog } from '../lib/logs.js';

function cortar(texto, limite = 900) {
  if (!texto) return null;
  return texto.length > limite ? `${texto.slice(0, limite)}…` : texto;
}

export default {
  name: Events.MessageDelete,

  async execute(message) {
    if (!message.guild) return;
    if (message.author?.id === message.client.user.id) return;

    let executor = null;
    try {
      const auditoria = await message.guild.fetchAuditLogs({
        type: AuditLogEvent.MessageDelete,
        limit: 5,
      });
      const registro = auditoria.entries.find(
        (entrada) =>
          entrada.target?.id === message.author?.id && Date.now() - entrada.createdTimestamp < 10_000,
      );
      executor = registro?.executor ?? null;
    } catch {
      // Sem permissao de ver auditoria: segue sem o autor da acao.
    }

    const painel = new EmbedBuilder()
      .setColor(CORES_LOG.mensagem)
      .setTitle('🗑️ Mensagem apagada')
      .setDescription(cortar(message.content) ?? '_conteúdo indisponível_')
      .addFields(
        {
          name: 'Autor',
          value: message.author ? `${message.author} (\`${message.author.id}\`)` : 'desconhecido',
          inline: true,
        },
        { name: 'Canal', value: `${message.channel}`, inline: true },
      )
      .setFooter({
        text: executor ? `Apagada por ${executor.tag}` : `ID da mensagem: ${message.id}`,
      });

    if (message.attachments?.size) {
      painel.addFields({
        name: 'Anexos',
        value: [...message.attachments.values()].map((a) => a.name).join(', ').slice(0, 300),
      });
    }

    await enviarLog(message.guild, painel);
  },
};
