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
const comandos = [];

for (const categoria of categorias) {
  const pasta = path.join(base, categoria.name);
  for (const arquivo of (await readdir(pasta)).filter((f) => f.endsWith('.js'))) {
    const modulo = await import(pathToFileURL(path.join(pasta, arquivo)).href);
    const comando = modulo.default ?? modulo;
    if (comando?.data) comandos.push(comando.data.toJSON());
  }
}

const rest = new REST().setToken(config.token);
const rota = config.guildId
  ? Routes.applicationGuildCommands(config.clientId, config.guildId)
  : Routes.applicationCommands(config.clientId);

try {
  console.log(`[INFO] Registrando ${comandos.length} comando(s)...`);
  const dados = await rest.put(rota, { body: comandos });
  console.log(`[OK] ${dados.length} comando(s) registrados.`);
  console.log(
    config.guildId
      ? '[OK] Escopo: servidor (aparecem na hora).'
      : '[OK] Escopo: global (pode levar ate 1 hora para aparecer).',
  );
} catch (erro) {
  console.error('[ERRO] Falha ao registrar:', erro);
  process.exit(1);
}
