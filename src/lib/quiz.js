import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CORES, embed } from './embeds.js';

export const PERGUNTAS = [
  {
    pergunta: 'Qual dessas linguagens é interpretada?',
    opcoes: ['C', 'Rust', 'Python', 'Go'],
    correta: 2,
  },
  {
    pergunta: 'O que significa "HTTP"?',
    opcoes: [
      'HyperText Transfer Protocol',
      'High Transfer Text Process',
      'Hyper Terminal Transfer Program',
      'Home Tool Transfer Protocol',
    ],
    correta: 0,
  },
  {
    pergunta: 'No JavaScript, qual valor é falsy?',
    opcoes: ['"0"', '[]', '0', '{}'],
    correta: 2,
  },
  {
    pergunta: 'Qual estrutura de dados usa o princípio LIFO?',
    opcoes: ['Fila', 'Pilha', 'Lista ligada', 'Árvore'],
    correta: 1,
  },
  {
    pergunta: 'Em Git, o que faz `git fetch`?',
    opcoes: [
      'Envia commits para o remoto',
      'Baixa commits do remoto sem alterar a branch local',
      'Cria uma nova branch',
      'Desfaz o último commit',
    ],
    correta: 1,
  },
  {
    pergunta: 'Qual é a capital do Japão?',
    opcoes: ['Osaka', 'Kyoto', 'Tóquio', 'Seul'],
    correta: 2,
  },
  {
    pergunta: 'Quanto é 2^10?',
    opcoes: ['512', '1024', '2048', '100'],
    correta: 1,
  },
  {
    pergunta: 'Qual desses NÃO é um banco de dados relacional?',
    opcoes: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'],
    correta: 2,
  },
  {
    pergunta: 'Em CSS, qual unidade é relativa ao tamanho da fonte do elemento raiz?',
    opcoes: ['em', 'rem', 'px', 'vh'],
    correta: 1,
  },
  {
    pergunta: 'Quem criou o sistema operacional Linux?',
    opcoes: ['Bill Gates', 'Linus Torvalds', 'Steve Jobs', 'Dennis Ritchie'],
    correta: 1,
  },
];

/** Quiz em andamento: messageId -> { correta, autorId, respondida } */
const ativos = new Map();

export function criarQuiz(canal, autorId) {
  const pergunta = PERGUNTAS[Math.floor(Math.random() * PERGUNTAS.length)];
  const painel = embed('🧠 Quiz', pergunta.pergunta, CORES.principal).setFooter({
    text: 'Clique em uma resposta',
  });

  return { pergunta, painel, autorId };
}

export function montarBotoesQuiz(messageId, opcoes) {
  return [
    new ActionRowBuilder().addComponents(
      opcoes.map((texto, indice) =>
        new ButtonBuilder()
          .setCustomId(`quiz:${messageId}:${indice}`)
          .setLabel(`${indice + 1}. ${texto}`.slice(0, 80))
          .setStyle(ButtonStyle.Secondary),
      ),
    ),
  ];
}

export function registrarQuiz(messageId, correta, autorId) {
  ativos.set(messageId, { correta, autorId, respondida: new Set() });
}

export function responderQuiz(messageId, userId, indice) {
  const quiz = ativos.get(messageId);
  if (!quiz) return { ok: false, motivo: 'Esse quiz expirou (o bot reiniciou).' };

  const acertou = indice === quiz.correta;
  quiz.respondida.add(userId);

  return { ok: true, acertou, correta: quiz.correta };
}

export function opcoesQuiz(messageId) {
  return ativos.get(messageId);
}
