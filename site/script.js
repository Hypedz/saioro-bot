(function () {
  const campo = document.getElementById('buscar');
  const botoes = Array.from(document.querySelectorAll('.filtro'));
  const grupos = Array.from(document.querySelectorAll('.grupo-comandos'));
  const itens = Array.from(document.querySelectorAll('.comando'));
  const resultado = document.getElementById('resultado');
  const vazio = document.getElementById('sem-resultado');

  if (!campo || !resultado || !vazio) return;

  let filtro = 'todos';

  const normalizar = (texto) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  function aplicar() {
    const termos = normalizar(campo.value).split(/\s+/).filter(Boolean);
    let visiveis = 0;

    for (const item of itens) {
      const combinaCategoria = filtro === 'todos' || item.dataset.categoria === filtro;
      const combinaBusca =
        termos.length === 0 || termos.every((termo) => item.dataset.busca.includes(termo));
      const mostrar = combinaCategoria && combinaBusca;

      item.hidden = !mostrar;
      if (mostrar) visiveis += 1;
    }

    for (const grupo of grupos) {
      grupo.hidden = !grupo.querySelector('.comando:not([hidden])');
    }

    vazio.hidden = visiveis !== 0;
    resultado.textContent = visiveis === 1 ? '1 comando' : visiveis + ' comandos';
  }

  for (const botao of botoes) {
    botao.addEventListener('click', () => {
      filtro = botao.dataset.filtro;
      for (const outro of botoes) {
        outro.setAttribute('aria-pressed', String(outro === botao));
      }
      aplicar();
    });
  }

  campo.addEventListener('input', aplicar);
  campo.addEventListener('search', aplicar);

  document.addEventListener('keydown', (evento) => {
    if (evento.key !== '/' || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    const alvo = document.activeElement;
    if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)) {
      return;
    }
    evento.preventDefault();
    campo.focus();
  });

  aplicar();
})();
