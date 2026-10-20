import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN?.trim() ?? '',
  clientId: process.env.CLIENT_ID?.trim() ?? '',
  guildId: process.env.GUILD_ID?.trim() ?? '',
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID?.trim() ?? '',
  goodbyeChannelId: process.env.GOODBYE_CHANNEL_ID?.trim() ?? '',
};

/** Lista o que esta faltando para o bot subir. */
export function missingConfig() {
  const faltando = [];
  if (!config.token) faltando.push('DISCORD_TOKEN');
  if (!config.clientId) faltando.push('CLIENT_ID');
  return faltando;
}
