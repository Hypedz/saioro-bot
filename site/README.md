# Site de apresentação do Saioro

Site estático (HTML + CSS + JS puro), sem build e sem dependências. Os 63 comandos listados
foram extraídos do próprio código do bot.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Página única: apresentação, recursos, lista de comandos, como começar e dúvidas |
| `styles.css` | Tema escuro, responsivo, sem fontes ou bibliotecas externas |
| `script.js` | Busca e filtro por categoria na lista de comandos |
| `assets/avatar.png` | Avatar oficial do bot (baixado do CDN do Discord) |

## Ver localmente

Basta abrir `index.html` no navegador. Para simular um servidor:

```bash
npx serve site
```

## Publicar

Qualquer hospedagem estática funciona. Opções gratuitas:

1. **GitHub Pages** — envie a pasta `site/` para um repositório e ative Pages na branch principal,
   com a pasta `/site` como origem.
2. **Netlify Drop** — arraste a pasta `site/` em <https://app.netlify.com/drop>.
3. **Cloudflare Pages** — conecte o repositório e use `site` como diretório de saída.

## Antes de publicar

- **Link de convite:** aparece 3 vezes em `index.html` e usa
  `client_id=1562002253450182666` com `permissions=1520821595222`. Se o bot mudar de
  aplicação ou de permissões, atualize as três ocorrências.
- **og:image:** para o cartão de compartilhamento funcionar, troque `assets/avatar.png`
  pela URL absoluta da imagem depois de publicar (ex.: `https://seusite.com/assets/avatar.png`).
- **Privacidade e Termos:** o site não inclui essas páginas. Elas são exigidas pelo Discord
  para verificação do app e listagem pública; crie-as antes de solicitar a verificação.

## Manter a lista de comandos atualizada

A lista foi gerada a partir de `src/commands`. Ao adicionar ou renomear comandos, atualize as
seções `data-categoria` em `index.html` e as contagens (63 no topo e nos filtros).
