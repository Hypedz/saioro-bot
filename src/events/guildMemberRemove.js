import { EmbedBuilder, Events } from 'discord.js';
import { config } from '../config.js';

const COR = 0xe74c3c;

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    if (!config.goodbyeChannelId) return;

    const canal = member.guild.channels.cache.get(config.goodbyeChannelId);
    if (!canal?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(COR)
      .setAuthor({
        name: `${member.user.username} saiu`,
        iconURL: member.user.displayAvatarURL(),
      })
      .setDescription(`Ate mais, <@${member.id}>. Restaram **${member.guild.memberCount}** membros.`)
      .setTimestamp();

    await canal.send({ embeds: [embed] }).catch((erro) => {
      console.error('[ERRO] Nao consegui mandar a mensagem de despedida:', erro.message);
    });
  },
};
