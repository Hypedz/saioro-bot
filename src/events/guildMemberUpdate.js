import { EmbedBuilder, Events } from 'discord.js';
import { CORES_LOG, enviarLog } from '../lib/logs.js';

export default {
  name: Events.GuildMemberUpdate,

  async execute(antigo, novo) {
    if (novo.user.bot) return;

    const antes = antigo.roles.cache;
    const depois = novo.roles.cache;

    const adicionados = [...depois.values()].filter((cargo) => !antes.has(cargo.id));
    const removidos = [...antes.values()].filter((cargo) => !depois.has(cargo.id));

    if (antigo.nickname !== novo.nickname) {
      await enviarLog(
        novo.guild,
        new EmbedBuilder()
          .setColor(CORES_LOG.mensagem)
          .setTitle('📝 Apelido alterado')
          .setDescription(`${novo} (\`${novo.id}\`)`)
          .addFields(
            { name: 'Antes', value: antigo.nickname ?? novo.user.username, inline: true },
            { name: 'Depois', value: novo.nickname ?? novo.user.username, inline: true },
          )
          .setThumbnail(novo.user.displayAvatarURL()),
      );
    }

    if (adicionados.length === 0 && removidos.length === 0) return;

    const painel = new EmbedBuilder()
      .setColor(CORES_LOG.moderacao)
      .setTitle('🎭 Cargos alterados')
      .setDescription(`${novo} (\`${novo.id}\`)`)
      .setThumbnail(novo.user.displayAvatarURL());

    if (adicionados.length) {
      painel.addFields({ name: 'Adicionados', value: adicionados.map((c) => `${c}`).join(' ') });
    }
    if (removidos.length) {
      painel.addFields({ name: 'Removidos', value: removidos.map((c) => `${c}`).join(' ') });
    }

    await enviarLog(novo.guild, painel);
  },
};
