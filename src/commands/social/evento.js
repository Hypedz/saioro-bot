import {
  ActionRowBuilder,
  ChannelType,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventStatus,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';
import { formatarDuracao, parseDuracao } from '../../lib/tempo.js';
import { parseInicio, salvarLembrete } from '../../lib/eventos.js';

function localDoEvento(evento) {
  return evento.entityMetadata?.location ?? evento.channel?.name ?? 'Discord';
}

function quando(ms) {
  return `<t:${Math.floor(ms / 1000)}:f> (<t:${Math.floor(ms / 1000)}:R>)`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('evento')
    .setDescription('Cria e gerencia eventos no calendário do Discord.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('criar')
        .setDescription('Agenda um evento')
        .addStringOption((o) =>
          o.setName('titulo').setDescription('Nome do evento').setRequired(true).setMaxLength(100),
        )
        .addStringOption((o) =>
          o
            .setName('inicio')
            .setDescription('Ex.: 2h, 25/12 20:00, 20:00')
            .setRequired(true)
            .setMaxLength(30),
        )
        .addStringOption((o) =>
          o
            .setName('duracao')
            .setDescription('Quanto tempo dura (padrão: 1h)')
            .setMaxLength(20),
        )
        .addStringOption((o) =>
          o
            .setName('local')
            .setDescription('Onde é (padrão: Discord)')
            .setMaxLength(100),
        )
        .addChannelOption((o) =>
          o
            .setName('canal-voz')
            .setDescription('Sala de voz do evento (deixe vazio para evento externo)')
            .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice),
        )
        .addStringOption((o) =>
          o.setName('descricao').setDescription('Descrição do evento').setMaxLength(1000),
        )
        .addIntegerOption((o) =>
          o
            .setName('lembrete')
            .setDescription('Avisar neste canal antes do evento')
            .addChoices(
              { name: '5 minutos antes', value: 5 },
              { name: '10 minutos antes', value: 10 },
              { name: '30 minutos antes', value: 30 },
              { name: '1 hora antes', value: 60 },
              { name: '2 horas antes', value: 120 },
              { name: '1 dia antes', value: 1440 },
            ),
        ),
    )
    .addSubcommand((sub) => sub.setName('listar').setDescription('Lista os próximos eventos'))
    .addSubcommand((sub) =>
      sub.setName('cancelar').setDescription('Cancela um evento pelo menu'),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Esse comando só funciona em servidores.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;

    if (sub === 'criar') {
      const titulo = interaction.options.getString('titulo', true).trim();
      const textoInicio = interaction.options.getString('inicio', true);
      const textoDuracao = interaction.options.getString('duracao') ?? '1h';
      const local = interaction.options.getString('local')?.trim() || 'Discord';
      const canalVoz = interaction.options.getChannel('canal-voz');
      const descricao = interaction.options.getString('descricao');
      const minutos = interaction.options.getInteger('lembrete');

      const inicio = parseInicio(textoInicio);
      if (!inicio) {
        return interaction.reply({
          content:
            'Não entendi a data. Use `2h`, `30m`, `25/12 20:00`, `25/12/2027 20:00` ou `20:00`.\n' +
            'Se você digitou só dia/mês e a data já passou este ano, inclua o ano.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (inicio.getTime() < Date.now() + 60_000) {
        return interaction.reply({
          content: 'O evento precisa começar pelo menos 1 minuto no futuro.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const duracao = parseDuracao(textoDuracao);
      if (!duracao) {
        return interaction.reply({
          content: 'Duração inválida. Use algo como `1h`, `90m` ou `2h30m`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const tipo = canalVoz
        ? canalVoz.type === ChannelType.GuildStageVoice
          ? GuildScheduledEventEntityType.StageInstance
          : GuildScheduledEventEntityType.Voice
        : GuildScheduledEventEntityType.External;

      const evento = await guild.scheduledEvents.create({
        name: titulo,
        description: descricao ?? undefined,
        scheduledStartTime: inicio,
        scheduledEndTime: new Date(inicio.getTime() + duracao),
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: tipo,
        channel: canalVoz ?? undefined,
        entityMetadata: canalVoz ? undefined : { location: local },
        reason: `Criado por ${interaction.user.tag}`,
      });

      let aviso = 'Sem lembrete (o Discord ainda avisa quem marcar interesse)';
      if (minutos) {
        const avisoEm = inicio.getTime() - minutos * 60_000;

        if (avisoEm <= Date.now()) {
          aviso = `Sem lembrete: ${minutos} min antes já passou`;
        } else {
          salvarLembrete({
            eventId: evento.id,
            guildId: guild.id,
            channelId: interaction.channelId,
            inicio: inicio.getTime(),
            avisoEm,
          });
          aviso = `Neste canal, ${minutos} min antes`;
        }
      }

      const painel = embed('📅 Evento criado', null, CORES.sucesso).addFields(
        { name: 'Evento', value: evento.name },
        { name: 'Começa', value: quando(evento.scheduledStartTimestamp) },
        {
          name: 'Duração',
          value: formatarDuracao(duracao),
          inline: true,
        },
        {
          name: 'Local',
          value: canalVoz ? `${canalVoz}` : local,
          inline: true,
        },
        { name: 'Lembrete', value: aviso, inline: false },
        { name: 'Link', value: evento.url },
      );

      return interaction.reply({ embeds: [painel] });
    }

    if (sub === 'listar') {
      const eventos = [...(await guild.scheduledEvents.fetch()).values()]
        .filter(
          (evento) =>
            evento.status === GuildScheduledEventStatus.Scheduled ||
            evento.status === GuildScheduledEventStatus.Active,
        )
        .sort((a, b) => a.scheduledStartTimestamp - b.scheduledStartTimestamp)
        .slice(0, 15);

      if (eventos.length === 0) {
        return interaction.reply({
          content: 'Nenhum evento agendado. Crie um com `/evento criar`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const painel = embed(
        '📅 Próximos eventos',
        null,
        CORES.principal,
      ).addFields(
        eventos.map((evento) => ({
          name: evento.name.slice(0, 256),
          value: [
            quando(evento.scheduledStartTimestamp),
            `${localDoEvento(evento)} • ${evento.interestedCount ?? 0} interessado(s)`,
            evento.url,
          ].join('\n'),
        })),
      );

      return interaction.reply({ embeds: [painel] });
    }

    // cancelar
    const eventos = [...(await guild.scheduledEvents.fetch()).values()]
      .filter(
        (evento) =>
          evento.status === GuildScheduledEventStatus.Scheduled ||
          evento.status === GuildScheduledEventStatus.Active,
      )
      .sort((a, b) => a.scheduledStartTimestamp - b.scheduledStartTimestamp)
      .slice(0, 25);

    if (eventos.length === 0) {
      return interaction.reply({
        content: 'Não há eventos para cancelar.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('evento:cancelar')
      .setPlaceholder('Escolha o evento para cancelar')
      .addOptions(
        eventos.map((evento) => ({
          label: evento.name.slice(0, 100),
          description: `${new Date(evento.scheduledStartTimestamp).toLocaleString('pt-BR')} • ${localDoEvento(evento)}`.slice(0, 100),
          value: evento.id,
        })),
      );

    return interaction.reply({
      content: 'Escolha qual evento cancelar:',
      components: [new ActionRowBuilder().addComponents(menu)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
