import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cargos')
    .setDescription('Lista os cargos do servidor.'),

  async execute(interaction) {
    const { guild } = interaction;
    if (!guild) {
      return interaction.reply({ content: 'Só funciona em servidores.', flags: MessageFlags.Ephemeral });
    }

    const cargos = [...guild.roles.cache.values()]
      .filter((cargo) => cargo.id !== guild.id)
      .sort((a, b) => b.position - a.position);

    const lista = cargos
      .slice(0, 30)
      .map((cargo) => {
        const cor = cargo.hexColor === '#000000' ? 'sem cor' : cargo.hexColor;
        return `${cargo} — **${cargo.members.size}** membro(s) — \`${cor}\``;
      })
      .join('\n');

    await interaction.reply({
      embeds: [
        embed(
          `Cargos de ${guild.name}`,
          lista || 'Nenhum cargo além do @everyone.',
          CORES.principal,
        ).setFooter({
          text:
            cargos.length > 30
              ? `Mostrando 30 de ${cargos.length} cargos`
              : `${cargos.length} cargo(s)`,
        }),
      ],
    });
  },
};
