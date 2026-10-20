import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config, missingConfig } from './config.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));

const faltando = missingConfig();
if (faltando.length > 0) {
  console.error('\n[ERRO] Faltam variaveis no arquivo .env: ' + faltando.join(', '));
  console.error('       Copie o .env.example para .env e preencha os valores.\n');
  process.exit(1);
}

const client = new Client({
  // Guilds: servidores e comandos de barra.
  // GuildMembers: entrar/sair de membros (precisa ativar o intent no portal).
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.commands = new Collection();

async function carregarComandos() {
  const pasta = path.join(aqui, 'commands');
  const arquivos = (await readdir(pasta)).filter((f) => f.endsWith('.js'));

  for (const arquivo of arquivos) {
    const modulo = await import(pathToFileURL(path.join(pasta, arquivo)).href);
    const comando = modulo.default ?? modulo;

    if (!comando?.data || typeof comando.execute !== 'function') {
      console.warn(`[AVISO] ${arquivo} nao exporta { data, execute } - ignorado.`);
      continue;
    }

    client.commands.set(comando.data.name, comando);
  }

  console.log(`[OK] ${client.commands.size} comando(s) carregado(s).`);
}

async function carregarEventos() {
  const pasta = path.join(aqui, 'events');
  const arquivos = (await readdir(pasta)).filter((f) => f.endsWith('.js'));

  for (const arquivo of arquivos) {
    const modulo = await import(pathToFileURL(path.join(pasta, arquivo)).href);
    const evento = modulo.default ?? modulo;
    const executar = (...args) => evento.execute(...args, client);

    if (evento.once) client.once(evento.name, executar);
    else client.on(evento.name, executar);
  }

  console.log(`[OK] ${arquivos.length} evento(s) carregado(s).`);
}

process.on('unhandledRejection', (erro) => {
  console.error('[ERRO] Promise rejeitada sem tratamento:', erro);
});

process.on('uncaughtException', (erro) => {
  console.error('[ERRO] Excecao nao capturada:', erro);
});

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, async () => {
    console.log('\n[INFO] Desligando o bot...');
    await client.destroy();
    process.exit(0);
  });
}

await carregarComandos();
await carregarEventos();
await client.login(config.token);
