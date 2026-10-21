import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { db } from '../db.js';
import { CORES, parseCor } from './embeds.js';

/** Campos que a pessoa pode esconder do cartão. */
export const CAMPOS = [
  {
    valor: 'entrada',
    coluna: 'mostrar_entrada',
    label: 'Entrada no servidor',
    descricao: 'Desde quando você entrou e há quanto tempo',
  },
  {
    valor: 'cargos',
    coluna: 'mostrar_cargos',
    label: 'Cargos',
    descricao: 'Seus três cargos mais altos',
  },
  {
    valor: 'pronomes',
    coluna: 'mostrar_pronomes',
    label: 'Pronomes',
    descricao: 'Só aparece se você preencher',
  },
  {
    valor: 'sugestoes',
    coluna: 'mostrar_sugestoes',
    label: 'Sugestões enviadas',
    descricao: 'Quantas sugestões você enviou',
  },
  {
    valor: 'sorteios',
    coluna: 'mostrar_sorteios',
    label: 'Sorteios participados',
    descricao: 'Em quantos sorteios você entrou',
  },
];

function padrao(guildId, userId) {
  return {
    guild_id: guildId,
    user_id: userId,
    titulo: null,
    bio: null,
    pronomes: null,
    cor: null,
    imagem: null,
    mostrar_entrada: 1,
    mostrar_cargos: 1,
    mostrar_pronomes: 1,
    mostrar_sugestoes: 1,
    mostrar_sorteios: 1,
    atualizado_em: null,
  };
}

export function obterPerfil(guildId, userId) {
  return (
    db.prepare('SELECT * FROM perfis WHERE guild_id = ? AND user_id = ?').get(guildId, userId) ??
    padrao(guildId, userId)
  );
}

export function salvarPerfil({ guildId, userId, titulo, bio, pronomes, cor, imagem }) {
  db.prepare(`
    INSERT INTO perfis (guild_id, user_id, titulo, bio, pronomes, cor, imagem, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      titulo        = excluded.titulo,
      bio           = excluded.bio,
      pronomes      = excluded.pronomes,
      cor           = excluded.cor,
      imagem        = excluded.imagem,
      atualizado_em = excluded.atualizado_em
  `).run(guildId, userId, titulo, bio, pronomes, cor, imagem, Date.now());
}

/** values = lista de campos marcados; o que não estiver nela fica oculto. */
export function salvarCampos(guildId, userId, valores) {
  const marcados = new Set(valores);
  const colunas = CAMPOS.map((campo) => (marcados.has(campo.valor) ? 1 : 0));

  db.prepare(`
    INSERT INTO perfis (
      guild_id, user_id,
      mostrar_entrada, mostrar_cargos, mostrar_pronomes, mostrar_sugestoes, mostrar_sorteios,
      atualizado_em
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      mostrar_entrada   = excluded.mostrar_entrada,
      mostrar_cargos    = excluded.mostrar_cargos,
      mostrar_pronomes  = excluded.mostrar_pronomes,
      mostrar_sugestoes = excluded.mostrar_sugestoes,
      mostrar_sorteios  = excluded.mostrar_sorteios,
      atualizado_em     = excluded.atualizado_em
  `).run(guildId, userId, ...colunas, Date.now());
}

export function removerPerfil(guildId, userId) {
  return db.prepare('DELETE FROM perfis WHERE guild_id = ? AND user_id = ?').run(guildId, userId)
    .changes;
}

export function contagens(guildId, userId) {
  const sugestoes = Number(
    db
      .prepare('SELECT COUNT(*) AS total FROM sugestoes WHERE guild_id = ? AND autor_id = ?')
      .get(guildId, userId)?.total ?? 0,
  );

  const sorteios = Number(
    db
      .prepare(`
        SELECT COUNT(*) AS total
          FROM sorteio_participantes p
          JOIN sorteios s ON s.message_id = p.message_id
         WHERE s.guild_id = ? AND p.user_id = ?
      `)
      .get(guildId, userId)?.total ?? 0,
  );

  return { sugestoes, sorteios };
}

/** Cartão público do membro, já com os campos que ele escolheu mostrar. */
export function montarPerfil(membro, perfil) {
  const nome = perfil.titulo?.trim() || membro.displayName;

  const painel = new EmbedBuilder()
    .setColor(parseCor(perfil.cor, CORES.principal))
    .setAuthor({
      name: `@${membro.user.username}`,
      iconURL: membro.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle(nome.slice(0, 256))
    .setDescription((perfil.bio?.trim() || '_Sem bio ainda._').slice(0, 4000))
    .setFooter({ text: 'Perfil personalizável • use /perfil editar' });

  if (perfil.imagem) painel.setImage(perfil.imagem);

  const campos = [];

  if (perfil.mostrar_pronomes && perfil.pronomes) {
    campos.push({ name: 'Pronomes', value: perfil.pronomes.slice(0, 100), inline: true });
  }

  if (perfil.mostrar_entrada && membro.joinedTimestamp) {
    const segundos = Math.floor(membro.joinedTimestamp / 1000);
    campos.push({
      name: 'No servidor desde',
      value: `<t:${segundos}:D> (<t:${segundos}:R>)`,
      inline: true,
    });
  }

  if (perfil.mostrar_cargos) {
    const cargos = [...membro.roles.cache.values()]
      .filter((cargo) => cargo.id !== membro.guild.id)
      .sort((a, b) => b.position - a.position);

    const mostrados = cargos.slice(0, 3).map((cargo) => cargo.toString());
    if (cargos.length > 3) mostrados.push(`+${cargos.length - 3}`);

    campos.push({ name: 'Cargos', value: mostrados.join(' ') || 'Nenhum', inline: true });
  }

  if (perfil.mostrar_sugestoes || perfil.mostrar_sorteios) {
    const { sugestoes, sorteios } = contagens(membro.guild.id, membro.id);

    if (perfil.mostrar_sugestoes) {
      campos.push({ name: 'Sugestões enviadas', value: String(sugestoes), inline: true });
    }
    if (perfil.mostrar_sorteios) {
      campos.push({ name: 'Sorteios participados', value: String(sorteios), inline: true });
    }
  }

  if (campos.length) painel.addFields(campos);
  if (perfil.atualizado_em) painel.setTimestamp(perfil.atualizado_em);

  return painel;
}

/** Botões de edição aparecem só para o dono do cartão. */
export function botoesPerfil(userId, viewerId) {
  if (userId !== viewerId) return [];

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`perfil:editar:${userId}`)
        .setLabel('Editar')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`perfil:campos:${userId}`)
        .setLabel('Campos')
        .setEmoji('🎛️')
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function entrada(id, label, descricao, valor, maxLength, estilo = TextInputStyle.Short) {
  const input = new TextInputBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setPlaceholder(descricao)
    .setStyle(estilo)
    .setRequired(false)
    .setMaxLength(maxLength);

  if (valor) input.setValue(String(valor).slice(0, maxLength));

  return new ActionRowBuilder().addComponents(input);
}

export function modalPerfil(perfil, userId) {
  return new ModalBuilder()
    .setCustomId(`perfil:salvar:${userId}`)
    .setTitle('Editar perfil')
    .addComponents(
      entrada('titulo', 'Título', 'Como seu nome aparece no cartão', perfil.titulo, 60),
      entrada('pronomes', 'Pronomes', 'Ex.: ele/dele', perfil.pronomes, 30),
      entrada(
        'bio',
        'Bio',
        'Uma descrição curta sobre você',
        perfil.bio,
        300,
        TextInputStyle.Paragraph,
      ),
      entrada('cor', 'Cor', 'Hex, ex.: #5865F2', perfil.cor, 7),
      entrada('imagem', 'Imagem de fundo', 'URL https:// de uma imagem', perfil.imagem, 512),
    );
}

export function selecaoCampos(perfil, userId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`perfil:campos:${userId}`)
    .setPlaceholder('Campos visíveis no cartão')
    .setMinValues(0)
    .setMaxValues(CAMPOS.length)
    .addOptions(
      CAMPOS.map((campo) => ({
        label: campo.label,
        description: campo.descricao,
        value: campo.valor,
        default: Boolean(perfil[campo.coluna]),
      })),
    );

  return new ActionRowBuilder().addComponents(menu);
}

const erro = (interaction, texto) =>
  interaction.reply({ content: texto, flags: MessageFlags.Ephemeral });

/** Recebe o formulário "perfil:salvar:<userId>". */
export async function tratarModalPerfil(interaction) {
  if (!interaction.guild) return erro(interaction, 'Esse perfil só funciona em servidores.');

  const alvoId = interaction.customId.split(':')[2];

  if (interaction.user.id !== alvoId) {
    return erro(interaction, 'Só a própria pessoa pode editar este perfil.');
  }

  const valor = (nome) => interaction.fields.getTextInputValue(nome)?.trim() ?? '';

  const titulo = valor('titulo').replace(/\s+/g, ' ') || null;
  const bio = valor('bio') || null;
  const pronomes = valor('pronomes') || null;
  const corBruta = valor('cor');
  const imagem = valor('imagem');

  if (corBruta && !/^#?[0-9a-f]{6}$/i.test(corBruta)) {
    return erro(interaction, 'Cor inválida. Use hexadecimal com 6 dígitos, tipo `#5865F2`.');
  }

  if (imagem && !/^https:\/\/\S+$/i.test(imagem)) {
    return erro(interaction, 'A imagem precisa ser uma URL `https://` válida.');
  }

  salvarPerfil({
    guildId: interaction.guild.id,
    userId: alvoId,
    titulo,
    bio,
    pronomes,
    cor: corBruta ? `#${corBruta.replace(/^#/, '').toLowerCase()}` : null,
    imagem: imagem || null,
  });

  const perfil = obterPerfil(interaction.guild.id, alvoId);

  return interaction.reply({
    content: '✅ Perfil atualizado. Use `/perfil ver` para mostrar aos outros.',
    embeds: [montarPerfil(interaction.member, perfil)],
    components: botoesPerfil(alvoId, interaction.user.id),
    flags: MessageFlags.Ephemeral,
  });
}
