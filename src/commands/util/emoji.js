import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

const CUSTOM = /^<(a?):(\w+):(\d+)>$/;

export default {
  data: new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('Mostra os dados de um emoji (funciona para emojis do servidor e unicode).')
    .addStringOption((o) =>
      o.setName('emoji').setDescription('Cole o emoji ou o ID').setRequired(true).setMaxLength(100),
    ),

  async execute(interaction) {
    const bruto = interaction.options.getString('emoji', true).trim();
    const custom = CUSTOM.exec(bruto);
    const id = custom?.[3] ?? (/^\d{15,25}$/.test(bruto) ? bruto : null);

    if (id) {
      const animado = custom?.[1] === 'a';
      const nome = custom?.[2] ?? interaction.client.emojis.cache.get(id)?.name ?? 'emoji';
      const url = `https://cdn.discordapp.com/emojis/${id}.${animado ? 'gif' : 'png'}`;

      return interaction.reply({
        embeds: [
          embed(nome, null, CORES.principal)
            .setThumbnail(url)
            .addFields(
              { name: 'ID', value: `\`${id}\``, inline: true },
              { name: 'Animado', value: animado ? 'sim' : 'não', inline: true },
              { name: 'Link', value: `[png/gif](${url})` },
            ),
        ],
      });
    }

    const pontos = [...bruto].map((c) => `U+${c.codePointAt(0).toString(16).toUpperCase()}`);

    if (pontos.length === 0 || pontos.length > 10) {
      return interaction.reply({
        content: 'Não reconheci isso como emoji.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      embeds: [
        embed('Emoji', `\n# ${bruto}\n`, CORES.principal).addFields({
          name: 'Códigos',
          value: pontos.map((p) => `\`${p}\``).join(' '),
        }),
      ],
    });
  },
};
