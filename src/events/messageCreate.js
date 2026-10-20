import { Events } from 'discord.js';
import { agendarSticky, obterSticky } from '../lib/sticky.js';

export default {
  name: Events.MessageCreate,

  async execute(message) {
    if (!message.guild || message.author.bot) return;
    if (!obterSticky(message.channelId)) return;

    agendarSticky(message.client, message.channelId);
  },
};
