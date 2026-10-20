import { ActivityType, Events } from 'discord.js';
import { backupDiario } from '../lib/backup.js';
import { tickLembretes } from '../lib/lembretes.js';
import { tickSorteios } from '../lib/sorteios.js';
import { tickTempbans } from '../lib/tempbans.js';
import { tickEventos } from '../lib/eventos.js';

function rodarBackup() {
  try {
    backupDiario();
  } catch (erro) {
    console.error('[ERRO] Backup falhou:', erro.message);
  }
}

function iniciarRotinas(client) {
  // Sorteios: verifica a cada 15s se algum terminou.
  setInterval(() => tickSorteios(client), 15_000).unref();

  // Lembretes: verifica a cada 20s.
  setInterval(() => {
    tickLembretes(client).catch((erro) => console.error('[ERRO] Lembretes:', erro));
  }, 20_000).unref();

  // Tempbans: desbane quem cumpriu o tempo, a cada minuto.
  setInterval(() => {
    tickTempbans(client).catch((erro) => console.error('[ERRO] Tempbans:', erro));
  }, 60_000).unref();

  // Eventos: avisa no canal quando estiver perto de comecar.
  setInterval(() => {
    tickEventos(client).catch((erro) => console.error('[ERRO] Eventos:', erro));
  }, 30_000).unref();

  // Roda uma vez no start, para pegar o que venceu enquanto o bot estava off.
  tickSorteios(client);
  tickLembretes(client).catch(() => {});
  tickTempbans(client).catch(() => {});
  tickEventos(client).catch(() => {});

  // Backup do banco: no start e a cada 6h (so cria um arquivo por dia).
  rodarBackup();
  setInterval(rodarBackup, 6 * 60 * 60 * 1000).unref();
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
