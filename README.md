# Saioro — bot multiuso de Discord

Bot em JavaScript (Node.js + discord.js v14) com comandos de utilidade, moderação, diversão, sorteios, enquetes e lembretes. Projeto **independente**: não depende de nenhuma outra pasta ou projeto.

Dados ficam em SQLite (`dados/bot.db`), então advertências, configurações, sorteios e lembretes sobrevivem a reinícios.

---

## Comandos

### 🧰 Utilidade
| Comando | O que faz |
|---|---|
| `/ping` | Latência de resposta, WebSocket e tempo online |
| `/help [comando]` | Painel com menu de categorias; com o nome, mostra os detalhes |
| `/serverinfo` | Dono, criação, membros, canais, cargos, boosts, verificação |
| `/userinfo [membro]` | Conta, entrada no servidor, cargos, apelido |
| `/avatar [membro]` | Avatar em 1024px (e banner) |
| `/botinfo` | Servidores, usuários, memória, versões, uptime |

### 🛡️ Moderação
| Comando | O que faz |
|---|---|
| `/ban <membro> [motivo] [apagar]` | Bane, avisa no privado e registra |
| `/unban <id> [motivo]` | Remove banimento |
| `/kick <membro> [motivo]` | Expulsa |
| `/timeout <membro> <minutos> [motivo]` | Castigo (0 = remover) |
| `/warn <membro> <motivo>` | Advertência com registro numerado |
| `/warns <membro>` | Histórico de advertências |
| `/delwarn <id>` | Apaga uma advertência |
| `/slowmode <segundos> [canal]` | Modo lento |
| `/lock [canal] [motivo]` | Tranca o canal para @everyone |
| `/unlock [canal]` | Destranca |
| `/limpar <quantidade> [usuario]` | Apaga até 100 mensagens (de todos ou de uma pessoa) |

### 🎉 Social
| Comando | O que faz |
|---|---|
| `/sorteio <prêmio> <tempo> [vencedores]` | Botão **Participar**, contador e sorteio automático |
| `/enquete <pergunta> <opções>` | Votação por botões com barra de resultado |
| `/lembrete criar / listar / cancelar` | Lembretes pessoais (`30s`, `10m`, `2h`, `1d`) |

### 🎲 Diversão
| Comando | O que faz |
|---|---|
| `/dado [lados] [quantidade]` | Rola dados (até 10d1000) |
| `/moeda` | Cara ou coroa |
| `/ship <pessoa1> [pessoa2]` | Compatibilidade (resultado estável para o mesmo par) |
| `/bola8 <pergunta>` | Bola 8 |
| `/escolha <opções>` | Sorteia entre opções separadas por `\|` |

### ⚙️ Configuração
`/config` (só quem tem **Gerenciar Servidor**):

| Subcomando | O que faz |
|---|---|
| `ver` | Mostra a configuração atual |
| `boas-vindas <canal>` | Canal de boas-vindas |
| `despedida <canal>` | Canal de despedida |
| `logs <canal>` | Canal de auditoria |
| `cargo-auto <cargo>` | Cargo dado automaticamente ao entrar |
| `desativar <opção>` | Desliga uma das configurações |

O que vai para o canal de logs: mensagem **apagada** (com autor e quem apagou, se tiver permissão de auditoria), mensagem **editada** (antes/depois), **entrada/saída** de membros e **punições**.

---

## Primeira vez

Já está configurado neste PC. Se for montar do zero:

```powershell
npm install
Copy-Item .env.example .env   # preencha DISCORD_TOKEN, CLIENT_ID e GUILD_ID
npm run deploy                # registra os slash commands
```

Depois: **`ligar.bat`** liga (segundo plano) e **`parar.bat`** desliga. O bot também sobe sozinho no logon do Windows (atalho na pasta Inicialização).

### `.env`

| Variável | Uso |
|---|---|
| `DISCORD_TOKEN` | Token do bot (obrigatório) |
| `CLIENT_ID` | Application ID (obrigatório) |
| `GUILD_ID` | ID do servidor — comandos aparecem na hora (recomendado) |
| `WELCOME_CHANNEL_ID` | Boas-vindas sem usar `/config` (opcional) |
| `GOODBYE_CHANNEL_ID` | Despedida sem usar `/config` (opcional) |

---

## Intents e permissões

No portal do Discord, aba **Bot** → **Privileged Gateway Intents**:

- ✅ **SERVER MEMBERS INTENT** — obrigatório (boas-vindas, cargo automático, logs de entrada/saída).
- ⬜ **MESSAGE CONTENT INTENT** — opcional. Sem ele, o log de mensagem apagada mostra "_conteúdo indisponível_" (o Discord não envia o texto). Ligando, o conteúdo aparece.

Permissões que o bot precisa (já vêm no link de convite):

- Ver canais, Enviar mensagens, Inserir links, Ler histórico
- Gerenciar mensagens (limpar, logs)
- Gerenciar canais (lock, slowmode)
- Gerenciar cargos (cargo automático)
- Moderar membros, Banir, Expulsar
- Ver registro de auditoria (para saber *quem* apagou uma mensagem)

---

## Estrutura

```
bot-discord/
├─ ligar.bat / parar.bat       controlar o bot
├─ scripts/iniciar-oculto.ps1  lançador do logon do Windows
├─ dados/bot.db                banco SQLite (não vai para o Git)
├─ src/
│  ├─ index.js                 loader (comandos por categoria + eventos)
│  ├─ db.js                    schema do SQLite
│  ├─ deploy-commands.js       registro dos slash commands
│  ├─ commands/
│  │  ├─ util/                 ping, help, serverinfo, userinfo, avatar, botinfo
│  │  ├─ mod/                  ban, unban, kick, timeout, warn, warns, delwarn, slowmode, lock, unlock, limpar
│  │  ├─ social/               sorteio, enquete, lembrete
│  │  ├─ fun/                  dado, moeda, ship, bola8, escolha
│  │  └─ config/               config
│  ├─ events/                  ready, interactionCreate, membros, mensagens
│  └─ lib/                     banco, embeds, tempo, permissões, lógica
└─ README.md
```

## Adicionar um comando

1. Crie o arquivo na categoria certa, por exemplo `src/commands/util/meucomando.js`:

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

A categoria vem da pasta — o `/help` já organiza sozinho.

---

## Problemas comuns

| Sintoma | Causa / solução |
|---|---|
| `Cannot find module 'node:sqlite'` | Node antigo. Precisa de **Node 22.5+** (aqui é 24). |
| Comando não aparece | Rode `npm run deploy` e reinicie. Confira o `GUILD_ID`. |
| `Used disallowed intents` | Ligue o **SERVER MEMBERS INTENT** no portal. |
| `/lock` ou `/slowmode` falham | O bot precisa de **Gerenciar Canais** no canal. |
| `/ban` falha | Cargo do bot precisa estar **acima** do cargo do alvo. |
| Log sem conteúdo | Ligue o **MESSAGE CONTENT INTENT** (opcional). |
| `Não consegui apagar` | Mensagens com mais de 14 dias o Discord não deixa apagar em massa. |

---

## Deixar ligado 24h

Já configurado: atalho em `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Bot Discord.vbs`, que roda `scripts/iniciar-oculto.ps1` sem janela e sem abrir duas cópias.

Isso vale enquanto o PC estiver ligado. Para 24h de verdade, hospede na nuvem (Railway, Fly.io, Discloud, VPS): suba o repositório, defina as variáveis do `.env` no painel e use `npm start`. Nesse caso, troque o SQLite por um volume persistente, senão os dados somem a cada deploy.
