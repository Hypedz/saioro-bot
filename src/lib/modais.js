import { EmbedBuilder, MessageFlags } from 'discord.js';
import { CORES, parseCor } from './embeds.js';
import { tratarModalPerfil } from './perfis.js';

const erro = (interaction, texto) =>
  interaction.reply({ content: texto, flags: MessageFlags.Ephemeral });

/** Trata os formularios (modais) de /anuncio, /embed e /perfil. */
export async function tratarModal(interaction) {
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
