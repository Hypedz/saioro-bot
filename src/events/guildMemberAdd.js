import { EmbedBuilder, Events, MessageFlags } from 'discord.js';
import { config } from '../config.js';

const COR = 0x2ecc71;

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (!config.welcomeChannelId) return;

    const canal = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!canal?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(COR)
      .setAuthor({
        name: `${member.user.username} entrou!`,
        iconURL: member.user.displayAvatarURL(),
      })
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setDescription(
        [
          `Bem-vindo(a), <@${member.id}>!`,
          '',
          `Agora somos **${member.guild.memberCount}** membros.`,
          'Use `/help` para ver os comandos.',
        ].join('\n'),
      )
      .setTimestamp();

    await canal.send({ embeds: [embed] }).catch((erro) => {
      console.error('[ERRO] Nao consegui mandar a mensagem de boas-vindas:', erro.message);
    });
  },
};
