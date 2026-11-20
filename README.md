# meuloadout.com

Site self-service para operadores de airsoft montarem o próprio loadout peça por peça e verem onde comprar cada item.

**Como funciona (versão 3), com visual de inventário de jogo:**

1. No centro fica o **operador em 3D** (gira com o mouse ou o dedo; botão 2D para o desenho plano): cada peça escolhida aparece desenhada no corpo, do capacete ao coldre. A arma muda conforme o modelo (AK com madeira, M4, sniper, shotgun...), o colete conforme o tipo (plate carrier, chest rig) etc.
2. Ao lado fica o **equipamento**, uma grade de slots (capacete, óculos, arma principal, pistola, colete, cinto, coldre...). Cada slot mostra a foto do produto ou o desenho da peça.
3. Ao clicar num slot, abre a lista de produtos com filtros, busca, preço e **compatibilidade** (ex.: depois de escolher uma AK, os magazines de M4 somem).
4. Embaixo fica a **lista de compras**: avisos de compatibilidade, preço de referência, total estimado e links de busca no Mercado Livre, na Amazon, na Shopee e no Google Shopping.
5. O loadout inteiro fica no próprio link: o botão **Copiar link do loadout** salva e compartilha, sem login.

## Rodar no seu PC (Windows)

O site fica na pasta `public/`.

**Opção A, mais rápida:** dê dois cliques em `public/index.html`.

**Opção B, recomendada para desenvolver (atualiza sozinho ao salvar):** no VS Code, instale a extensão **Live Server**, clique com o botão direito em `public/index.html` e escolha **Open with Live Server**.

As rotas `/api/...` (preços do Mercado Livre) só funcionam no site publicado, porque rodam no Cloudflare.

## Estrutura

```
public/                 o site (é o que o Cloudflare publica)
  index.html            página única
  _headers              cabeçalhos de segurança
  css/estilo.css        visual
  js/catalogo.js        vagas, produtos e regras de compatibilidade
  js/lojas.js           lojas pesquisadas / links de afiliado
  js/precos.js          preços de referência (você preenche)
  js/arte.js            desenhos do personagem e das peças (SVG, modo 2D)
  js/operador3d.js      operador em 3D (three.js): pose, roupas, equipamento e armas
  modelos/              operador.glb e armas/*.glb (Quaternius, CC0) — ver CREDITOS.txt
  vendor/three/         biblioteca three.js (MIT)
  img/produtos/         fotos de produtos (opcional)
  js/app.js             lógica da página
functions/api/          rotas do servidor (Cloudflare Pages Functions)
  ml/login.js           liga a conta do Mercado Livre (só administrador)
  ml/callback.js        retorno do login do ML
  ml/teste.js           diagnóstico da API do ML (só administrador)
lib/ml.js               código compartilhado da integração com o ML
SECURITY.md             como reportar falhas e regras de segurança
```

## Fotos dos produtos

No `catalogo.js`, qualquer produto pode ganhar o campo `img`:

```js
P("oculos", "ess-crossbow", "ESS Crossbow", { ... }, { img: "img/produtos/ess-crossbow.webp" }),
```

- Arquivo dentro de `public/img/produtos/` (prefira `.webp`, cerca de 300 px de largura) **ou** endereço `https://http2.mlstatic.com/...` (imagens do Mercado Livre).
- Outros sites são bloqueados de propósito, pela regra de segurança (CSP). Para liberar um novo, inclua o host em `HOSTS_IMAGEM` no `app.js` **e** no `img-src` do `_headers` e do `index.html`.
- Use só fotos que você tem permissão de usar (suas, de loja parceira ou de fabricante que autorizou). Sem foto, o site mostra o desenho da peça.

## Preços de referência

Em `public/js/precos.js`, cada produto pode ganhar o preço que você encontrou numa loja:

```js
"sa-e05": { valor: 1899.90, loja: "Nome da Loja", data: "2026-11-19", link: "https://www.loja.com.br/produto" },
```

- A chave (`"sa-e05"`) é o `id` do produto em `catalogo.js`.
- `valor` usa ponto nos centavos e não leva ponto de milhar nem "R$".
- O site mostra o preço na lista, ordena e filtra por preço e soma o **total estimado** do loadout.
- Preços com mais de 45 dias aparecem com o aviso "pode ter mudado".
- Links que não começam com `https://` são ignorados.

## Integração com o Mercado Livre

As chaves ficam **somente** nas configurações do projeto no Cloudflare (Settings → Variables and Secrets), nunca no código:

| Nome | Tipo | O que é |
|---|---|---|
| `ML_CLIENT_ID` | Text | ID do app no portal de desenvolvedores do ML |
| `ML_CLIENT_SECRET` | **Secret** | Chave secreta do app |
| `ADMIN_KEY` | **Secret** | Senha longa (40+ caracteres) para as rotas de administração |
| `ML_KV` | Binding KV | Onde o token do ML fica guardado |

Para ligar a conta: abra `https://meuloadout.com/api/ml/login?key=SUA_ADMIN_KEY`.
Para testar: `https://meuloadout.com/api/ml/teste?key=SUA_ADMIN_KEY`.

### Incluir um produto

Em `js/catalogo.js`, na lista `produtos`, copie uma linha parecida e altere os valores:

```js
P("magRifle", "mag-m4-pmag", "Magazine M4 estilo PMAG", { plataforma: "M4", tipo: "Mid-cap" },
  { busca: "magazine pmag airsoft", req: [req("armaPrincipal", "plataforma", ["M4"])] }),
```

- 1º valor: a vaga (veja a lista `vagas` no mesmo arquivo)
- 2º valor: `id` único. Ele vai dentro dos links compartilhados, então não mude depois de publicado
- `{ ... }`: atributos, que aparecem como colunas e filtros
- `req`: regras de compatibilidade. `req("armaPrincipal", "plataforma", ["M4"])` quer dizer "só serve se a arma principal for M4". Para um aviso em vez de erro, acrescente `"aviso", "mensagem"`.

### Trocar ou incluir uma loja

Em `js/lojas.js`, `{q}` é trocado pelo termo da peça. Para usar um link de afiliado, basta colocar o seu parâmetro de afiliado na `url`.

## Próximos passos

- [ ] Publicar (Cloudflare Pages, Vercel ou GitHub Pages) e apontar o domínio meuloadout.com
- [ ] Links de afiliado e lojas parceiras
- [ ] Busca automática de produtos e preços nas lojas (precisa de um pequeno servidor/API)
- [ ] Ampliar o catálogo (mais marcas e modelos) e conferir as especificações
- [x] Preços de referência e total estimado
- [ ] Preços automáticos pela API do Mercado Livre (aguardando validação da conta no ML)
- [x] Personagem com as peças desenhadas no corpo (estilo inventário)
- [ ] Fotos dos produtos (via API do ML ou lojas parceiras)
- [x] Operador 3D que gira, com as peças no corpo
- [ ] Modelos 3D mais detalhados para o equipamento (comprados com licença para web ou encomendados)
