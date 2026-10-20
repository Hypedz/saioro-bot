import { EmbedBuilder, Events } from 'discord.js';
import { CORES_LOG, enviarLog } from '../lib/logs.js';

function cortar(texto, limite = 700) {
  if (!texto) return '_(vazio)_';
  return texto.length > limite ? `${texto.slice(0, limite)}…` : texto;
}

export default {
  name: Events.MessageUpdate,

  async execute(antiga, nova) {
    if (!nova.guild) return;
    if (nova.partial || antiga.partial) return;
    if (nova.author?.bot) return;
    if (antiga.content === nova.content) return;

    const painel = new EmbedBuilder()
      .setColor(CORES_LOG.mensagem)
      .setTitle('✏️ Mensagem editada')
      .setDescription(`[Ir para a mensagem](${nova.url})`)
      .addFields(
        { name: 'Antes', value: cortar(antiga.content) },
        { name: 'Depois', value: cortar(nova.content) },
        { name: 'Autor', value: `${nova.author} (\`${nova.author.id}\`)`, inline: true },
        { name: 'Canal', value: `${nova.channel}`, inline: true },
      );

    await enviarLog(nova.guild, painel);
  },
};
