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

CREATE TABLE IF NOT EXISTS cargos_painel (
  guild_id TEXT NOT NULL,
  role_id  TEXT NOT NULL,
  emoji    TEXT,
  PRIMARY KEY (guild_id, role_id)
);

CREATE TABLE IF NOT EXISTS sticky (
  channel_id TEXT PRIMARY KEY,
  guild_id   TEXT NOT NULL,
  message_id TEXT,
  texto      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tempbans (
  guild_id     TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  motivo       TEXT NOT NULL,
  expira_em    INTEGER NOT NULL,
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS eventos (
  event_id   TEXT PRIMARY KEY,
  guild_id   TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  inicio     INTEGER NOT NULL,
  aviso_em   INTEGER NOT NULL,
  avisado    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faq (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id   TEXT NOT NULL,
  pergunta   TEXT NOT NULL,
  resposta   TEXT NOT NULL,
  categoria  TEXT,
  autor_id   TEXT NOT NULL,
  criado_em  INTEGER NOT NULL,
  UNIQUE (guild_id, pergunta)
);

CREATE TABLE IF NOT EXISTS perfis (
  guild_id          TEXT NOT NULL,
  user_id           TEXT NOT NULL,
  titulo            TEXT,
  bio               TEXT,
  pronomes          TEXT,
  cor               TEXT,
  imagem            TEXT,
  mostrar_entrada   INTEGER NOT NULL DEFAULT 1,
  mostrar_cargos    INTEGER NOT NULL DEFAULT 1,
  mostrar_pronomes  INTEGER NOT NULL DEFAULT 1,
  mostrar_emblemas  INTEGER NOT NULL DEFAULT 1,
  mostrar_sugestoes INTEGER NOT NULL DEFAULT 1,
  mostrar_sorteios  INTEGER NOT NULL DEFAULT 1,
  atualizado_em     INTEGER,
  PRIMARY KEY (guild_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sugestoes_autor ON sugestoes (guild_id, autor_id);
CREATE INDEX IF NOT EXISTS idx_sorteio_part_user ON sorteio_participantes (user_id);

CREATE TABLE IF NOT EXISTS automod_regras (
  guild_id TEXT NOT NULL,
  rule_id  TEXT NOT NULL,
  tipo     TEXT NOT NULL,
  PRIMARY KEY (guild_id, rule_id)
);

CREATE TABLE IF NOT EXISTS mensagens (
  guild_id TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  total    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS sorteio_vencedores (
  message_id TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  rodada     INTEGER NOT NULL,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS denuncias (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id     TEXT NOT NULL,
  autor_id     TEXT NOT NULL,
  alvo_id      TEXT NOT NULL,
  texto        TEXT NOT NULL,
  provas       TEXT,
  anonimo      INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'aberta',
  channel_id   TEXT NOT NULL,
  message_id   TEXT NOT NULL,
  criado_em    INTEGER NOT NULL,
  decidido_por TEXT,
  decidido_em  INTEGER
);

CREATE TABLE IF NOT EXISTS candidaturas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id     TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  cargo_id     TEXT,
  respostas    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pendente',
  channel_id   TEXT NOT NULL,
  message_id   TEXT NOT NULL,
  criado_em    INTEGER NOT NULL,
  decidido_por TEXT,
  decidido_em  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_candidaturas_pendentes ON candidaturas (guild_id, user_id, status);

CREATE TABLE IF NOT EXISTS regras (
  guild_id    TEXT PRIMARY KEY,
  titulo      TEXT NOT NULL,
  texto       TEXT NOT NULL,
  channel_id  TEXT,
  message_id  TEXT,
  atualizado_em INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS antiraid_config (
  guild_id   TEXT PRIMARY KEY,
  ativo      INTEGER NOT NULL DEFAULT 0,
  canal_id   TEXT,
  limite     INTEGER NOT NULL DEFAULT 5,
  janela     INTEGER NOT NULL DEFAULT 30,
  conta_dias INTEGER NOT NULL DEFAULT 7,
  acao       TEXT NOT NULL DEFAULT 'alerta',
  duracao    INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS antiraid_lockdown (
  guild_id   TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  anterior   INTEGER,
  termina    INTEGER NOT NULL,
  PRIMARY KEY (guild_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_antiraid_lockdown_termina ON antiraid_lockdown (termina);
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
migrar('configuracoes', 'boas_vindas_texto', 'TEXT');
migrar('configuracoes', 'boas_vindas_dm', 'TEXT');
migrar('configuracoes', 'boas_vindas_imagem', 'TEXT');
migrar('configuracoes', 'denuncias', 'TEXT');
migrar('configuracoes', 'candidaturas', 'TEXT');
migrar('configuracoes', 'candidatura_cargo', 'TEXT');
migrar('perfis', 'mostrar_emblemas', 'INTEGER NOT NULL DEFAULT 1');

migrar('candidaturas', 'cargo_id', 'TEXT');

migrar('sorteios', 'requisito_cargo', 'TEXT');
migrar('sorteios', 'requisito_conta', 'INTEGER NOT NULL DEFAULT 0');
migrar('sorteios', 'requisito_mensagens', 'INTEGER NOT NULL DEFAULT 0');
