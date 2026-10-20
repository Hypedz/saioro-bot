import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pastaDados = path.join(raiz, 'dados');
mkdirSync(pastaDados, { recursive: true });

export const db = new DatabaseSync(path.join(pastaDados, 'bot.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS configuracoes (
  guild_id     TEXT PRIMARY KEY,
  boas_vindas  TEXT,
  despedida    TEXT,
  logs         TEXT,
  cargo_auto   TEXT
);

CREATE TABLE IF NOT EXISTS avisos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id     TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  motivo       TEXT NOT NULL,
  criado_em    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_avisos_user ON avisos (guild_id, user_id);

CREATE TABLE IF NOT EXISTS lembretes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  channel_id TEXT,
  guild_id   TEXT,
  texto      TEXT NOT NULL,
  quando     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sorteios (
  message_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  guild_id   TEXT NOT NULL,
  premio     TEXT NOT NULL,
  host_id    TEXT NOT NULL,
  termina    INTEGER NOT NULL,
  vencedores INTEGER NOT NULL DEFAULT 1,
  encerrado  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sorteio_participantes (
  message_id TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS enquetes (
  message_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  guild_id   TEXT NOT NULL,
  pergunta   TEXT NOT NULL,
  opcoes     TEXT NOT NULL,
  autor_id   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enquete_votos (
  message_id TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  opcao      INTEGER NOT NULL,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS sugestoes (
  message_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  guild_id   TEXT NOT NULL,
  autor_id   TEXT NOT NULL,
  texto      TEXT NOT NULL,
  anonimo    INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'aberta',
  criado_em  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sugestao_votos (
  message_id TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  voto       INTEGER NOT NULL,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS snippets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id   TEXT NOT NULL,
  nome       TEXT NOT NULL,
  conteudo   TEXT NOT NULL,
  autor_id   TEXT NOT NULL,
  criado_em  INTEGER NOT NULL,
  UNIQUE (guild_id, nome)
);
`);

/** Adiciona colunas novas em bancos que ja existiam (migracao). */
function migrar(tabela, coluna, tipo) {
  const colunas = db
    .prepare('SELECT name FROM pragma_table_info(?)')
    .all(tabela)
    .map((linha) => linha.name);

  if (!colunas.includes(coluna)) {
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${tipo}`);
  }
}

migrar('configuracoes', 'sugestoes', 'TEXT');
migrar('configuracoes', 'verificar_cargo', 'TEXT');
