import { EmbedBuilder, Events } from 'discord.js';
import { config } from '../config.js';
import { CORES_LOG, enviarLog } from '../lib/logs.js';
import { configuracoes } from '../lib/settings.js';

export default {
  name: Events.GuildMemberRemove,

  async execute(member) {
    const cfg = configuracoes(member.guild.id);
    const canalId = cfg.despedida ?? config.goodbyeChannelId;

    if (canalId) {
      const canal = member.guild.channels.cache.get(canalId);
      if (canal?.isTextBased()) {
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setAuthor({
            name: `${member.user.username} saiu`,
            iconURL: member.user.displayAvatarURL(),
          })
          .setDescription(
            `Até mais, <@${member.id}>. Restaram **${member.guild.memberCount}** membros.`,
          )
          .setTimestamp();

        await canal.send({ embeds: [embed] }).catch(() => {});
      }
    }

    await enviarLog(
      member.guild,
      new EmbedBuilder()
        .setColor(CORES_LOG.saida)
        .setTitle('📤 Membro saiu')
        .setDescription(`${member.user.tag} (\`${member.id}\`)`)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: `Restaram ${member.guild.memberCount} membros` }),
    );
  },
};
