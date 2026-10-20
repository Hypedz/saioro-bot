import { EmbedBuilder, Events } from 'discord.js';
import { CORES_LOG, enviarLog } from '../lib/logs.js';

export default {
  name: Events.VoiceStateUpdate,

  async execute(antigo, novo) {
    const membro = novo.member ?? antigo.member;
    if (!membro || membro.user.bot) return;

    const de = antigo.channel;
    const para = novo.channel;
    if (de?.id === para?.id) return; // mudou só mute/afk, não interessa

    let titulo = '🔀 Mudou de canal de voz';
    let cor = CORES_LOG.mensagem;

    if (!de && para) {
      titulo = '🔊 Entrou na voz';
      cor = CORES_LOG.entrada;
    } else if (de && !para) {
      titulo = '🔈 Saiu da voz';
      cor = CORES_LOG.saida;
    }

    const painel = new EmbedBuilder()
      .setColor(cor)
      .setTitle(titulo)
      .setDescription(`${membro} (\`${membro.id}\`)`)
      .addFields({ name: 'De', value: de ? de.name : '—', inline: true });

    if (para) painel.addFields({ name: 'Para', value: para.name, inline: true });

    await enviarLog(membro.guild, painel);
  },
};
