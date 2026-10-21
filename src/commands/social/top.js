import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { db } from '../../db.js';
import { CORES, embed } from '../../lib/embeds.js';
import { contagens } from '../../lib/perfis.js';
import { emblemasConquistados } from '../../lib/emblemas.js';

const MEDALHAS = ['🥇', '🥈', '🥉'];

function rankingSugestoes(guildId, limite) {
  return db
    .prepare(`
      SELECT autor_id AS user_id,
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'aprovada' THEN 1 ELSE 0 END) AS aprovadas
        FROM sugestoes
       WHERE guild_id = ?
       GROUP BY autor_id
       ORDER BY total DESC, aprovadas DESC, autor_id
       LIMIT ?
    `)
    .all(guildId, limite)
    .map((linha) => ({
      user_id: linha.user_id,
      total: Number(linha.total),
      aprovadas: Number(linha.aprovadas),
    }));
}

function rankingSorteios(guildId, limite) {
  return db
    .prepare(`
      SELECT p.user_id AS user_id, COUNT(*) AS total
        FROM sorteio_participantes p
        JOIN sorteios s ON s.message_id = p.message_id
       WHERE s.guild_id = ?
       GROUP BY p.user_id
       ORDER BY total DESC, p.user_id
       LIMIT ?
    `)
    .all(guildId, limite)
    .map((linha) => ({ user_id: linha.user_id, total: Number(linha.total) }));
}

function rankingGeral(guildId, limite) {
  const mapa = new Map();

  for (const linha of rankingSugestoes(guildId, 1000)) {
    mapa.set(linha.user_id, {
      sugestoes: linha.total,
      aprovadas: linha.aprovadas,
      sorteios: 0,
    });
  }

  for (const linha of rankingSorteios(guildId, 1000)) {
    const atual = mapa.get(linha.user_id) ?? { sugestoes: 0, aprovadas: 0, sorteios: 0 };
    atual.sorteios = linha.total;
    mapa.set(linha.user_id, atual);
  }

  return [...mapa.entries()]
    .map(([userId, dados]) => ({
      user_id: userId,
      ...dados,
      total: dados.sugestoes + dados.sorteios,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        b.sugestoes - a.sugestoes ||
        a.user_id.localeCompare(b.user_id),
    )
    .slice(0, limite);
}

async function resolverMembros(guild, ids) {
  const membros = await Promise.all(
    ids.map(
      (id) =>
        guild.members.cache.get(id) ??
        guild.members.fetch(id).catch(() => null),
    ),
  );

  return membros.filter((membro) => membro && !membro.user.bot);
}

function contar(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function detalheDe(categoria, dados) {
  if (categoria === 'sugestoes') {
    const aprovadas = dados.aprovadas
      ? ` (${contar(dados.aprovadas, 'aprovada', 'aprovadas')})`
      : '';
    return `**${dados.sugestoes}** ${dados.sugestoes === 1 ? 'sugestão' : 'sugestões'}${aprovadas}`;
  }

  if (categoria === 'sorteios') {
    return `**${dados.sorteios}** ${dados.sorteios === 1 ? 'sorteio' : 'sorteios'}`;
  }

  return `**${dados.total}** pts · ${contar(dados.sugestoes, 'sugestão', 'sugestões')} · ${contar(dados.sorteios, 'sorteio', 'sorteios')}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Ranking de participação do servidor.')
    .addStringOption((o) =>
      o
        .setName('categoria')
        .setDescription('Qual ranking ver')
        .addChoices(
          { name: 'Geral (sugestões + sorteios)', value: 'geral' },
          { name: 'Sugestões', value: 'sugestoes' },
          { name: 'Sorteios', value: 'sorteios' },
        ),
    )
    .addIntegerOption((o) =>
      o
        .setName('limite')
        .setDescription('Quantas posições mostrar (3 a 15)')
        .setMinValue(3)
        .setMaxValue(15),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const categoria = interaction.options.getString('categoria') ?? 'geral';
    const limite = interaction.options.getInteger('limite') ?? 10;
    const { guild } = interaction;

    let linhas;

    if (categoria === 'sugestoes') {
      linhas = rankingSugestoes(guild.id, limite * 2).map((linha) => ({
        user_id: linha.user_id,
        sugestoes: linha.total,
        aprovadas: linha.aprovadas,
        sorteios: 0,
      }));
    } else if (categoria === 'sorteios') {
      linhas = rankingSorteios(guild.id, limite * 2).map((linha) => ({
        user_id: linha.user_id,
        sugestoes: 0,
        aprovadas: 0,
        sorteios: linha.total,
      }));
    } else {
      linhas = rankingGeral(guild.id, limite * 2);
    }

    const membros = await resolverMembros(
      guild,
      linhas.map((linha) => linha.user_id),
    );

    const porId = new Map(membros.map((membro) => [membro.id, membro]));
    const entradas = linhas
      .filter((linha) => porId.has(linha.user_id))
      .slice(0, limite)
      .map((linha) => {
        const membro = porId.get(linha.user_id);
        const dados = contagens(guild.id, membro.id);
        const emblemas = emblemasConquistados(membro, dados, {
          donoId: interaction.client.donoId,
        }).length;

        return {
          membro,
          dados,
          emblemas,
        };
      });

    const titulos = {
      geral: 'Geral',
      sugestoes: 'Sugestões',
      sorteios: 'Sorteios',
    };

    if (entradas.length === 0) {
      return interaction.reply({
        embeds: [
          embed(
            `🏆 Top — ${titulos[categoria]}`,
            'Ainda não há dados para este ranking.',
            CORES.principal,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const descricao = entradas
      .map((entrada, indice) => {
        const posicao = MEDALHAS[indice] ?? `**${indice + 1}.**`;
        const selo = entrada.emblemas ? ` · 🎖️ ${entrada.emblemas}` : '';
        return `${posicao} <@${entrada.membro.id}> — ${detalheDe(categoria, {
          ...entrada.dados,
          total: entrada.dados.sugestoes + entrada.dados.sorteios,
        })}${selo}`;
      })
      .join('\n');

    const painel = embed(`🏆 Top — ${titulos[categoria]}`, descricao, CORES.principal).setFooter({
      text:
        categoria === 'geral'
          ? 'Geral soma sugestões e sorteios (1 ponto cada)'
          : 'Ranking de participação do servidor',
    });

    return interaction.reply({
      embeds: [painel],
      allowedMentions: { parse: [] },
    });
  },
};
