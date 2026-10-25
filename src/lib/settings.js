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
    sugestoes: linha?.sugestoes ?? null,
    verificarCargo: linha?.verificar_cargo ?? null,
    boasVindasTexto: linha?.boas_vindas_texto ?? null,
    boasVindasDm: linha?.boas_vindas_dm ?? null,
    boasVindasImagem: linha?.boas_vindas_imagem ?? null,
    denuncias: linha?.denuncias ?? null,
    candidaturas: linha?.candidaturas ?? null,
    candidaturaCargo: linha?.candidatura_cargo ?? null,
  };

  cache.set(guildId, cfg);
  return cfg;
}

/** Salva somente os campos informados. */
export function salvarConfiguracoes(guildId, mudancas) {
  const atual = { ...configuracoes(guildId), ...mudancas };

  db.prepare(`
    INSERT INTO configuracoes (
      guild_id, boas_vindas, despedida, logs, cargo_auto, sugestoes, verificar_cargo,
      boas_vindas_texto, boas_vindas_dm, boas_vindas_imagem,
      denuncias, candidaturas, candidatura_cargo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      boas_vindas         = excluded.boas_vindas,
      despedida           = excluded.despedida,
      logs                = excluded.logs,
      cargo_auto          = excluded.cargo_auto,
      sugestoes           = excluded.sugestoes,
      verificar_cargo     = excluded.verificar_cargo,
      boas_vindas_texto   = excluded.boas_vindas_texto,
      boas_vindas_dm      = excluded.boas_vindas_dm,
      boas_vindas_imagem  = excluded.boas_vindas_imagem,
      denuncias           = excluded.denuncias,
      candidaturas        = excluded.candidaturas,
      candidatura_cargo   = excluded.candidatura_cargo
  `).run(
    guildId,
    atual.boasVindas,
    atual.despedida,
    atual.logs,
    atual.cargoAuto,
    atual.sugestoes,
    atual.verificarCargo,
    atual.boasVindasTexto,
    atual.boasVindasDm,
    atual.boasVindasImagem,
    atual.denuncias,
    atual.candidaturas,
    atual.candidaturaCargo,
  );

  cache.set(guildId, atual);
  return atual;
}

/** Troca as variaveis {membro}, {nome}, {servidor} e {total} no texto. */
export function formatarBoasVindas(texto, membro) {
  return texto
    .replaceAll('{membro}', `<@${membro.id}>`)
    .replaceAll('{nome}', membro.user.username)
    .replaceAll('{servidor}', membro.guild.name)
    .replaceAll('{total}', String(membro.guild.memberCount));
}
