import { MessageFlags } from 'discord.js';
import { montarAjuda } from './ajuda.js';
import { embedSorteio, encerrarSorteio, entrarSorteio, obterSorteio } from './sorteios.js';
import { votar } from './enquetes.js';

/**
 * Roteia botoes e menus. Cada customId segue o padrao "grupo:acao:id".
 */
export async function tratarComponente(interaction) {
  const [grupo, acao, extra] = interaction.customId.split(':');

  if (grupo === 'ajuda' && interaction.isStringSelectMenu()) {
    const painel = montarAjuda(interaction.client, interaction.values[0]);
    return interaction.update(painel);
  }

  if (grupo === 'sorteio' && interaction.isButton()) {
    const sorteio = obterSorteio(extra);
    if (!sorteio) {
      return interaction.reply({
        content: 'Esse sorteio não existe mais.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (acao === 'entrar') {
      const resultado = entrarSorteio(extra, interaction.user.id);
      if (!resultado.ok) {
        return interaction.reply({ content: resultado.motivo, flags: MessageFlags.Ephemeral });
      }

      const atualizado = obterSorteio(extra);
      await interaction.update({ embeds: [embedSorteio(atualizado)] });

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
        interaction.user.id === sorteio.host_id ||
        interaction.memberPermissions?.has('ManageGuild');

      if (!podeEncerrar) {
        return interaction.reply({
          content: 'Só quem criou o sorteio (ou quem gerencia o servidor) pode encerrar.',
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferUpdate().catch(() => {});
      await encerrarSorteio(interaction.client, extra);
      return undefined;
    }
  }

  if (grupo === 'enquete' && interaction.isButton()) {
    const indice = Number(extra);
    const resultado = await votar(interaction.client, acao, interaction.user.id, indice);

    if (!resultado.ok) {
      return interaction.reply({ content: resultado.motivo, flags: MessageFlags.Ephemeral });
    }

    return interaction.reply({
      content: resultado.trocou
        ? `Voto alterado para **${resultado.opcao}**.`
        : `Voto registrado em **${resultado.opcao}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  return undefined;
}
