import { Events, MessageFlags } from 'discord.js';
import { tratarComponente } from '../lib/componentes.js';
import { tratarModal } from '../lib/modais.js';

export default {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (interaction.isModalSubmit()) {
      try {
        await tratarModal(interaction);
      } catch (erro) {
        console.error('[ERRO] Falha no formulário:', erro);
        if (!interaction.replied && !interaction.deferred) {
          await interaction
            .reply({
              content: 'Deu erro ao publicar. Veja o console do bot.',
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      try {
        await tratarComponente(interaction);
      } catch (erro) {
        console.error('[ERRO] Falha ao tratar componente:', erro);
        if (!interaction.replied && !interaction.deferred) {
          await interaction
            .reply({
              content: 'Deu erro ao processar esse clique. Veja o console do bot.',
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const comando = interaction.client.commands.get(interaction.commandName);
    if (!comando) {
      console.warn(`[AVISO] Comando /${interaction.commandName} não encontrado.`);
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
