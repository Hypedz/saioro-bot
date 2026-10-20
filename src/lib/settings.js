import { db } from '../db.js';

const cache = new Map();

/** Configuracoes do servidor (cacheadas em memoria). */
export function configuracoes(guildId) {
  if (cache.has(guildId)) return cache.get(guildId);

  const linha = db.prepare('SELECT * FROM configuracoes WHERE guild_id = ?').get(guildId);
  const cfg = {
    boasVindas: linha?.boas_vindas ?? null,
    despedida: linha?.despedida ?? null,
    logs: linha?.logs ?? null,
    cargoAuto: linha?.cargo_auto ?? null,
  };

  cache.set(guildId, cfg);
  return cfg;
}

/** Salva somente os campos informados. */
export function salvarConfiguracoes(guildId, mudancas) {
  const atual = { ...configuracoes(guildId), ...mudancas };

  db.prepare(`
    INSERT INTO configuracoes (guild_id, boas_vindas, despedida, logs, cargo_auto)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      boas_vindas = excluded.boas_vindas,
      despedida   = excluded.despedida,
      logs        = excluded.logs,
      cargo_auto  = excluded.cargo_auto
  `).run(guildId, atual.boasVindas, atual.despedida, atual.logs, atual.cargoAuto);

  cache.set(guildId, atual);
  return atual;
}
