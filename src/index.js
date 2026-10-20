import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { config, missingConfig } from './config.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));

const faltando = missingConfig();
if (faltando.length > 0) {
  console.error('\n[ERRO] Faltam variaveis no arquivo .env: ' + faltando.join(', '));
  console.error('       Copie o .env.example para .env e preencha os valores.\n');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User],
});

client.commands = new Collection();

/** Carrega src/commands/<categoria>/<comando>.js e marca a categoria. */
async function carregarComandos() {
  const base = path.join(aqui, 'commands');
  const categorias = (await readdir(base, { withFileTypes: true })).filter((item) =>
    item.isDirectory(),
  );

  for (const categoria of categorias) {
    const pasta = path.join(base, categoria.name);
    const arquivos = (await readdir(pasta)).filter((arquivo) => arquivo.endsWith('.js'));

    for (const arquivo of arquivos) {
      const modulo = await import(pathToFileURL(path.join(pasta, arquivo)).href);
      const comando = modulo.default ?? modulo;

      if (!comando?.data || typeof comando.execute !== 'function') {
        console.warn(`[AVISO] ${categoria.name}/${arquivo} nao exporta { data, execute } - ignorado.`);
        continue;
      }

      comando.categoria = categoria.name;
      client.commands.set(comando.data.name, comando);
    }
  }

  const porCategoria = [...client.commands.values()].reduce((mapa, comando) => {
    mapa[comando.categoria] = (mapa[comando.categoria] ?? 0) + 1;
    return mapa;
  }, {});

  console.log(`[OK] ${client.commands.size} comando(s) carregado(s):`);
  for (const [categoria, total] of Object.entries(porCategoria)) {
    console.log(`     ${categoria}: ${total}`);
  }
}

async function carregarEventos() {
  const pasta = path.join(aqui, 'events');
  const arquivos = (await readdir(pasta)).filter((arquivo) => arquivo.endsWith('.js'));

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
