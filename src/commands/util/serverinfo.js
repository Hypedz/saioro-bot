import { ChannelType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { CORES, dataCurta, embed } from '../../lib/embeds.js';

const NIVEIS = {
  0: 'Nenhuma',
  1: 'Baixa',
  2: 'Média',
  3: 'Alta',
  4: 'Máxima',
};

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Mostra as informações do servidor.'),

  async execute(interaction) {
    const { guild } = interaction;
    if (!guild) {
      return interaction.reply({ content: 'Só funciona em servidores.', flags: MessageFlags.Ephemeral });
    }

    const dono = await guild.fetchOwner().catch(() => null);
    const canais = guild.channels.cache;
    const texto = canais.filter((c) => c.type === ChannelType.GuildText).size;
    const voz = canais.filter((c) => c.type === ChannelType.GuildVoice).size;

    const painel = embed(guild.name, null, CORES.principal)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Dono', value: dono ? `${dono}` : 'desconhecido', inline: true },
        { name: 'ID', value: `\`${guild.id}\``, inline: true },
        { name: 'Criado em', value: dataCurta(guild.createdAt), inline: false },
        {
          name: 'Membros',
          value: `**${guild.memberCount}** (${guild.presences?.cache.size ?? 0} online)`,
          inline: true,
        },
        { name: 'Canais', value: `${texto} texto • ${voz} voz`, inline: true },
        { name: 'Cargos', value: `**${guild.roles.cache.size}**`, inline: true },
        {
          name: 'Boosts',
          value: `Nível **${guild.premiumTier}** • ${guild.premiumSubscriptionCount ?? 0} boost(s)`,
          inline: true,
        },
        { name: 'Verificação', value: NIVEIS[guild.verificationLevel] ?? '—', inline: true },
      );

    if (guild.bannerURL()) painel.setImage(guild.bannerURL({ size: 512 }));

    await interaction.reply({ embeds: [painel] });
  },
};
