import {
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleKeywordPresetType,
  AutoModerationRuleTriggerType,
} from 'discord.js';
import { db } from '../db.js';

/** Flag APPLICATION_AUTO_MODERATION_RULE_CREATE_BADGE. */
export const FLAG_BADGE_AUTOMOD = 1 << 6;

export const REGRAS = [
  {
    tipo: 'spam',
    nome: 'Anti-spam',
    triggerType: AutoModerationRuleTriggerType.Spam,
    triggerMetadata: {},
    timeout: true,
  },
  {
    tipo: 'mencoes',
    nome: 'Menções em massa',
    triggerType: AutoModerationRuleTriggerType.MentionSpam,
    triggerMetadata: { mentionTotalLimit: 6 },
    timeout: true,
  },
  {
    tipo: 'ofensas',
    nome: 'Ofensas graves',
    triggerType: AutoModerationRuleTriggerType.KeywordPreset,
    triggerMetadata: { presets: [AutoModerationRuleKeywordPresetType.Slurs] },
    timeout: false,
  },
];

function doBanco(guildId) {
  return db.prepare('SELECT rule_id, tipo FROM automod_regras WHERE guild_id = ?').all(guildId);
}

function registrar(guildId, ruleId, tipo) {
  db.prepare(`
    INSERT INTO automod_regras (guild_id, rule_id, tipo)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id, rule_id) DO UPDATE SET tipo = excluded.tipo
  `).run(guildId, ruleId, tipo);
}

function esquecer(guildId, ruleId) {
  db.prepare('DELETE FROM automod_regras WHERE guild_id = ? AND rule_id = ?').run(guildId, ruleId);
}

/** Cargos de staff ficam fora das regras, para não bloquear quem modera. */
function cargosIsentos(guild) {
  return [...guild.roles.cache.values()]
    .filter(
      (cargo) =>
        cargo.id !== guild.id &&
        (cargo.permissions.has('ManageGuild') ||
          cargo.permissions.has('ModerateMembers') ||
          cargo.permissions.has('Administrator')),
    )
    .slice(0, 20)
    .map((cargo) => cargo.id);
}

/**
 * Cria as regras que ainda não existem. Idempotente: rodar de novo não duplica.
 * @returns {{ criadas: string[], existentes: string[], falhas: string[], isentos: number }}
 */
export async function ativarAutomod(guild, { canalId = null, timeoutSegundos = 600 } = {}) {
  const atuais = await guild.autoModerationRules.fetch();
  const banco = new Map(doBanco(guild.id).map((linha) => [linha.tipo, linha.rule_id]));

  const criadas = [];
  const existentes = [];
  const falhas = [];
  const isentos = cargosIsentos(guild);

  for (const modelo of REGRAS) {
    const idSalvo = banco.get(modelo.tipo);
    const existente = idSalvo ? atuais.get(idSalvo) : null;

    if (existente) {
      existentes.push(modelo.nome);
      continue;
    }

    // Registro aponta para uma regra que sumiu do Discord: limpa antes de recriar.
    if (idSalvo) esquecer(guild.id, idSalvo);

    const acoes = [{ type: AutoModerationActionType.BlockMessage }];

    if (canalId) {
      acoes.push({
        type: AutoModerationActionType.SendAlertMessage,
        metadata: { channel: canalId },
      });
    }

    if (modelo.timeout && timeoutSegundos > 0) {
      acoes.push({
        type: AutoModerationActionType.Timeout,
        metadata: { durationSeconds: Math.min(timeoutSegundos, 2_419_200) },
      });
    }

    try {
      const regra = await guild.autoModerationRules.create({
        name: modelo.nome,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: modelo.triggerType,
        triggerMetadata: modelo.triggerMetadata,
        actions: acoes,
        enabled: true,
        exemptRoles: isentos,
        reason: 'AutoMod configurado pelo bot',
      });

      registrar(guild.id, regra.id, modelo.tipo);
      criadas.push(modelo.nome);
    } catch (erro) {
      falhas.push(`${modelo.nome}: ${erro.message}`);
    }
  }

  return { criadas, existentes, falhas, isentos: isentos.length };
}

/** Regras criadas pelo bot (não toca nas manuais do painel). */
export async function statusAutomod(guild, client) {
  const atuais = await guild.autoModerationRules.fetch().catch(() => new Map());

  const regras = doBanco(guild.id).map((linha) => ({
    tipo: linha.tipo,
    regra: atuais.get(linha.rule_id) ?? null,
  }));

  let badge = false;

  try {
    const aplicacao = await client.application.fetch();
    const flags = aplicacao?.flags ?? 0;

    badge =
      typeof flags === 'number'
        ? (flags & FLAG_BADGE_AUTOMOD) === FLAG_BADGE_AUTOMOD
        : Boolean(flags?.has?.(FLAG_BADGE_AUTOMOD));
  } catch {
    // Sem informação da aplicação: segue sem afirmar nada sobre a badge.
  }

  return { regras, badge };
}

export async function desativarAutomod(guild) {
  const regras = doBanco(guild.id);
  const removidas = [];
  const falhas = [];

  for (const linha of regras) {
    let apagou = false;

    try {
      await guild.autoModerationRules.delete(linha.rule_id, 'AutoMod desativado pelo bot');
      apagou = true;
    } catch (erro) {
      // 10057 = Unknown AutoModeration Rule: já não existia, pode esquecer.
      if (erro.code === 10057) apagou = true;
      else falhas.push(`${linha.tipo}: ${erro.message}`);
    }

    if (apagou) {
      esquecer(guild.id, linha.rule_id);
      removidas.push(linha.tipo);
    }
  }

  return { removidas, falhas };
}
