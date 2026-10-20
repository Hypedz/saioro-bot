import { ActivityType, Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`[ONLINE] Logado como ${client.user.tag}`);
    console.log(`[ONLINE] Servidores: ${client.guilds.cache.size}`);
    client.user.setActivity('/help', { type: ActivityType.Listening });
  },
};
