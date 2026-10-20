import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db } from '../db.js';
import { barra, CORES, embed } from './embeds.js';

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

function votos(messageId) {
  const linhas = db
    .prepare('SELECT opcao, COUNT(*) AS total FROM enquete_votos WHERE message_id = ? GROUP BY opcao')
    .all(messageId);

  const mapa = new Map();
  for (const linha of linhas) mapa.set(Number(linha.opcao), Number(linha.total));
  return mapa;
}

export function embedEnquete(enquete) {
  const opcoes = JSON.parse(enquete.opcoes);
  const contagem = votos(enquete.message_id);
  const total = [...contagem.values()].reduce((soma, n) => soma + n, 0);

  const linhas = opcoes.map((texto, indice) => {
    const quantidade = contagem.get(indice) ?? 0;
    const porcento = total ? Math.round((quantidade / total) * 100) : 0;
    return `${EMOJIS[indice]} **${texto}**\n${barra(quantidade, total)} ${quantidade} voto(s) — ${porcento}%`;
  });

  return embed('📊 Enquete', [`**${enquete.pergunta}**`, '', ...linhas].join('\n'), CORES.principal)
    .setFooter({ text: `${total} voto(s) • ${opcoes.length} opcao(oes)` });
}

function botoes(messageId, quantidade) {
  const linhas = [];
  for (let i = 0; i < quantidade; i += 5) {
    const row = new ActionRowBuilder();
    for (let j = i; j < Math.min(i + 5, quantidade); j += 1) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`enquete:${messageId}:${j}`)
          .setLabel(String(j + 1))
          .setStyle(ButtonStyle.Secondary),
      );
    }
    linhas.push(row);
  }
  return linhas;
}

export async function criarEnquete(canal, { pergunta, opcoes, autorId }) {
  const mensagem = await canal.send({
    embeds: [embed('📊 Enquete', 'Preparando...', CORES.principal)],
  });

  db.prepare(`
    INSERT INTO enquetes (message_id, channel_id, guild_id, pergunta, opcoes, autor_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(mensagem.id, canal.id, canal.guild.id, pergunta, JSON.stringify(opcoes), autorId);

  const enquete = db.prepare('SELECT * FROM enquetes WHERE message_id = ?').get(mensagem.id);

  await mensagem.edit({
    embeds: [embedEnquete(enquete)],
    components: botoes(mensagem.id, opcoes.length),
  });

  return enquete;
}

/** Registra/troca o voto e atualiza a mensagem. */
export async function votar(client, messageId, userId, indice) {
  const enquete = db.prepare('SELECT * FROM enquetes WHERE message_id = ?').get(messageId);
  if (!enquete) return { ok: false, motivo: 'Enquete nao encontrada.' };

  const opcoes = JSON.parse(enquete.opcoes);
  if (indice < 0 || indice >= opcoes.length) {
    return { ok: false, motivo: 'Opcao invalida.' };
  }

  const anterior = db
    .prepare('SELECT opcao FROM enquete_votos WHERE message_id = ? AND user_id = ?')
    .get(messageId, userId);

  db.prepare(`
    INSERT INTO enquete_votos (message_id, user_id, opcao) VALUES (?, ?, ?)
    ON CONFLICT(message_id, user_id) DO UPDATE SET opcao = excluded.opcao
  `).run(messageId, userId, indice);

  const canal = await client.channels.fetch(enquete.channel_id).catch(() => null);
  if (canal?.isTextBased()) {
    const mensagem = await canal.messages.fetch(messageId).catch(() => null);
    if (mensagem) {
      await mensagem
        .edit({
          embeds: [embedEnquete(enquete)],
          components: botoes(messageId, opcoes.length),
        })
        .catch(() => {});
    }
  }

  return {
    ok: true,
    opcao: opcoes[indice],
    trocou: anterior ? Number(anterior.opcao) !== indice : false,
  };
}
