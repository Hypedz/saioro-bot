# Bot do Discord

Projeto independente: não lê, não importa e não depende de nenhuma outra pasta ou projeto.

Feito em JavaScript (Node.js + discord.js v14) com:

- **Slash commands**: `/ping`, `/help`, `/limpar`, `/timeout`
- **Boas-vindas e despedida** em canais configurados

---

## Passo 1 — Criar o app no Discord

1. Abra <https://discord.com/developers/applications> e clique em **New Application**.
2. Dê um nome e aceite os termos.
3. Na aba **General Information**, copie o **Application ID** — é o seu `CLIENT_ID`.

## Passo 2 — Pegar o token do bot

1. Aba **Bot** → **Reset Token** → **Copy**.
2. Cole no `.env` em `DISCORD_TOKEN`.

> O token é como uma senha. Nunca poste em print, GitHub ou chat. Se vazar, use **Reset Token**.

## Passo 3 — Ativar os intents

Ainda na aba **Bot**, em **Privileged Gateway Intents**, ligue:

- ✅ **SERVER MEMBERS INTENT** (necessário para boas-vindas)

Salve com **Save Changes**.

## Passo 4 — Convidar o bot

Troque `SEU_CLIENT_ID` pelo seu Application ID e abra no navegador:

```
https://discord.com/api/oauth2/authorize?client_id=SEU_CLIENT_ID&permissions=1099511720960&scope=bot%20applications.commands
```

Escolha o servidor → **Autorizar**. As permissões já vêm marcadas: ver canais, enviar mensagens, embeds, histórico, gerenciar mensagens e moderar membros.

## Passo 5 — Configurar o `.env`

```powershell
Copy-Item .env.example .env
notepad .env
```

| Variável | O que é |
|---|---|
| `DISCORD_TOKEN` | token do Passo 2 |
| `CLIENT_ID` | Application ID do Passo 1 |
| `GUILD_ID` | ID do seu servidor (opcional, mas recomendado) |
| `WELCOME_CHANNEL_ID` | canal de boas-vindas (opcional) |
| `GOODBYE_CHANNEL_ID` | canal de despedida (opcional) |

**Como pegar um ID:** Discord → Configurações → Avançado → ative **Modo desenvolvedor**. Depois clique com o botão direito no servidor/canal → **Copiar ID**.

> Com `GUILD_ID` preenchido os comandos aparecem na hora. Sem ele, são globais e podem levar até 1 hora.

## Passo 6 — Rodar

Primeira vez (registra os comandos):

```powershell
npm install
npm run deploy
```

No dia a dia:

- **`ligar.bat`** — liga o bot em segundo plano (sem janela) e mostra o log.
- **`parar.bat`** — desliga o bot.

Se aparecer `[ONLINE] Logado como SeuBot#1234`, funcionou.

O que acontece fica salvo em `bot.log` (e os erros em `bot.err.log`).

> O bot só fica online enquanto o processo está rodando. Ao reiniciar o PC ele **não** volta sozinho — veja "Deixar ligado 24h" abaixo.

---

## Comandos

| Comando | O que faz | Permissão |
|---|---|---|
| `/ping` | Mostra a latência | todos |
| `/help` | Lista os comandos | todos |
| `/limpar <quantidade>` | Apaga mensagens do canal (1 a 100) | Gerenciar Mensagens |
| `/timeout <membro> <minutos> [motivo]` | Silencia um membro | Moderar Membros |

---

## Estrutura

```
bot-discord/
├─ ligar.bat              liga o bot em segundo plano
├─ parar.bat              desliga o bot
├─ .env.example           modelo de configuração
├─ src/
│  ├─ index.js            liga o bot, carrega comandos e eventos
│  ├─ config.js           lê o .env
│  ├─ deploy-commands.js  registra os slash commands no Discord
│  ├─ commands/           um arquivo por comando
│  └─ events/             ready, interactionCreate, entrar/sair
└─ README.md
```

## Adicionar um comando novo

1. Crie `src/commands/meucomando.js`:

```js
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('meucomando')
    .setDescription('Testando um comando novo.'),

  async execute(interaction) {
    await interaction.reply('Funciona!');
  },
};
```

2. Rode `npm run deploy` e reinicie o bot.

O `index.js` carrega tudo que estiver em `src/commands/` — não precisa registrar em lugar nenhum.

---

## Problemas comuns

| Mensagem | Causa / solução |
|---|---|
| `Faltam variaveis no arquivo .env` | O `.env` não existe ou está sem `DISCORD_TOKEN` / `CLIENT_ID`. |
| `An invalid token was provided` | Token errado ou já resetado. Copie de novo. |
| `Used disallowed intents` | Ligue o **SERVER MEMBERS INTENT** no portal (Passo 3). |
| Comando não aparece | Faltou `npm run deploy` ou o bot foi convidado sem o escopo `applications.commands`. |
| `/limpar` não apaga | O bot precisa de **Gerenciar Mensagens** e não consegue apagar mensagens com mais de 14 dias. |

---

## Deixar ligado 24h

`ligar.bat` resolve enquanto o PC estiver ligado. Para não depender do PC:

- **Iniciar junto com o Windows**: crie uma Tarefa Agendada apontando para `ligar.bat` no logon.
- **Hospedar na nuvem** (Railway, Fly.io, Discloud, VPS): suba o repositório, defina as variáveis do `.env` no painel do serviço e o comando de start `npm start`. Aí o bot fica online mesmo com o PC desligado.
