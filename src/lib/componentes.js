import { MessageFlags } from 'discord.js';
import { montarAjuda } from './ajuda.js';
import { CORES, embed } from './embeds.js';
import { listarFaq, menuFaq, obterFaq } from './faq.js';
import { embedSorteio, encerrarSorteio, entrarSorteio, obterSorteio } from './sorteios.js';
import { votar } from './enquetes.js';
import {
  botoesSugestao,
  definirStatusSugestao,
  embedSugestao,
  obterSugestao,
  votarSugestao,
} from './sugestoes.js';
import { responderQuiz } from './quiz.js';
import { listarCargosPainel } from './cargosPainel.js';
import { removerEvento } from './eventos.js';

const erro = (interaction, texto, extra = {}) =>
  interaction.reply({ content: texto, flags: MessageFlags.Ephemeral, ...extra });

async function tratarSorteio(interaction, acao, messageId) {
  const sorteio = obterSorteio(messageId);
  if (!sorteio) return erro(interaction, 'Esse sorteio não existe mais.');

  if (acao === 'entrar') {
    const resultado = entrarSorteio(messageId, interaction.user.id);
    if (!resultado.ok) return erro(interaction, resultado.motivo);

    await interaction.update({ embeds: [embedSorteio(obterSorteio(messageId))] });

    if (resultado.jaParticipava) {
      await interaction
        .followUp({
          content: 'Você já está participando deste sorteio. Boa sorte! 🍀',
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
    return undefined;
  }

  if (acao === 'encerrar') {
    const podeEncerrar =
      interaction.user.id === sorteio.host_id || interaction.memberPermissions?.has('ManageGuild');

    if (!podeEncerrar) {
      return erro(interaction, 'Só quem criou o sorteio (ou quem gerencia o servidor) pode encerrar.');
    }

    await interaction.deferUpdate().catch(() => {});
    await encerrarSorteio(interaction.client, messageId);
  }

  return undefined;
}

async function tratarSugestao(interaction, acao, messageId) {
  const sugestao = obterSugestao(messageId);
  if (!sugestao) return erro(interaction, 'Essa sugestão não existe mais.');

  // Aprovar / recusar (staff)
  if (acao === 'aprovada' || acao === 'recusada') {
    if (!interaction.memberPermissions?.has('ManageGuild')) {
      return erro(interaction, 'Só quem gerencia o servidor pode aprovar ou recusar.');
    }

    const atualizada = definirStatusSugestao(messageId, acao);
    await interaction.update({
      embeds: [embedSugestao(atualizada)],
      components: botoesSugestao(atualizada),
    });

    return interaction
      .followUp({
        content:
          acao === 'aprovada'
            ? '✅ Sugestão marcada como aprovada.'
            : '❌ Sugestão marcada como recusada.',
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => {});
  }

  // Voto
  const voto = Number(acao);
  const resultado = votarSugestao(messageId, interaction.user.id, voto);
  if (!resultado.ok) return erro(interaction, resultado.motivo);

  await interaction.update({ embeds: [embedSugestao(obterSugestao(messageId))] });

  return interaction
    .followUp({
      content: resultado.removido
        ? 'Seu voto foi removido.'
        : `Voto registrado (${voto === 1 ? '👍 a favor' : '👎 contra'}). Agora: ${resultado.positivos} a favor, ${resultado.negativos} contra.`,
      flags: MessageFlags.Ephemeral,
    })
    .catch(() => {});
}

async function tratarVerificacao(interaction, cargoId) {
  const { guild, member } = interaction;

  const cargo = guild.roles.cache.get(cargoId) ?? (await guild.roles.fetch(cargoId).catch(() => null));
  if (!cargo) return erro(interaction, 'O cargo de verificação não existe mais. Avise a staff.');

  const eu = guild.members.me;
  if (!eu.permissions.has('ManageRoles')) {
    return erro(interaction, 'Preciso da permissão **Gerenciar Cargos** para te verificar.');
  }
  if (cargo.position >= eu.roles.highest.position) {
    return erro(interaction, 'O cargo de verificação está acima do meu. Avise a staff.');
  }

  if (member.roles.cache.has(cargo.id)) {
    return erro(interaction, 'Você já está verificado. ✅');
  }

  await member.roles.add(cargo, 'Verificação pelo bot');

  return interaction.reply({
    content: `✅ Verificado! Você recebeu o cargo **${cargo.name}**.`,
    flags: MessageFlags.Ephemeral,
  });
}

async function tratarEvento(interaction) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return erro(interaction, 'Só quem gerencia o servidor pode cancelar eventos.');
  }

  const eventId = interaction.values[0];
  const evento = await interaction.guild.scheduledEvents.fetch(eventId).catch(() => null);

  if (!evento) {
    removerEvento(eventId);
    return interaction.update({
      content: 'Esse evento não existe mais.',
      embeds: [],
      components: [],
    });
  }

  const cancelado = await evento
    .delete()
    .then(() => true)
    .catch((erro) => {
      console.error('[ERRO] Evento não cancelado:', erro.message);
      return false;
    });

  if (!cancelado) {
    return interaction.update({
      content: 'Não consegui cancelar o evento. Veja o console do bot.',
      embeds: [],
      components: [],
    });
  }

  removerEvento(eventId);

  return interaction.update({
    content: `🗑️ Evento **${evento.name}** cancelado.`,
    embeds: [],
    components: [],
  });
}

async function abrirFaq(interaction) {
  const itens = listarFaq(interaction.guildId);

  if (itens.length === 0) {
    return erro(interaction, 'Ainda não há perguntas cadastradas. Avise a staff.');
  }

  return interaction.reply({
    content: `📖 **Perguntas frequentes** (${itens.length})`,
    components: [menuFaq(itens)],
    flags: MessageFlags.Ephemeral,
  });
}

async function mostrarRespostaFaq(interaction) {
  const item = obterFaq(interaction.guildId, Number(interaction.values[0]));

  if (!item) {
    return interaction.update({
      content: 'Essa pergunta não existe mais.',
      embeds: [],
      components: [],
    });
  }

  const painel = embed(item.pergunta, item.resposta, CORES.principal);
  if (item.categoria) painel.setFooter({ text: item.categoria });

  return interaction.update({ embeds: [painel], components: [] });
}

async function tratarCargoPainel(interaction, cargoId) {
  const { guild, member } = interaction;

  const noPainel = listarCargosPainel(guild.id).some((item) => item.role_id === cargoId);
  if (!noPainel) {
    return erro(interaction, 'Esse cargo saiu do painel. Avise a staff.');
  }

  const cargo = guild.roles.cache.get(cargoId) ?? (await guild.roles.fetch(cargoId).catch(() => null));
  if (!cargo) return erro(interaction, 'Esse cargo não existe mais. Avise a staff.');

  const eu = guild.members.me;
  if (!eu.permissions.has('ManageRoles')) {
    return erro(interaction, 'Preciso da permissão **Gerenciar Cargos** para isso.');
  }
  if (cargo.managed || cargo.position >= eu.roles.highest.position) {
    return erro(interaction, 'Não posso entregar esse cargo. Avise a staff.');
  }

  if (member.roles.cache.has(cargo.id)) {
    await member.roles.remove(cargo, 'Painel de cargos');
    return interaction.reply({
      content: `➖ Cargo **${cargo.name}** removido.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  await member.roles.add(cargo, 'Painel de cargos');
  return interaction.reply({
    content: `➕ Cargo **${cargo.name}** adicionado.`,
    flags: MessageFlags.Ephemeral,
  });
}

async function tratarQuiz(interaction, messageId, indice) {
  const resultado = responderQuiz(messageId, interaction.user.id, Number(indice));
  if (!resultado.ok) return erro(interaction, resultado.motivo);

  const opcaoEscolhida = interaction.component?.label ?? `opção ${Number(indice) + 1}`;

  if (resultado.acertou) {
    return interaction.reply({
      content: `✅ Acertou! **${opcaoEscolhida}** é a resposta certa.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  return interaction.reply({
    content: `❌ Errou. A resposta certa era a **${resultado.correta + 1}**.`,
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * Roteia botoes e menus. customId segue "grupo:acao:id" (as vezes com um 4o campo).
 */
export async function tratarComponente(interaction) {
  const [grupo, acao, extra] = interaction.customId.split(':');

  if (grupo === 'ajuda' && interaction.isStringSelectMenu()) {
    return interaction.update(montarAjuda(interaction.client, interaction.values[0]));
  }

  if (grupo === 'sorteio' && interaction.isButton()) {
    return tratarSorteio(interaction, acao, extra);
  }

  if (grupo === 'enquete' && interaction.isButton()) {
    const resultado = await votar(interaction.client, acao, interaction.user.id, Number(extra));

    if (!resultado.ok) return erro(interaction, resultado.motivo);

    return interaction.reply({
      content: resultado.trocou
        ? `Voto alterado para **${resultado.opcao}**.`
        : `Voto registrado em **${resultado.opcao}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (grupo === 'sugestao' && interaction.isButton()) {
    return tratarSugestao(interaction, acao, extra);
  }

  if (grupo === 'verificar' && interaction.isButton()) {
    return tratarVerificacao(interaction, acao);
  }

  if (grupo === 'evento' && interaction.isStringSelectMenu()) {
    return tratarEvento(interaction);
  }

  if (grupo === 'faq' && interaction.isButton()) {
    return abrirFaq(interaction);
  }

  if (grupo === 'faq' && interaction.isStringSelectMenu()) {
    return mostrarRespostaFaq(interaction);
  }

  if (grupo === 'cargo' && interaction.isButton()) {
    return tratarCargoPainel(interaction, acao);
  }

  if (grupo === 'quiz' && interaction.isButton()) {
    return tratarQuiz(interaction, acao, extra);
  }

  return undefined;
}
