import { statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { config } from '../../config.js';
import { db } from '../../db.js';
import { CORES, embed } from '../../lib/embeds.js';
import { configuracoes } from '../../lib/settings.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const PERMISSOES = [
  ['ViewChannel', 'Ver canais'],
  ['SendMessages', 'Enviar mensagens'],
  ['EmbedLinks', 'Inserir links'],
  ['ReadMessageHistory', 'Ler histórico'],
  ['ManageMessages', 'Gerenciar mensagens'],
  ['ManageChannels', 'Gerenciar canais'],
  ['ManageRoles', 'Gerenciar cargos'],
  ['ManageNicknames', 'Gerenciar apelidos'],
  ['ModerateMembers', 'Moderar membros'],
  ['KickMembers', 'Expulsar'],
  ['BanMembers', 'Banir'],
  ['ViewAuditLog', 'Ver auditoria'],
];

function contar(tabela) {
  try {
    return db.prepare(`SELECT COUNT(*) AS n FROM ${tabela}`).get().n;
  } catch {
    return 0;
  }
}

function tamanhoBanco() {
  try {
    return `${(statSync(path.join(raiz, 'dados', 'bot.db')).size / 1024).toFixed(0)} KB`;
  } catch {
    return '—';
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('diagnostico')
    .setDescription('Confere permissões, intents e configurações que faltam.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { guild, client } = interaction;
    const eu = guild.members.me;
    const cfg = configuracoes(guild.id);

    // 1) Permissoes
    const faltando = PERMISSOES.filter(
      ([chave]) => !eu.permissions.has(PermissionFlagsBits[chave]),
    ).map(([, nome]) => nome);

    const permissoes = faltando.length
      ? `❌ Faltando: ${faltando.join(', ')}`
      : '✅ Todas as permissões essenciais estão ok.';

    // 2) Intents
    const temMembros = client.options.intents.has(GatewayIntentBits.GuildMembers);
    const temConteudo = client.options.intents.has(GatewayIntentBits.MessageContent);

    const intents = [
      temMembros ? '✅ SERVER MEMBERS' : '❌ SERVER MEMBERS (boas-vindas e logs não funcionam)',
      temConteudo
        ? '✅ MESSAGE CONTENT'
        : '⚠️ MESSAGE CONTENT desligado (log de mensagem apagada fica sem o texto)',
    ].join('\n');

    // 3) Configuracoes
    const item = (valor, nome) =>
      `${valor ? '✅' : '⚠️'} ${nome}${valor ? '' : ' — não configurado'}`;

    const configs = [
      item(cfg.boasVindas ?? config.welcomeChannelId, 'Canal de boas-vindas'),
      item(cfg.boasVindasTexto || cfg.boasVindasDm || cfg.boasVindasImagem, 'Boas-vindas personalizada'),
      item(cfg.despedida ?? config.goodbyeChannelId, 'Canal de despedida'),
      item(cfg.logs, 'Canal de logs'),
      item(cfg.sugestoes, 'Canal de sugestões'),
      item(cfg.cargoAuto, 'Cargo automático'),
      item(cfg.verificarCargo, 'Cargo de verificação'),
    ].join('\n');

    // 4) Banco e carga
    const dados = [
      `Banco: **${tamanhoBanco()}**`,
      `Avisos: **${contar('avisos')}**`,
      `Snippets: **${contar('snippets')}**`,
      `Sugestões: **${contar('sugestoes')}**`,
      `Canais com sticky: **${contar('sticky')}**`,
      `Cargos no painel: **${contar('cargos_painel')}**`,
    ].join('\n');

    const painel = embed('🩺 Diagnóstico', null, CORES.principal).addFields(
      { name: 'Permissões do bot', value: permissoes },
      { name: 'Intents', value: intents },
      { name: 'Configuração', value: configs },
      { name: 'Banco de dados', value: dados },
    );

    await interaction.editReply({ embeds: [painel] });
  },
};
