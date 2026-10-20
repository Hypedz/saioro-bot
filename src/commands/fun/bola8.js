import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

const RESPOSTAS = [
  'Com certeza.',
  'Sim, sem dúvida.',
  'Pode contar com isso.',
  'Provavelmente sim.',
  'As chances parecem boas.',
  'Sim, mas não conte com isso.',
  'Melhor não responder agora.',
  'Pergunte de novo mais tarde.',
  'Difícil dizer.',
  'Não conte com isso.',
  'Minha resposta é não.',
  'Nem pensar.',
  'Muito duvidoso.',
  'Sem chance.',
];

export default {
  data: new SlashCommandBuilder()
    .setName('bola8')
    .setDescription('Faz uma pergunta para a bola de cristal.')
    .addStringOption((o) =>
      o.setName('pergunta').setDescription('Sua pergunta').setRequired(true).setMaxLength(300),
    ),

  async execute(interaction) {
    const pergunta = interaction.options.getString('pergunta', true);
    const resposta = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];

    await interaction.reply({
      embeds: [
        embed('🎱 Bola 8', `**Pergunta:** ${pergunta}\n**Resposta:** ${resposta}`, CORES.principal),
      ],
    });
  },
};
