import { SlashCommandBuilder } from 'discord.js';
import { CORES, dataCurta, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Mostra informações de um membro.')
    .addUserOption((opcao) =>
      opcao.setName('membro').setDescription('Quem ver (padrão: você)'),
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser('membro') ?? interaction.user;
    const membro = await interaction.guild?.members.fetch(usuario.id).catch(() => null);

    const cargos = membro
      ? [...membro.roles.cache.values()]
          .filter((cargo) => cargo.id !== interaction.guild.id)
          .sort((a, b) => b.position - a.position)
          .slice(0, 12)
          .map((cargo) => `${cargo}`)
          .join(' ')
      : '';

    const painel = embed(usuario.username, usuario.bot ? '🤖 Bot' : null, CORES.principal)
      .setThumbnail(usuario.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: `\`${usuario.id}\``, inline: true },
        { name: 'Apelido', value: membro?.nickname ?? '—', inline: true },
        { name: 'Conta criada', value: dataCurta(usuario.createdAt), inline: false },
      );

    if (membro) {
      painel.addFields(
        { name: 'Entrou em', value: dataCurta(membro.joinedAt), inline: false },
        {
          name: `Cargos (${Math.max(0, membro.roles.cache.size - 1)})`,
          value: cargos || '—',
        },
      );
    }

    await interaction.reply({ embeds: [painel] });
  },
};
