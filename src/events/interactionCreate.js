import { Events, MessageFlags } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const comando = interaction.client.commands.get(interaction.commandName);
    if (!comando) {
      console.warn(`[AVISO] Comando /${interaction.commandName} nao encontrado.`);
      return;
    }

    try {
      await comando.execute(interaction);
    } catch (erro) {
      console.error(`[ERRO] Falha no comando /${interaction.commandName}:`, erro);

      const aviso = {
        content: 'Deu erro ao rodar esse comando. Veja o console do bot.',
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(aviso).catch(() => {});
      } else {
        await interaction.reply(aviso).catch(() => {});
      }
    }
  },
};
