const DIA = 86_400_000;

/**
 * Emblemas automáticos: ninguém concede na mão, todos saem dos dados que o bot já tem.
 * Cada um traz a própria forma de progresso para a lista do /perfil emblemas.
 */
export const EMBLEMAS = [
  {
    id: 'fundador',
    emoji: '🏛️',
    nome: 'Fundador',
    descricao: 'Dono do bot',
    conquistado: ({ membro, donoId }) => Boolean(donoId) && membro.id === donoId,
    progresso: () => 'exclusivo do dono do bot',
  },
  {
    id: 'veterano',
    emoji: '🕰️',
    nome: 'Veterano',
    descricao: 'Um ano de servidor',
    conquistado: ({ membro, agora }) => agora - membro.joinedTimestamp >= 365 * DIA,
    progresso: ({ membro, agora }) =>
      `${Math.min(365, Math.floor((agora - membro.joinedTimestamp) / DIA))}/365 dias`,
  },
  {
    id: 'sugestor',
    emoji: '💡',
    nome: 'Sugestor',
    descricao: '10 sugestões enviadas',
    conquistado: ({ contagens }) => contagens.sugestoes >= 10,
    progresso: ({ contagens }) => `${Math.min(10, contagens.sugestoes)}/10 sugestões`,
  },
  {
    id: 'aprovada',
    emoji: '🌟',
    nome: 'Ideia aprovada',
    descricao: '3 sugestões aprovadas',
    conquistado: ({ contagens }) => contagens.aprovadas >= 3,
    progresso: ({ contagens }) => `${Math.min(3, contagens.aprovadas)}/3 aprovadas`,
  },
  {
    id: 'participante',
    emoji: '🎟️',
    nome: 'Participante',
    descricao: '5 sorteios participados',
    conquistado: ({ contagens }) => contagens.sorteios >= 5,
    progresso: ({ contagens }) => `${Math.min(5, contagens.sorteios)}/5 sorteios`,
  },
];

/** Lista completa, com conquistados e progresso. */
export function calcularEmblemas(membro, contagens, { donoId = null, agora = Date.now() } = {}) {
  const contexto = { membro, contagens, donoId, agora };

  return EMBLEMAS.map((emblema) => ({
    id: emblema.id,
    emoji: emblema.emoji,
    nome: emblema.nome,
    descricao: emblema.descricao,
    conquistado: Boolean(emblema.conquistado(contexto)),
    progresso: emblema.progresso(contexto),
  }));
}

export function emblemasConquistados(membro, contagens, opcoes = {}) {
  return calcularEmblemas(membro, contagens, opcoes).filter((emblema) => emblema.conquistado);
}
