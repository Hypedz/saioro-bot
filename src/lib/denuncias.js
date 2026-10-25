import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { db } from '../db.js';
import { CORES, embed } from './embeds.js';

export const STATUS_DENUNCIA = {
  aberta: { rotulo: '🟡 Aberta', cor: CORES.aviso },
  analise: { rotulo: '🔵 Em análise', cor: CORES.destaque },
  resolvida: { rotulo: '🟢 Resolvida', cor: CORES.sucesso },
  arquivada: { rotulo: '⚪ Arquivada', cor: CORES.neutro },
};

export function modalDenuncia(alvoId, anonimo) {
  return new ModalBuilder()
    .setCustomId(`denuncia:novo:${alvoId}:${anonimo ? 1 : 0}`)
    .setTitle('Fazer uma denúncia')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('motivo')
          .setLabel('O que aconteceu?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(2000),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('provas')
          .setLabel('Links de provas (opcional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(500),
      ),
    );
}

export function obterDenuncia(id) {
  return db.prepare('SELECT * FROM denuncias WHERE id = ?').get(Number(id)) ?? null;
}

export function embedDenuncia(denuncia) {
  const status = STATUS_DENUNCIA[denuncia.status] ?? STATUS_DENUNCIA.aberta;

  const painel = embed(
    `🚨 Denúncia #${denuncia.id}`,
    `**O que aconteceu**\n${denuncia.texto.slice(0, 4000)}`,
    status.cor,
  ).addFields(
    {
      name: 'Denunciante',
      value: denuncia.anonimo ? 'Anônimo' : `<@${denuncia.autor_id}>`,
      inline: true,
    },
    { name: 'Alvo', value: `<@${denuncia.alvo_id}>`, inline: true },
    { name: 'Status', value: status.rotulo, inline: true },
    { name: 'Provas', value: (denuncia.provas || '_não informadas_').slice(0, 1024) },
  );

  const quando = new Date(denuncia.criado_em).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  painel.setFooter({ text: `#${denuncia.id} • registrada em ${quando}` });
  return painel;
}

export function botoesDenuncia(id) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`denuncia:analise:${id}`)
      .setLabel('Em análise')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`denuncia:resolvida:${id}`)
      .setLabel('Resolvida')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`denuncia:arquivada:${id}`)
      .setLabel('Arquivar')
      .setStyle(ButtonStyle.Danger),
  );
}

/** Registra a denúncia e publica no canal da staff. */
export async function criarDenuncia(canal, dados) {
  const inserir = db.prepare(`
    INSERT INTO denuncias (
      guild_id, autor_id, alvo_id, texto, provas, anonimo, status, channel_id, message_id, criado_em
    )
    VALUES (?, ?, ?, ?, ?, ?, 'aberta', ?, '', ?)
  `);

  const resultado = inserir.run(
    dados.guildId,
    dados.autorId,
    dados.alvoId,
    dados.texto,
    dados.provas || null,
    dados.anonimo ? 1 : 0,
    canal.id,
    Date.now(),
  );

  const id = Number(resultado.lastInsertRowid);
  const denuncia = obterDenuncia(id);

  let mensagem;

  try {
    mensagem = await canal.send({
      embeds: [embedDenuncia(denuncia)],
      components: [botoesDenuncia(id)],
    });
  } catch (erro) {
    db.prepare('DELETE FROM denuncias WHERE id = ?').run(id);
    throw erro;
  }

  db.prepare('UPDATE denuncias SET message_id = ? WHERE id = ?').run(mensagem.id, id);

  return { ...denuncia, message_id: mensagem.id };
}

export function atualizarStatusDenuncia(id, status, staffId) {
  db.prepare(`
    UPDATE denuncias
    SET status = ?, decidido_por = ?, decidido_em = ?
    WHERE id = ?
  `).run(status, staffId, Date.now(), Number(id));

  return obterDenuncia(id);
}
