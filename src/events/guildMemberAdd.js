import { EmbedBuilder, Events } from 'discord.js';
import { config } from '../config.js';
import { CORES_LOG, enviarLog } from '../lib/logs.js';
import { configuracoes, formatarBoasVindas } from '../lib/settings.js';
import { processarEntradaAntiraid } from '../lib/antiraid.js';

export default {
  name: Events.GuildMemberAdd,

  async execute(member) {
    const cfg = configuracoes(member.guild.id);

    // Anti-raid: roda antes das mensagens para reagir o quanto antes.
    await processarEntradaAntiraid(member).catch((erro) =>
      console.error('[ERRO] Anti-raid:', erro),
    );

    // Cargo automatico
    if (cfg.cargoAuto) {
      await member.roles
        .add(cfg.cargoAuto, 'Cargo automático de entrada')
        .catch((erro) => console.error('[ERRO] Cargo automático:', erro.message));
    }

    // Boas-vindas (config do banco > .env)
    const canalId = cfg.boasVindas ?? config.welcomeChannelId;
    if (canalId) {
      const canal = member.guild.channels.cache.get(canalId);
      if (canal?.isTextBased()) {
        const descricao = cfg.boasVindasTexto
          ? formatarBoasVindas(cfg.boasVindasTexto, member)
          : [
              `Bem-vindo(a), <@${member.id}>!`,
              '',
              `Agora somos **${member.guild.memberCount}** membros.`,
              'Use `/help` para ver os comandos.',
            ].join('\n');

        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setAuthor({
            name: `${member.user.username} entrou!`,
            iconURL: member.user.displayAvatarURL(),
          })
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .setDescription(descricao)
          .setTimestamp();

        if (cfg.boasVindasImagem) embed.setImage(cfg.boasVindasImagem);

        await canal.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // Mensagem no privado (opcional)
    if (cfg.boasVindasDm) {
      await member
        .send({ content: formatarBoasVindas(cfg.boasVindasDm, member) })
        .catch((erro) => console.warn('[AVISO] DM de boas-vindas não entregue:', erro.message));
    }

    // Log de entrada
    await enviarLog(
      member.guild,
      new EmbedBuilder()
        .setColor(CORES_LOG.entrada)
        .setTitle('📥 Membro entrou')
        .setDescription(
          `${member} (\`${member.id}\`)\nConta criada <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: `Agora somos ${member.guild.memberCount} membros` }),
    );
  },
};
