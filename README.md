# Saioro — bot multiuso de Discord

Bot em JavaScript (Node.js + discord.js v14) com comandos de utilidade, moderação, diversão, sorteios, enquetes e lembretes. Projeto **independente**: não depende de nenhuma outra pasta ou projeto.

Dados ficam em SQLite (`dados/bot.db`), então advertências, configurações, sorteios e lembretes sobrevivem a reinícios.

---

## Comandos

### 🧰 Utilidade
| Comando | O que faz |
|---|---|
| `/ping` | Latência de resposta, WebSocket e tempo online |
| `/help [comando]` | Painel com menu de categorias; com o nome, mostra detalhes e subcomandos (autocomplete) |
| `/serverinfo` | Dono, criação, membros, canais, cargos, boosts, verificação |
| `/userinfo [membro]` | Conta, entrada no servidor, cargos, apelido |
| `/avatar [membro]` | Avatar em 1024px (e banner) |
| `/banner [membro]` | Banner do usuário em 1024px |
| `/servericon` | Ícone (4096px) e banner do servidor |
| `/emoji <emoji>` | Dados de um emoji (ID, animado, link) |
| `/timestamp <quando>` | Gera códigos `<t:…>` para datas |
| `/canalinfo [canal]` | Tipo, criação, tópico, modo lento, NSFW |
| `/cargos` | Lista cargos com membros e cor |
| `/snippet criar/ver/listar/apagar` | Trechos de código salvos por nome |
| `/faq ver/adicionar/remover/listar` | Perguntas frequentes: menu para membros, cadastro pela staff |
| `/status` | Uptime, ping, memória, banco, versões |
| `/botinfo` | Servidores, usuários, memória, versões, uptime |
| `/diagnostico` | Confere permissões, canais configurados, intents e o que ainda falta configurar |

### 🛡️ Moderação
| Comando | O que faz |
|---|---|
| `/ban <membro> [motivo] [apagar]` | Bane, avisa no privado e registra |
| `/unban <id> [motivo]` | Remove banimento |
| `/tempban <membro> <duração> [motivo] [apagar]` | Bane por tempo e desbane sozinho (`30m`, `2h`, `7d`) |
| `/softban <membro> [motivo] [apagar]` | Bane e desbane na hora, só para apagar as mensagens |
| `/kick <membro> [motivo]` | Expulsa |
| `/timeout <membro> <minutos> [motivo]` | Castigo (0 = remover) |
| `/warn <membro> <motivo>` | Advertência com registro numerado |
| `/warns <membro>` | Histórico de advertências |
| `/delwarn <id>` | Apaga uma advertência |
| `/slowmode <segundos> [canal]` | Modo lento |
| `/lock [canal] [motivo]` | Tranca o canal para @everyone |
| `/unlock [canal]` | Destranca |
| `/limpar <quantidade> [usuario]` | Apaga até 100 mensagens (de todos ou de uma pessoa) |
| `/nick <membro> [apelido]` | Troca/remove o apelido |
| `/punicoes [membro] [limite]` | Histórico de punições do servidor |
| `/sticky definir/remover/ver` | Mensagem que volta ao fim do canal sempre que alguém fala |
| `/automod ativar/status/desativar` | Regras nativas de AutoMod: anti-spam, menções em massa e ofensas graves, com alerta e castigo |

`/automod ativar` cria três regras **nativas** do Discord (sem ler o conteúdo das mensagens). Cargos com **Gerenciar Servidor**, **Moderar Membros** ou **Administrador** ficam isentos para a staff não ser bloqueada. O castigo padrão é de 10 minutos (`0` desliga) e exige **Moderar Membros**; sem essa permissão, as regras só bloqueiam e alertam. Só as regras criadas pelo bot são listadas e removidas — as feitas à mão no painel ficam intactas.

A badge **AutoMod** (`APPLICATION_AUTO_MODERATION_RULE_CREATE_BADGE`) **não** é concedida com uma regra: o Discord exige **100 regras de AutoMod somadas em todos os servidores**. Cada servidor aceita no máximo **10** regras (6 de palavras, 1 anti-spam, 1 preset, 1 menções e 1 perfil), então são necessários pelo menos **10 servidores** com o bot. Depois de atingir 100, a badge pode levar até **24 horas** para aparecer no perfil da aplicação — não é cargo. `/automod status` mostra se a flag já foi concedida, mas só conta as regras deste servidor.

A badge **Comandos** (`APPLICATION_COMMAND_BADGE`) exige um comando **global** — comandos de servidor não contam. Por isso o `/ping` é registrado globalmente e os outros 56 ficam no servidor, para atualizar na hora. O `/ping` não é duplicado: ele existe só no escopo global. Depois de um deploy, ele pode levar até 1 hora para reaparecer; os demais continuam imediatos.

### 🎉 Social
| Comando | O que faz |
|---|---|
| `/sorteio <prêmio> <tempo> [vencedores]` | Botão **Participar**, contador e sorteio automático |
| `/enquete <pergunta> <opções>` | Votação por botões com barra de resultado |
| `/lembrete criar / listar / cancelar` | Lembretes pessoais (`30s`, `10m`, `2h`, `1d`) |
| `/sugestao <texto> [anonimo]` | Publica com botões 👍/👎 e aprovação da staff |
| `/anuncio [canal] [mencao]` | Formulário → publica embed de anúncio |
| `/embed [canal]` | Formulário → embed personalizado (cor, imagem, rodapé) |
| `/verificar [canal]` | Painel com botão que entrega o cargo de verificação |
| `/regras <texto> [cargo] [canal]` | Publica as regras **já com o botão de verificação** no mesmo embed; se houver FAQ, inclui o botão **Ver FAQ** |
| `/evento criar/listar/cancelar` | Evento nativo do Discord (externo, voz ou palco) com lembrete opcional no canal |
| `/cargos-painel adicionar/remover/listar/publicar` | Painel de cargos que o membro escolhe clicando (staff monta, membro usa) |
| `/perfil ver/editar/campos/emblemas/remover` | Cartão personalizável: título, bio, pronomes, cor, imagem, campos e emblemas automáticos |
| `/top [categoria] [limite]` | Ranking de sugestões, sorteios ou geral, com emblemas de cada pessoa |

`/evento criar` aceita `2h`, `30m`, `25/12 20:00`, `25/12/2027 20:00` ou só `20:00` (hoje; se já passou, amanhã). Com a opção `lembrete`, o bot avisa no canal X minutos antes — além do aviso nativo para quem marcar interesse.

O `/perfil` mostra um cartão com título, bio, pronomes, cor e imagem. Em **Campos**, cada pessoa escolhe se aparecem entrada no servidor, cargos, pronomes, emblemas, sugestões enviadas e sorteios participados. Os botões de edição só aparecem para o dono do cartão.

### 🎖️ Emblemas

Automáticos, aparecem no cartão e em `/perfil emblemas` (que mostra o progresso):

| Emblema | Como ganhar |
|---|---|
| 🏛️ Fundador | Dono do bot (conta que criou a aplicação) |
| 🕰️ Veterano | 1 ano de servidor |
| 💡 Sugestor | 10 sugestões enviadas |
| 🌟 Ideia aprovada | 3 sugestões aprovadas |
| 🎟️ Participante | 5 sorteios participados |

`/top` soma sugestões e sorteios no ranking **geral** (1 ponto cada) e mostra quantos emblemas cada pessoa tem. Quem saiu do servidor não aparece.

### 🎲 Diversão
| Comando | O que faz |
|---|---|
| `/dado [lados] [quantidade]` | Rola dados (até 10d1000) |
| `/moeda` | Cara ou coroa |
| `/ship <pessoa1> [pessoa2]` | Compatibilidade (resultado estável para o mesmo par) |
| `/bola8 <pergunta>` | Bola 8 |
| `/escolha <opções>` | Sorteia entre opções separadas por `\|` |
| `/ppt <escolha>` | Pedra, papel e tesoura contra o bot |
| `/quiz` | Pergunta com 4 botões de resposta |
| `/abraco <membro>` | Abraço com GIF (API externa, com fallback) |
| `/beijo <membro>` | Beijo com GIF (API externa, com fallback) |
| `/piada` | Piada aleatória |
| `/gato` | Foto aleatória de gato (API externa, com fallback) |

### ⚙️ Configuração
`/config` (só quem tem **Gerenciar Servidor**):

| Subcomando | O que faz |
|---|---|
| `ver` | Mostra a configuração atual |
| `boas-vindas <canal>` | Canal de boas-vindas |
| `despedida <canal>` | Canal de despedida |
| `logs <canal>` | Canal de auditoria |
| `sugestoes <canal>` | Onde o `/sugestao` publica |
| `cargo-auto <cargo>` | Cargo dado automaticamente ao entrar |
| `verificar-cargo <cargo>` | Cargo entregue pelo botão do `/verificar` |
| `boas-vindas-texto <texto>` | Texto do embed (use `{membro}`, `{nome}`, `{servidor}`, `{total}`) |
| `boas-vindas-dm <texto>` | Mensagem no privado de quem entra |
| `boas-vindas-imagem <url>` | Imagem que aparece nas boas-vindas |
| `desativar <opção>` | Desliga uma das configurações |

O que vai para o canal de logs: mensagem **apagada** (com autor e quem apagou, se tiver permissão de auditoria), mensagem **editada** (antes/depois), **entrada/saída** de membros, **punições**, **voz** (entrou/saiu/mudou de canal), **cargos e apelidos** alterados, **canais criados/apagados** e **banimentos** (inclusive os feitos fora do bot).

### Textos prontos

| Arquivo | Conteúdo |
|---|---|
| [`docs/regras.md`](docs/regras.md) | Regras em tom formal, prontas para `/regras`, com versão mais rígida opcional |
| [`docs/faq.md`](docs/faq.md) | Seis perguntas iniciais com respostas formais para cadastrar em `/faq adicionar` |

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
| `GUILD_ID` | ID do servidor — os comandos ficam no servidor e aparecem na hora (o `/ping` é sempre global) |
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
- Gerenciar servidor (regras de AutoMod)
- Ver registro de auditoria (para saber *quem* apagou uma mensagem)

---

## Estrutura

```
bot-discord/
├─ ligar.bat / parar.bat       controlar o bot
├─ scripts/iniciar-oculto.ps1  lançador do logon do Windows
├─ scripts/supervisor.ps1      religa o bot se ele cair
├─ dados/bot.db                banco SQLite (não vai para o Git)
├─ dados/backups/              cópia diária do banco (7 dias)
├─ docs/                       regras.md e faq.md (textos prontos para colar)
├─ src/
│  ├─ index.js                 loader (comandos por categoria + eventos)
│  ├─ db.js                    schema do SQLite
│  ├─ deploy-commands.js       registro dos slash commands
│  ├─ commands/
│  │  ├─ util/                 ping, help, serverinfo, userinfo, avatar, botinfo, faq
│  │  ├─ mod/                  ban, unban, kick, timeout, warn, warns, delwarn, slowmode, lock, unlock, limpar, automod
│  │  ├─ social/               sorteio, enquete, lembrete, evento, regras, perfil, top
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

Por padrão o comando é registrado no servidor (efeito imediato). Para registrá-lo globalmente, adicione `global: true,` antes de `data` — é assim que o `/ping` mantém a badge de comandos. Não use o mesmo nome nos dois escopos: o deploy remove do servidor o que for global.

---

## Problemas comuns

| Sintoma | Causa / solução |
|---|---|
| `Cannot find module 'node:sqlite'` | Node antigo. Precisa de **Node 22.5+** (aqui é 24). |
| Comando não aparece | Rode `npm run deploy` e reinicie. Confira o `GUILD_ID`. O `/ping` é global e pode levar até 1 hora. |
| `Used disallowed intents` | Ligue o **SERVER MEMBERS INTENT** no portal. |
| `/lock` ou `/slowmode` falham | O bot precisa de **Gerenciar Canais** no canal. |
| `/ban` falha | Cargo do bot precisa estar **acima** do cargo do alvo. |
| `/automod` falha | Precisa de **Gerenciar Servidor**; o castigo automático também exige **Moderar Membros**. |
| Log sem conteúdo | Ligue o **MESSAGE CONTENT INTENT** (opcional). |
| `Não consegui apagar` | Mensagens com mais de 14 dias o Discord não deixa apagar em massa. |
| O bot reiniciou sozinho | O supervisor fez o trabalho dele. Veja o motivo em `bot.err.log` e `supervisor.log`. |

---

## Limitações conhecidas

- `/quiz` guarda as respostas em memória: se o bot reiniciar, os botões respondem "expirou".
- `/abraco`, `/beijo` e `/gato` dependem de APIs externas; se elas caírem, o comando responde sem GIF (ou com imagem padrão).
- `/snippet` guarda até 1900 caracteres por trecho.
- `/faq` mostra no máximo 25 perguntas por menu (limite do Discord); o restante continua salvo e aparece em `/faq listar`.
- Lembrete de `/evento` não é enviado atrasado: se o bot estava offline e o evento já começou, o aviso é descartado.
- A imagem de fundo do `/perfil` precisa ser uma URL `https://` permanente; links de anexo do Discord expiram.
- Log de mensagem apagada só mostra o texto com o **MESSAGE CONTENT INTENT** ligado.
- `/tempban` desbane em até 1 minuto depois do prazo. Se o bot estiver offline na hora, o desbanimento acontece na próxima subida.
- `/evento` interpreta datas no fuso do PC onde o bot roda (horário local).
- `/automod` usa só os gatilhos nativos do Discord (spam, menções, presets e palavras); não há filtro de links ou imagens. As regras valem para todos, menos os cargos de staff isentos.
- A badge de AutoMod exige 100 regras em todos os servidores (no máximo 10 por servidor) e pode levar até 24 horas para aparecer. Não há atalho com uma regra só.
- O `/automod ativar` cria até 3 regras por servidor; se já existir uma regra manual do mesmo tipo, ele ignora e informa, em vez de falhar.
- O `/ping` global pode ficar até 1 hora sem aparecer depois de um deploy global; isso é cache do cliente, não erro de registro.

---

## Deixar ligado 24h

Já configurado: atalho em `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Bot Discord.vbs`, que roda `scripts/iniciar-oculto.ps1` sem janela e sem abrir duas cópias.

Quem mantém o bot de pé é o **`scripts/supervisor.ps1`**: se o processo do Node cair, ele religa em 5 segundos (e espera mais se o erro se repetir muitas vezes seguidas). Tudo fica registrado em `supervisor.log`.

- `ligar.bat` → inicia o supervisor
- `parar.bat` → para o supervisor e o bot

**Backup automático:** na subida e a cada 6 horas, o bot cria uma cópia consistente do banco em `dados/backups/bot-AAAA-MM-DD.db` (uma por dia, mantendo as 7 últimas). Para restaurar, pare o bot e copie o arquivo escolhido por cima de `dados/bot.db`.

Isso vale enquanto o PC estiver ligado. Para 24h de verdade, hospede na nuvem (Railway, Fly.io, Discloud, VPS): suba o repositório, defina as variáveis do `.env` no painel e use `npm start`. Nesse caso, troque o SQLite por um volume persistente, senão os dados somem a cada deploy.
