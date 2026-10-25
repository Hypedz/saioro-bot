import { EmbedBuilder, MessageFlags } from 'discord.js';
import { CORES, parseCor } from './embeds.js';
import { tratarModalPerfil } from './perfis.js';
import { configuracoes } from './settings.js';
import { criarDenuncia } from './denuncias.js';
import {
  criarCandidatura,
  temCandidaturaPendente,
} from './candidaturas.js';

const erro = (interaction, texto) =>
  interaction.reply({ content: texto, flags: MessageFlags.Ephemeral });

async function tratarModalDenuncia(interaction) {
  if (!interaction.guild) {
    return erro(interaction, 'Esse formulário só funciona em servidores.');
  }

  const [, , alvoId, anon] = interaction.customId.split(':');
  const canalId = configuracoes(interaction.guild.id).denuncias;
  const canal = canalId
    ? interaction.guild.channels.cache.get(canalId) ??
      (await interaction.guild.channels.fetch(canalId).catch(() => null))
    : null;

  if (!canal?.isTextBased() || typeof canal.send !== 'function') {
    return erro(interaction, 'O canal de denúncias não está configurado. Avise a staff.');
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const denuncia = await criarDenuncia(canal, {
      guildId: interaction.guild.id,
      autorId: interaction.user.id,
      alvoId,
      texto: interaction.fields.getTextInputValue('motivo').trim(),
      provas: interaction.fields.getTextInputValue('provas')?.trim() || null,
      anonimo: anon === '1',
    });

    return interaction.editReply({
      content: `✅ Denúncia #${denuncia.id} enviada. A staff foi avisada.`,
    });
  } catch (erro) {
    console.error('[ERRO] Falha ao registrar denúncia:', erro);
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(CORES.erro).setDescription('Não consegui enviar a denúncia. Avise a staff.')],
    });
  }
}

async function tratarModalCandidatura(interaction) {
  if (!interaction.guild) {
    return erro(interaction, 'Esse formulário só funciona em servidores.');
  }

  const cfg = configuracoes(interaction.guild.id);

  if (!cfg.candidaturas || !cfg.candidaturaCargo) {
    return erro(interaction, 'As candidaturas não estão abertas. Avise a staff.');
  }

  if (temCandidaturaPendente(interaction.guild.id, interaction.user.id)) {
    return erro(interaction, 'Você já tem uma candidatura em análise.');
  }

  const canal = interaction.guild.channels.cache.get(cfg.candidaturas) ??
    (await interaction.guild.channels.fetch(cfg.candidaturas).catch(() => null));

  if (!canal?.isTextBased() || typeof canal.send !== 'function') {
    return erro(interaction, 'O canal de candidaturas não existe mais. Avise a staff.');
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const candidatura = await criarCandidatura(canal, {
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      cargoId: cfg.candidaturaCargo,
      respostas: {
        nome_idade: interaction.fields.getTextInputValue('nome_idade').trim(),
        motivacao: interaction.fields.getTextInputValue('motivacao').trim(),
        disponibilidade: interaction.fields.getTextInputValue('disponibilidade').trim(),
        experiencia: interaction.fields.getTextInputValue('experiencia')?.trim() || '',
      },
    });

    return interaction.editReply({
      content: `✅ Candidatura #${candidatura.id} enviada. A staff responde no privado.`,
    });
  } catch (erro) {
    console.error('[ERRO] Falha ao registrar candidatura:', erro);
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(CORES.erro).setDescription('Não consegui enviar a candidatura. Avise a staff.')],
    });
  }
}

/** Trata os formularios (modais) de /anuncio, /embed, /perfil, /denunciar e /candidatura. */
export async function tratarModal(interaction) {
  if (interaction.customId.startsWith('denuncia:novo:')) {
    return tratarModalDenuncia(interaction);
  }

  if (interaction.customId === 'candidatura:enviar') {
    return tratarModalCandidatura(interaction);
  }

  if (interaction.customId.startsWith('perfil:salvar:')) {
    return tratarModalPerfil(interaction);
  }

  const [tipo, canalId, mencao] = interaction.customId.split(':');

  const canal = await interaction.guild?.channels.fetch(canalId).catch(() => null);
  if (!canal?.isTextBased()) {
    return erro(interaction, 'Não achei o canal escolhido. Talvez ele tenha sido apagado.');
  }

  if (tipo === 'anuncio') {
    const titulo = interaction.fields.getTextInputValue('titulo').trim();
    const mensagem = interaction.fields.getTextInputValue('mensagem').trim();
    const cor = interaction.fields.getTextInputValue('cor')?.trim();

    const painel = new EmbedBuilder()
      .setColor(parseCor(cor, CORES.principal))
      .setTitle(titulo.slice(0, 256))
      .setDescription(mensagem.slice(0, 4000))
      .setFooter({ text: `Por ${interaction.user.tag}` })
      .setTimestamp();

    const conteudo =
      mencao === 'everyone' ? '@everyone' : mencao === 'here' ? '@here' : undefined;

    const enviada = await canal.send({ content: conteudo, embeds: [painel] });

    return interaction.reply({
      content: `✅ Anúncio publicado em ${canal}: ${enviada.url}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (tipo === 'embed') {
    const titulo = interaction.fields.getTextInputValue('titulo')?.trim();
    const descricao = interaction.fields.getTextInputValue('descricao')?.trim();
    const cor = interaction.fields.getTextInputValue('cor')?.trim();
    const imagem = interaction.fields.getTextInputValue('imagem')?.trim();
    const rodape = interaction.fields.getTextInputValue('rodape')?.trim();

    if (!titulo && !descricao) {
      return erro(interaction, 'Preencha pelo menos o título ou a descrição.');
    }

    const painel = new EmbedBuilder().setColor(parseCor(cor, CORES.principal));

    if (titulo) painel.setTitle(titulo.slice(0, 256));
    if (descricao) painel.setDescription(descricao.slice(0, 4000));
    if (rodape) painel.setFooter({ text: rodape.slice(0, 2048) });

    if (imagem) {
      if (!/^https?:\/\/\S+$/i.test(imagem)) {
        return erro(interaction, 'A URL da imagem precisa começar com `http://` ou `https://`.');
      }
      painel.setImage(imagem);
    }

    const enviada = await canal.send({ embeds: [painel] });

    return interaction.reply({
      content: `✅ Embed publicado em ${canal}: ${enviada.url}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  return undefined;
}
