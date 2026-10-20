import { ActivityType, Events } from 'discord.js';
import { tickLembretes } from '../lib/lembretes.js';
import { tickSorteios } from '../lib/sorteios.js';

function iniciarRotinas(client) {
  // Sorteios: verifica a cada 15s se algum terminou.
  setInterval(() => tickSorteios(client), 15_000).unref();

  // Lembretes: verifica a cada 20s.
  setInterval(() => {
    tickLembretes(client).catch((erro) => console.error('[ERRO] Lembretes:', erro));
  }, 20_000).unref();

  // Roda uma vez no start, para pegar o que venceu enquanto o bot estava off.
  tickSorteios(client);
  tickLembretes(client).catch(() => {});
}

export default {
  name: Events.ClientReady,
  once: true,

  execute(client) {
    console.log(`[ONLINE] Logado como ${client.user.tag}`);
    console.log(`[ONLINE] Servidores: ${client.guilds.cache.size} | Comandos: ${client.commands.size}`);

    client.user.setActivity('/help', { type: ActivityType.Listening });
    iniciarRotinas(client);
  },
};
