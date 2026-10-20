import { SlashCommandBuilder } from 'discord.js';
import { CORES, embed } from '../../lib/embeds.js';

const PIADAS = [
  'Por que o programador faliu? Porque esqueceu de pagar a conta.',
  'Um QA entra num bar. Pede 1 cerveja. Pede 0 cervejas. Pede -1 cerveja. Pede um lagarto.',
  'Só existem 10 tipos de pessoas: as que entendem binário e as que não.',
  'Meu código não tem bugs, tem features não documentadas.',
  'O que o CSS disse para o HTML? Você não tem estilo.',
  'Como consolar um JavaScript? "Não se preocupe, é só um undefined."',
  'Meu código funciona. Não sei por quê. Não mexa.',
  'O que é um algoritmo? É uma receita de bolo escrita por alguém que nunca assou um bolo.',
  'Por que o Wi-Fi foi ao médico? Porque estava com sinal fraco.',
  'Um byte entra num bar e pede um bit. O garçom pergunta: "Está com fome?" Ele responde: "Só um pouco."',
];

export default {
  data: new SlashCommandBuilder().setName('piada').setDescription('Conta uma piada.'),

  async execute(interaction) {
    const piada = PIADAS[Math.floor(Math.random() * PIADAS.length)];

    await interaction.reply({
      embeds: [embed('😄 Piada', piada, CORES.destaque)],
    });
  },
};
