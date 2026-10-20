const UNIDADES = {
  s: 1000,
  seg: 1000,
  segs: 1000,
  segundo: 1000,
  segundos: 1000,
  m: 60_000,
  min: 60_000,
  mins: 60_000,
  minuto: 60_000,
  minutos: 60_000,
  h: 3_600_000,
  hora: 3_600_000,
  horas: 3_600_000,
  d: 86_400_000,
  dia: 86_400_000,
  dias: 86_400_000,
};

const LIMITE = 30 * 86_400_000; // 30 dias

/**
 * Converte "10", "10m", "2h30m", "1d" em milissegundos.
 * Sem unidade, assume minutos. Retorna null se nao entender.
 */
export function parseDuracao(texto) {
  const bruto = String(texto ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (!bruto) return null;

  if (/^\d+$/.test(bruto)) {
    const minutos = Number(bruto) * 60_000;
    return minutos > 0 && minutos <= LIMITE ? minutos : null;
  }

  const partes = bruto.match(/(\d+)([a-zç]+)/g);
  if (!partes) return null;

  let total = 0;
  for (const parte of partes) {
    const [, numero, unidade] = /^(\d+)([a-zç]+)$/.exec(parte) ?? [];
    if (!numero || !UNIDADES[unidade]) return null;
    total += Number(numero) * UNIDADES[unidade];
  }

  return total > 0 && total <= LIMITE ? total : null;
}

/** 5400000 -> "1h 30min" */
export function formatarDuracao(ms) {
  if (!ms || ms < 1000) return '0s';
  const dias = Math.floor(ms / 86_400_000);
  const horas = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutos = Math.floor((ms % 3_600_000) / 60_000);
  const segundos = Math.floor((ms % 60_000) / 1000);

  const partes = [];
  if (dias) partes.push(`${dias}d`);
  if (horas) partes.push(`${horas}h`);
  if (minutos) partes.push(`${minutos}min`);
  if (segundos && !dias && !horas) partes.push(`${segundos}s`);
  return partes.join(' ') || '0s';
}

/** Texto para o campo "termina em" das mensagens. */
export function quandoTermina(msRestantes) {
  return `<t:${Math.floor((Date.now() + msRestantes) / 1000)}:R>`;
}
