import { Events } from 'discord.js';
import { contarMensagem } from '../lib/mensagens.js';
import { agendarSticky, obterSticky } from '../lib/sticky.js';

export default {
  name: Events.MessageCreate,

  async execute(message) {
    if (!message.guild || message.author.bot) return;

    if (!message.system) contarMensagem(message.guildId, message.author.id);

    if (!obterSticky(message.channelId)) return;

    agendarSticky(message.client, message.channelId);
  },
};
