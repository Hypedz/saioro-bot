import { configuracoes } from './settings.js';

/** Manda um embed no canal de logs configurado. Silencioso se nao houver. */
export async function enviarLog(guild, embed) {
  if (!guild) return;
  const canalId = configuracoes(guild.id).logs;
  if (!canalId) return;

  const canal = guild.channels.cache.get(canalId);
  if (!canal?.isTextBased()) return;

  await canal.send({ embeds: [embed] }).catch(() => {});
}

export const CORES_LOG = {
  entrada: 0x2ecc71,
  saida: 0xe74c3c,
  mensagem: 0xf1c40f,
  moderacao: 0xe67e22,
};
