import { EmbedBuilder } from 'discord.js';

export const CORES = {
  principal: 0x5865f2,
  sucesso: 0x2ecc71,
  erro: 0xe74c3c,
  aviso: 0xf1c40f,
  neutro: 0x95a5a6,
  destaque: 0xe0713e,
};

export function embed(titulo, descricao, cor = CORES.principal) {
  const e = new EmbedBuilder().setColor(cor);
  if (titulo) e.setTitle(titulo);
  if (descricao) e.setDescription(descricao);
  return e;
}

export function embedErro(texto) {
  return embed('Deu ruim', texto, CORES.erro);
}

export function embedSucesso(texto) {
  return embed('Feito', texto, CORES.sucesso);
}

/** Formata um Date/timestamp como data completa + "ha X". */
export function dataCurta(valor) {
  const data = valor instanceof Date ? valor : new Date(valor);
  const segundos = Math.floor(data.getTime() / 1000);
  return `<t:${segundos}:f> (<t:${segundos}:R>)`;
}

/** Barra de progresso em texto, usada nas enquetes. */
export function barra(parte, total, tamanho = 12) {
  if (!total) return '░'.repeat(tamanho);
  const cheio = Math.max(0, Math.min(tamanho, Math.round((parte / total) * tamanho)));
  return '█'.repeat(cheio) + '░'.repeat(tamanho - cheio);
}

/** "#5865f2", "5865f2" ou "#F2A" -> numero. Retorna o padrao se nao entender. */
export function parseCor(texto, padrao = CORES.principal) {
  const bruto = String(texto ?? '').trim().replace(/^#/, '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bruto)) return padrao;

  const completo =
    bruto.length === 3
      ? bruto
          .split('')
          .map((c) => c + c)
          .join('')
      : bruto;

  return Number.parseInt(completo, 16);
}
