/** Busca um GIF de acao (hug/kiss) com timeout curto. Retorna null se falhar. */
export async function buscarGif(tipo) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), 4000);

  try {
    const resposta = await fetch(`https://api.waifu.pics/sfw/${tipo}`, { signal: controle.signal });
    if (!resposta.ok) return null;

    const dados = await resposta.json();
    return typeof dados?.url === 'string' ? dados.url : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
