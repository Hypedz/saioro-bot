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

/* Demonstração do painel inicial: cada botão mostra a resposta que o bot daria. */
(function () {
  const cartao = document.querySelector('.previa');
  if (!cartao) return;

  const botoes = Array.from(cartao.querySelectorAll('[data-painel]'));
  const caixa = cartao.querySelector('#resposta-painel');
  if (!botoes.length || !caixa) return;

  const CONTEUDO = {
    regras: {
      titulo: 'Regras do servidor',
      itens: [
        'Respeite todos os membros.',
        'Sem spam, flood ou divulgação.',
        'Conteúdo impróprio é proibido.',
      ],
    },
    cargos: {
      titulo: 'Cargos disponíveis',
      itens: ['Notificações', 'Eventos', 'Memes'],
    },
    faq: {
      titulo: 'Perguntas frequentes',
      itens: [
        'Como pego meus cargos? Use o painel de cargos.',
        'Como denuncio alguém? Use o botão Denunciar.',
        'Como entro na staff? Use o botão Candidatar-se.',
      ],
    },
    denunciar: {
      titulo: 'Denúncia privada',
      itens: [
        'Você informa o alvo, o motivo e links de prova.',
        'Pode escolher denunciar anonimamente.',
        'Só a staff vê o conteúdo.',
      ],
    },
    candidatura: {
      titulo: 'Candidatura à staff',
      itens: ['Nome e idade', 'Motivação', 'Disponibilidade', 'Experiência anterior'],
    },
  };

  let aberto = null;

  function fechar() {
    aberto = null;
    caixa.hidden = true;
    caixa.replaceChildren();
    for (const botao of botoes) botao.setAttribute('aria-expanded', 'false');
  }

  function abrir(chave) {
    const dados = CONTEUDO[chave];
    if (!dados) return;

    if (aberto === chave) {
      fechar();
      return;
    }

    aberto = chave;

    const titulo = document.createElement('h4');
    titulo.textContent = dados.titulo;

    const lista = document.createElement('ul');
    for (const item of dados.itens) {
      const linha = document.createElement('li');
      linha.textContent = item;
      lista.append(linha);
    }

    const fecharBotao = document.createElement('button');
    fecharBotao.type = 'button';
    fecharBotao.className = 'fechar';
    fecharBotao.setAttribute('aria-label', 'Fechar resposta');
    fecharBotao.textContent = '×';
    fecharBotao.addEventListener('click', fechar);

    caixa.replaceChildren(titulo, lista, fecharBotao);
    caixa.hidden = false;

    for (const botao of botoes) {
      botao.setAttribute('aria-expanded', String(botao.dataset.painel === chave));
    }
  }

  for (const botao of botoes) {
    botao.addEventListener('click', () => abrir(botao.dataset.painel));
  }

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && aberto) fechar();
  });
})();
