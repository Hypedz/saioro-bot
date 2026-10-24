import { REST, Routes } from 'discord.js';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config } from './config.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));

if (!config.token || !config.clientId) {
  console.error('\n[ERRO] Preencha DISCORD_TOKEN e CLIENT_ID no arquivo .env antes de registrar os comandos.\n');
  process.exit(1);
}

const base = path.join(aqui, 'commands');
const categorias = (await readdir(base, { withFileTypes: true })).filter((item) => item.isDirectory());
const modulos = [];

for (const categoria of categorias) {
  const pasta = path.join(base, categoria.name);
  for (const arquivo of (await readdir(pasta)).filter((f) => f.endsWith('.js'))) {
    const modulo = await import(pathToFileURL(path.join(pasta, arquivo)).href);
    const comando = modulo.default ?? modulo;
    if (comando?.data) modulos.push(comando);
  }
}

const globais = modulos.filter((comando) => comando.global === true).map((comando) => comando.data.toJSON());
const doServidor = modulos.filter((comando) => comando.global !== true).map((comando) => comando.data.toJSON());

const rest = new REST().setToken(config.token);
const rotaGlobal = Routes.applicationCommands(config.clientId);
const rotaGuild = config.guildId
  ? Routes.applicationGuildCommands(config.clientId, config.guildId)
  : null;

try {
  console.log(
    `[INFO] Registrando ${modulos.length} comando(s): ${globais.length} global(is) e ${doServidor.length} no servidor...`,
  );

  if (rotaGuild) {
    // O comando global é o que concede a badge APPLICATION_COMMAND_BADGE.
    // Os demais ficam no servidor para atualizar na hora.
    const globaisRegistrados = await rest.put(rotaGlobal, { body: globais });
    console.log(`[OK] ${globaisRegistrados.length} comando(s) global(is) registrados (badge de comandos).`);

    const servidorRegistrados = await rest.put(rotaGuild, { body: doServidor });
    console.log(`[OK] ${servidorRegistrados.length} comando(s) registrados no servidor (efeito imediato).`);
  } else {
    const todos = [...globais, ...doServidor];
    const registrados = await rest.put(rotaGlobal, { body: todos });
    console.log(`[OK] ${registrados.length} comando(s) globais registrados (podem levar ate 1 hora).`);
  }
} catch (erro) {
  console.error('[ERRO] Falha ao registrar:', erro);
  process.exit(1);
}
