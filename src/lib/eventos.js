import { GuildScheduledEventStatus } from 'discord.js';
import { db } from '../db.js';
import { parseDuracao } from './tempo.js';

/**
 * Aceita:
 *  - relativo: "30m", "2h", "1d2h" (ou só "30", que vale 30 minutos)
 *  - "25/12 20:00" ou "25/12/2027 20:00"
 *  - "20:00" (hoje; se já passou, amanhã)
 * Retorna Date ou null.
 */
export function parseInicio(texto, agora = new Date()) {
  const bruto = String(texto ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!bruto) return null;

  if (/^\d+([a-zç]+)?$/.test(bruto)) {
    const ms = parseDuracao(bruto);
    return ms ? new Date(agora.getTime() + ms) : null;
  }

  const comData = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):(\d{2})$/.exec(bruto);
  if (comData) {
    const [, dia, mes, ano, hora, minuto] = comData;
    const anoFinal = ano
      ? ano.length === 2
        ? 2000 + Number(ano)
        : Number(ano)
      : agora.getFullYear();

    const data = new Date(
      anoFinal,
      Number(mes) - 1,
      Number(dia),
      Number(hora),
      Number(minuto),
      0,
      0,
    );

    if (!valida(data, Number(dia), Number(mes) - 1, Number(hora), Number(minuto))) return null;
    if (!ano && data.getTime() <= agora.getTime()) return null;

    return data;
  }

  const soHora = /^(\d{1,2}):(\d{2})$/.exec(bruto);
  if (soHora) {
    const hora = Number(soHora[1]);
    const minuto = Number(soHora[2]);
    if (hora > 23 || minuto > 59) return null;

    const data = new Date(agora);
    data.setHours(hora, minuto, 0, 0);
    if (data.getTime() <= agora.getTime()) data.setDate(data.getDate() + 1);

    return data;
  }

  return null;
}

function valida(data, dia, mes, hora, minuto) {
  return (
    data.getDate() === dia &&
    data.getMonth() === mes &&
    data.getHours() === hora &&
    data.getMinutes() === minuto
  );
}

export function salvarLembrete({ eventId, guildId, channelId, inicio, avisoEm }) {
  db.prepare(`
    INSERT INTO eventos (event_id, guild_id, channel_id, inicio, aviso_em, avisado)
    VALUES (?, ?, ?, ?, ?, 0)
    ON CONFLICT(event_id) DO UPDATE SET
      channel_id = excluded.channel_id,
      inicio     = excluded.inicio,
      aviso_em   = excluded.aviso_em,
      avisado    = 0
  `).run(eventId, guildId, channelId, inicio, avisoEm);
}

export function removerEvento(eventId) {
  return db.prepare('DELETE FROM eventos WHERE event_id = ?').run(eventId).changes;
}

function marcarAvisado(eventId) {
  db.prepare('UPDATE eventos SET avisado = 1 WHERE event_id = ?').run(eventId);
}

/** Avisa no canal combinado quando o evento esta perto de comecar. */
export async function tickEventos(client) {
  const agora = Date.now();

  const pendentes = db
    .prepare('SELECT * FROM eventos WHERE avisado = 0 AND aviso_em <= ?')
    .all(agora);

  for (const registro of pendentes) {
    const guild = client.guilds.cache.get(registro.guild_id);
    if (!guild) continue;

    const evento = await guild.scheduledEvents.fetch(registro.event_id).catch(() => null);
    if (!evento) {
      removerEvento(registro.event_id);
      continue;
    }

    if (
      evento.status === GuildScheduledEventStatus.Canceled ||
      evento.status === GuildScheduledEventStatus.Completed
    ) {
      marcarAvisado(registro.event_id);
      continue;
    }

    const canal = await client.channels.fetch(registro.channel_id).catch(() => null);
    if (canal?.isTextBased()) {
      const quando = Math.floor(evento.scheduledStartTimestamp / 1000);
      await canal
        .send({
          content: `📅 **${evento.name}** começa <t:${quando}:R>\n${evento.url}`,
          allowedMentions: { parse: [] },
        })
        .catch(() => {});
    }

    marcarAvisado(registro.event_id);
  }

  // Limpa lembretes de eventos que ja passaram ha mais de 6h.
  db.prepare('DELETE FROM eventos WHERE inicio < ?').run(agora - 6 * 60 * 60 * 1000);
}
