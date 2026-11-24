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

/* Demonstração do painel inicial: cada botão mostra o comando para configurar aquela função. */
(function () {
  const cartao = document.querySelector('.previa');
  if (!cartao) return;

  const botoes = Array.from(cartao.querySelectorAll('[data-painel]'));
  const caixa = cartao.querySelector('#resposta-painel');
  if (!botoes.length || !caixa) return;

  const CONTEUDO = {
    regras: {
      titulo: 'Regras — configure primeiro',
      itens: [
        { cmd: '/regras regras:"1. Respeite todos. 2. Sem spam."', desc: 'Publica as regras com botão de verificação' },
        { cmd: '/regras regras:"..." cargo:@Verificado canal:#regras', desc: 'Com cargo de verificação e canal específico' },
      ],
    },
    cargos: {
      titulo: 'Cargos — configure o painel de auto-cargos',
      itens: [
        { cmd: '/cargos-painel adicionar cargo:@Gamer emoji:🎮', desc: 'Adiciona um cargo ao painel' },
        { cmd: '/cargos-painel publicar canal:#cargos', desc: 'Publica o painel para membros escolherem' },
      ],
    },
    faq: {
      titulo: 'FAQ — cadastre as perguntas',
      itens: [
        { cmd: '/faq adicionar pergunta:"Como pego cargo?" resposta:"Use o painel de cargos." categoria:Geral', desc: 'Adiciona uma pergunta (apenas staff)' },
        { cmd: '/faq ver', desc: 'Abre o menu de perguntas para membros' },
      ],
    },
    denunciar: {
      titulo: 'Denunciar — configure o canal de recebimento',
      itens: [
        { cmd: '/config denuncias canal:#denuncias', desc: 'Define onde as denúncias chegam para a staff' },
        { cmd: '/denunciar alvo:@membro anonimo:true', desc: 'Como o membro usa (já funciona após configurar)' },
      ],
    },
    candidatura: {
      titulo: 'Candidatar-se — configure o canal e cargo da staff',
      itens: [
        { cmd: '/candidatura configurar canal:#staff cargo:@Staff', desc: 'Define onde chegam as candidaturas e qual cargo entregar' },
        { cmd: '/candidatura painel canal:#entrada', desc: 'Publica o botão para membros se candidatarem' },
      ],
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
      linha.innerHTML = `<code>${item.cmd}</code> — ${item.desc}`;
      lista.append(linha);
    }

    const fecharBotao = document.createElement('button');
    fecharBotao.type = 'button';
    fecharBotao.className = 'fechar';
    fecharBotao.setAttribute('aria-label', 'Fechar');
    fecharBotao.textContent = '×';
    fecharBotao.addEventListener('click', fechar);

    const copiarBotao = document.createElement('button');
    copiarBotao.type = 'button';
    copiarBotao.className = 'copiar';
    copiarBotao.setAttribute('aria-label', 'Copiar comandos');
    copiarBotao.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    copiarBotao.addEventListener('click', () => {
      const codigos = [...caixa.querySelectorAll('li code')].map((c) => c.textContent).join('\n');
      navigator.clipboard.writeText(codigos).then(() => {
        const original = copiarBotao.innerHTML;
        copiarBotao.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        copiarBotao.setAttribute('aria-label', 'Copiado!');
        setTimeout(() => {
          copiarBotao.innerHTML = original;
          copiarBotao.setAttribute('aria-label', 'Copiar comandos');
        }, 1500);
      });
    });

    caixa.replaceChildren(titulo, lista, copiarBotao, fecharBotao);
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

/* Navegação: apenas a aba "Equipe" alterna visibilidade; as demais rolam suavemente. */
(function () {
  const navPrincipal = document.getElementById('navegacao-principal');
  const navRodape = document.getElementById('navegacao-rodape');
  if (!navPrincipal && !navRodape) return;

  const todasAbas = [...(navPrincipal?.querySelectorAll('[data-section]') || []), ...(navRodape?.querySelectorAll('[data-section]') || [])];
  const secoes = new Map();
  for (const aba of todasAbas) {
    const id = aba.dataset.section;
    const secao = document.getElementById(id);
    if (secao) secoes.set(id, secao);
  }

  // Esconde apenas a seção "equipe" no carregamento
  const equipeSecao = secoes.get('equipe');
  if (equipeSecao) equipeSecao.hidden = true;

  function toggleEquipe() {
    if (!equipeSecao) return;
    const vaiMostrar = equipeSecao.hidden;
    equipeSecao.hidden = !vaiMostrar;
    
    // Atualiza aria-current nas abas
    for (const aba of todasAbas) {
      const isEquipe = aba.dataset.section === 'equipe';
      aba.setAttribute('aria-current', isEquipe && vaiMostrar ? 'page' : 'false');
    }

    if (vaiMostrar) {
      history.replaceState(null, '', '#equipe');
      requestAnimationFrame(() => equipeSecao.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } else {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  for (const aba of todasAbas) {
    aba.addEventListener('click', (e) => {
      const id = aba.dataset.section;
      if (id === 'equipe') {
        e.preventDefault();
        toggleEquipe();
      } else if (secoes.has(id)) {
        // Demais seções: scroll suave normal
        e.preventDefault();
        const secao = secoes.get(id);
        if (secao) secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${id}`);
      }
    });
  }

  // Suporte a hash na URL ao carregar
  const hash = window.location.hash.slice(1);
  if (hash === 'equipe' && equipeSecao) {
    equipeSecao.hidden = false;
    for (const aba of todasAbas) {
      aba.setAttribute('aria-current', aba.dataset.section === 'equipe' ? 'page' : 'false');
    }
    requestAnimationFrame(() => equipeSecao.scrollIntoView({ behavior: 'auto', block: 'start' }));
  }
})();
