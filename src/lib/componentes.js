import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { montarAjuda } from './ajuda.js';
import { CORES, embed } from './embeds.js';
import { listarFaq, menuFaq, obterFaq, resumoFaq } from './faq.js';
import {
  embedSorteio,
  encerrarSorteio,
  entrarSorteio,
  obterSorteio,
  rerolarSorteio,
  verificarRequisitos,
} from './sorteios.js';
import { votar } from './enquetes.js';
import {
  botoesSugestao,
  definirStatusSugestao,
  embedSugestao,
  obterSugestao,
  votarSugestao,
} from './sugestoes.js';
import { responderQuiz } from './quiz.js';
import { listarCargosPainel, montarPainelCargos } from './cargosPainel.js';
import { removerEvento } from './eventos.js';
import { obterRegras } from './regras.js';
import {
  modalPerfil,
  obterPerfil,
  removerPerfil,
  salvarCampos,
  selecaoCampos,
} from './perfis.js';
import {
  STATUS_DENUNCIA,
  atualizarStatusDenuncia,
  botoesDenuncia,
  embedDenuncia,
  modalDenunciaPainel,
  obterDenuncia,
} from './denuncias.js';
import {
  atualizarStatusCandidatura,
  botoesCandidatura,
  embedCandidatura,
  modalCandidatura,
  obterCandidatura,
  temCandidaturaPendente,
} from './candidaturas.js';
import { configuracoes } from './settings.js';

const erro = (interaction, texto, extra = {}) =>
  interaction.reply({ content: texto, flags: MessageFlags.Ephemeral, ...extra });

async function tratarSorteio(interaction, acao, messageId) {
  const sorteio = obterSorteio(messageId);
  if (!sorteio) return erro(interaction, 'Esse sorteio não existe mais.');

  if (acao === 'entrar') {
    const faltas = interaction.member ? verificarRequisitos(sorteio, interaction.member) : [];

    if (faltas.length) {
      return erro(
        interaction,
        `Você ainda não cumpre os requisitos:\n• ${faltas.join('\n• ')}`,
      );
    }

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
    return undefined;
  }

  if (acao === 'rerolar') {
    const podeRerolar =
      interaction.user.id === sorteio.host_id || interaction.memberPermissions?.has('ManageGuild');

    if (!podeRerolar) {
      return erro(
        interaction,
        'Só quem criou o sorteio (ou quem gerencia o servidor) pode sortear novamente.',
      );
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
    const resultado = await rerolarSorteio(interaction.client, messageId);

    if (!resultado.ok) {
      return interaction.editReply({ content: resultado.motivo }).catch(() => {});
    }

    return interaction
      .editReply({
        content: `🔁 Rodada ${resultado.rodada}: ${
          resultado.vencedores.length
            ? resultado.vencedores.map((id) => `<@${id}>`).join(', ')
            : 'ninguém'
        }.`,
      })
      .catch(() => {});
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
    content: resumoFaq(itens),
    components: [menuFaq(itens)],
    flags: MessageFlags.Ephemeral,
  });
}

async function mostrarRegrasPainel(interaction) {
  const regras = obterRegras(interaction.guildId);

  if (!regras) {
    return erro(
      interaction,
      'As regras ainda não foram publicadas. Avise a staff para usar `/regras`.',
    );
  }

  const painel = embed(regras.titulo, regras.texto, CORES.principal);
  const componentes = [];

  if (regras.channel_id && regras.message_id) {
    componentes.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Abrir no canal')
          .setEmoji('📜')
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/channels/${interaction.guildId}/${regras.channel_id}/${regras.message_id}`,
          ),
      ),
    );
  }

  return interaction.reply({
    embeds: [painel],
    components: componentes,
    flags: MessageFlags.Ephemeral,
  });
}

async function mostrarCargosPainel(interaction) {
  const cargos = listarCargosPainel(interaction.guildId);

  if (cargos.length === 0) {
    return erro(interaction, 'Nenhum cargo de autoatribuição foi configurado. Avise a staff.');
  }

  const painel = montarPainelCargos(interaction.guild, cargos);

  if (painel.components.length === 0) {
    return erro(interaction, 'Os cargos do painel não existem mais. Avise a staff.');
  }

  return interaction.reply({
    ...painel,
    flags: MessageFlags.Ephemeral,
  });
}

async function escolherDenunciaPainel(interaction) {
  return interaction.reply({
    content:
      '🚨 **Denúncia**\nEscolha como quer enviar. O formulário vai pedir o membro e o que aconteceu.',
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('denuncia:painel:0')
          .setLabel('Identificado')
          .setEmoji('🙋')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('denuncia:painel:1')
          .setLabel('Anônimo')
          .setEmoji('🕵️')
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
    flags: MessageFlags.Ephemeral,
  });
}

async function voltarAoMenuFaq(interaction) {
  const itens = listarFaq(interaction.guildId);

  if (itens.length === 0) {
    return interaction.update({
      content: 'Ainda não há perguntas cadastradas.',
      embeds: [],
      components: [],
    });
  }

  return interaction.update({
    content: resumoFaq(itens),
    embeds: [],
    components: [menuFaq(itens)],
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

  const voltar = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('faq:menu')
      .setLabel('Voltar')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary),
  );

  return interaction.update({ embeds: [painel], components: [voltar] });
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

async function tratarDenuncia(interaction, acao, id) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return erro(interaction, 'Só quem gerencia o servidor pode mudar o status de uma denúncia.');
  }

  const status = STATUS_DENUNCIA[acao];
  if (!status) return erro(interaction, 'Status inválido.');

  const denuncia = obterDenuncia(id);
  if (!denuncia) return erro(interaction, 'Essa denúncia não existe mais.');

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const atualizada = atualizarStatusDenuncia(id, acao, interaction.user.id);

  await interaction.message
    .edit({
      embeds: [embedDenuncia(atualizada)],
      components: [botoesDenuncia(id)],
    })
    .catch((erro) => console.error('[ERRO] Denúncia não atualizada:', erro.message));

  await interaction
    .editReply({ content: `Status da denúncia #${id}: ${status.rotulo}.` })
    .catch(() => {});

  const autor = await interaction.client.users.fetch(denuncia.autor_id).catch(() => null);
  autor
    ?.send(`Sua denúncia #${id} foi marcada como **${status.rotulo}**.`)
    .catch(() => {});
}

async function abrirCandidatura(interaction) {
  const cfg = configuracoes(interaction.guildId);

  if (!cfg.candidaturas || !cfg.candidaturaCargo) {
    return erro(interaction, 'As candidaturas não estão abertas. Avise a staff.');
  }

  if (temCandidaturaPendente(interaction.guildId, interaction.user.id)) {
    return erro(interaction, 'Você já tem uma candidatura em análise. Aguarde a resposta.');
  }

  return interaction.showModal(modalCandidatura());
}

async function tratarCandidatura(interaction, acao, id) {
  if (!interaction.memberPermissions?.has('ManageGuild')) {
    return erro(interaction, 'Só quem gerencia o servidor pode decidir candidaturas.');
  }

  const candidatura = obterCandidatura(id);
  if (!candidatura) return erro(interaction, 'Essa candidatura não existe mais.');
  if (candidatura.status !== 'pendente') {
    return erro(interaction, 'Essa candidatura já foi decidida.');
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const editarPainel = async (atualizada) => {
    await interaction.message
      .edit({
        embeds: [embedCandidatura(atualizada)],
        components: [botoesCandidatura(atualizada)],
      })
      .catch((erro) => console.error('[ERRO] Candidatura não atualizada:', erro.message));
  };

  if (acao === 'aprovar') {
    const membro = await interaction.guild.members
      .fetch(candidatura.user_id)
      .catch(() => null);

    if (!membro) {
      return interaction.editReply({
        content: 'O candidato não está mais no servidor. Recuse a candidatura.',
      });
    }

    const cargoId = candidatura.cargo_id ?? configuracoes(interaction.guildId).candidaturaCargo;
    const cargo = interaction.guild.roles.cache.get(cargoId) ??
      (await interaction.guild.roles.fetch(cargoId).catch(() => null));

    if (!cargo) {
      return interaction.editReply({
        content: 'O cargo combinado não existe mais. Configure outro com `/candidatura configurar`.',
      });
    }

    const eu = interaction.guild.members.me;
    if (!eu.permissions.has('ManageRoles')) {
      return interaction.editReply({
        content: 'Preciso da permissão **Gerenciar Cargos** para aprovar.',
      });
    }
    if (cargo.id === interaction.guild.id) {
      return interaction.editReply({
        content: 'O cargo **@everyone** não pode ser entregue como aprovação.',
      });
    }

    if (cargo.managed || cargo.position >= eu.roles.highest.position) {
      return interaction.editReply({
        content: 'Não posso entregar esse cargo: ele está acima do meu ou é de integração.',
      });
    }

    const adicionou = await membro.roles
      .add(cargo, 'Candidatura aprovada')
      .then(() => true)
      .catch((erro) => {
        console.error('[ERRO] Cargo de candidatura não entregue:', erro.message);
        return false;
      });

    if (!adicionou) {
      return interaction.editReply({
        content: 'Não consegui entregar o cargo. Veja o console do bot.',
      });
    }

    const atualizada = atualizarStatusCandidatura(id, 'aprovada', interaction.user.id);
    await editarPainel(atualizada);

    membro.user
      .send(`✅ Sua candidatura foi **aprovada**! Você recebeu o cargo **${cargo.name}**.`)
      .catch(() => {});

    return interaction.editReply({
      content: `✅ Candidatura de ${membro.user.tag} aprovada.`,
    });
  }

  if (acao === 'recusar') {
    const atualizada = atualizarStatusCandidatura(id, 'recusada', interaction.user.id);
    await editarPainel(atualizada);

    const candidato = await interaction.client.users
      .fetch(candidatura.user_id)
      .catch(() => null);
    candidato
      ?.send('❌ Sua candidatura foi **recusada**. Obrigado pelo interesse.')
      .catch(() => {});

    return interaction.editReply({
      content: `❌ Candidatura de <@${candidatura.user_id}> recusada.`,
    });
  }

  return interaction.editReply({ content: 'Ação inválida.' });
}

async function tratarPerfil(interaction, acao, alvoId) {
  if (interaction.user.id !== alvoId) {
    return erro(interaction, 'Só a própria pessoa pode alterar este perfil.');
  }

  if (acao === 'editar' && interaction.isButton()) {
    return interaction.showModal(modalPerfil(obterPerfil(interaction.guildId, alvoId), alvoId));
  }

  if (acao === 'campos' && interaction.isButton()) {
    return interaction.reply({
      content:
        '🎛️ Marque o que deve aparecer no seu cartão. Desmarcar tudo deixa apenas título, bio e imagem.',
      components: [selecaoCampos(obterPerfil(interaction.guildId, alvoId), alvoId)],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (acao === 'campos' && interaction.isStringSelectMenu()) {
    salvarCampos(interaction.guildId, alvoId, interaction.values);

    return interaction.update({
      content: '✅ Campos atualizados. Use `/perfil ver` para conferir.',
      components: [selecaoCampos(obterPerfil(interaction.guildId, alvoId), alvoId)],
    });
  }

  if (acao === 'reset' && interaction.isButton()) {
    removerPerfil(interaction.guildId, alvoId);
    return interaction.update({
      content: '♻️ Perfil restaurado ao padrão.',
      embeds: [],
      components: [],
    });
  }

  if (acao === 'cancelar' && interaction.isButton()) {
    return interaction.update({ content: 'Nada foi alterado.', components: [] });
  }

  return undefined;
}

/**
 * Roteia botoes e menus. customId segue "grupo:acao:id" (as vezes com um 4o campo).
 */
export async function tratarComponente(interaction) {
  const [grupo, acao, extra] = interaction.customId.split(':');

  if (grupo === 'ajuda' && interaction.isStringSelectMenu()) {
    return interaction.update(montarAjuda(interaction.client, interaction.values[0]));
  }

  if (grupo === 'painel' && interaction.isButton()) {
    if (acao === 'regras') return mostrarRegrasPainel(interaction);
    if (acao === 'cargos') return mostrarCargosPainel(interaction);
    if (acao === 'faq') return abrirFaq(interaction);
    if (acao === 'denunciar') return escolherDenunciaPainel(interaction);
    if (acao === 'candidatura') return abrirCandidatura(interaction);
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
    return interaction.customId === 'faq:menu'
      ? voltarAoMenuFaq(interaction)
      : abrirFaq(interaction);
  }

  if (grupo === 'faq' && interaction.isStringSelectMenu()) {
    return mostrarRespostaFaq(interaction);
  }

  if (grupo === 'denuncia' && interaction.isButton()) {
    if (acao === 'painel') return interaction.showModal(modalDenunciaPainel(extra === '1'));
    return tratarDenuncia(interaction, acao, extra);
  }

  if (grupo === 'candidatura' && interaction.isButton()) {
    if (acao === 'abrir') return abrirCandidatura(interaction);
    return tratarCandidatura(interaction, acao, extra);
  }

  if (grupo === 'perfil') {
    return tratarPerfil(interaction, acao, extra);
  }

  if (grupo === 'cargo' && interaction.isButton()) {
    return tratarCargoPainel(interaction, acao);
  }

  if (grupo === 'quiz' && interaction.isButton()) {
    return tratarQuiz(interaction, acao, extra);
  }

  return undefined;
}
