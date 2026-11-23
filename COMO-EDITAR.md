# Site VINZZI — como editar

## Ver o site
Dê dois cliques em **index.html**. Ele abre no navegador, sem instalar nada.

## Onde mudar as coisas
Quase tudo fica em um arquivo só: **js/config.js**. Abra com o Bloco de Notas (ou VS Code) e mude só o que está entre aspas.

| O que mudar | Onde, em `js/config.js` |
|---|---|
| Número do WhatsApp | `contato.whatsapp`. Só números, com 55 + DDD. Ex.: `"5511987654321"` |
| Instagram e e-mail | `contato.instagram`, `contato.instagramUsuario`, `contato.email` |
| Mensagens que abrem no WhatsApp | `mensagens` (a do beat usa `{nome}` e `{preco}` automaticamente) |
| Beats do catálogo | `beats` (um beat por linha) |
| Trabalhos do portfólio (player do Spotify) | `trabalhos`: copie uma linha e cole o link da música em `spotify: "..."`. No Spotify: 3 pontinhos → Compartilhar → Copiar link da música |
| Preços dos serviços | `servicos`, campo `preco` (troque `"R$ [VALOR]"`) |
| Depoimentos | `depoimentos` (só depoimentos reais, com autorização) |
| Respostas do FAQ | `faq` (preencha o que está entre [colchetes]) |
| Fotos da seção Sobre | `sobreFotos` |
| Lançamento em destaque (topo) | `destaque` |

## Adicionar um beat novo
1. Coloque a prévia em MP3 na pasta **audio/** (ex.: `audio/noite.mp3`). Trechos curtos (30 a 60 s) carregam mais rápido.
2. Coloque a capa quadrada na pasta **img/** (ex.: `img/noite.jpg`, 800×800 px, JPG ou WEBP).
3. Copie uma linha da lista `beats` e mude os dados:

```js
{ codigo: "007", nome: "Noite", estilo: "Trap", bpm: 140, tom: "Am", preco: 150, data: "2026-12-01", capa: "img/noite.jpg", audio: "audio/noite.mp3" },
```

- **estilo**: `Trap`, `Drill`, `Boom Bap` ou `R&B` entram nesses filtros. Qualquer outro estilo vai para "Outros estilos".
- **preco**: só o número (`150` ou `149.90`).
- **data**: usada em "Mais recentes" (formato ano-mês-dia).
- Sem `demo: true`, o selo "DEMO" some. Quando todos os beats forem reais, o aviso de demonstração some sozinho.

## Antes de publicar
- [ ] Trocar o número do WhatsApp (hoje é `5500000000000`, que não funciona).
- [ ] Apagar os 6 beats de demonstração e os áudios `audio/demo-*.mp3`.
- [ ] Trocar os trabalhos `[Nome da música]` pelos reais.
- [ ] Trocar os depoimentos de exemplo pelos reais (ou apagar a lista).
- [ ] Preencher os preços dos serviços e as respostas do FAQ.
- [ ] Conferir Instagram e e-mail.

## Publicar
A pasta inteira (`index.html`, `css/`, `js/`, `audio/`, `img/`) pode ir para qualquer hospedagem de site estático: Netlify, Vercel, GitHub Pages ou a hospedagem que você já usa. O arquivo `.serve.mjs` serve só para testar no computador e não precisa ir junto.
