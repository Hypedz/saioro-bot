import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pasta = path.join(raiz, 'dados', 'backups');
const MANTER = 7;

/**
 * Cria um backup consistente do banco (VACUUM INTO) uma vez por dia
 * e mantem os 7 mais recentes.
 */
export function backupDiario() {
  mkdirSync(pasta, { recursive: true });

  const hoje = new Date().toISOString().slice(0, 10);
  const destino = path.join(pasta, `bot-${hoje}.db`);

  if (!existsSync(destino)) {
    const caminho = destino.replace(/'/g, "''");
    db.exec(`VACUUM INTO '${caminho}'`);
    console.log(`[BACKUP] Criado ${path.basename(destino)}`);
  }

  const arquivos = readdirSync(pasta)
    .filter((nome) => nome.startsWith('bot-') && nome.endsWith('.db'))
    .map((nome) => ({ nome, modificado: statSync(path.join(pasta, nome)).mtimeMs }))
    .sort((a, b) => b.modificado - a.modificado);

  for (const antigo of arquivos.slice(MANTER)) {
    unlinkSync(path.join(pasta, antigo.nome));
    console.log(`[BACKUP] Removido ${antigo.nome} (rotatividade)`);
  }

  return destino;
}
