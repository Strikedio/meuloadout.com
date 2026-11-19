# meuloadout.com

Site self-service para operadores de airsoft montarem o próprio loadout peça por peça e verem onde comprar cada item.

**Como funciona (versão 2), no estilo do meupc.net:**

1. A montagem é uma tabela com uma linha para cada vaga: arma principal, mira, magazines, bateria, pistola, colete, luvas etc. A silhueta serve de atalho para cada região.
2. Cada vaga abre a lista de produtos, com filtros (marca, plataforma, sistema...), busca e ordenação por coluna.
3. O site confere a **compatibilidade** com o que já foi escolhido. Ex.: depois de escolher uma AK, os magazines de M4 somem da lista; bateria em arma de mola dá erro; red dot em arma sem trilho dá aviso.
4. Cada peça escolhida tem links de busca no Mercado Livre, na Amazon, na Shopee e no Google Shopping.
5. Se a peça não estiver na lista, o operador digita a peça.
6. O loadout inteiro fica guardado no próprio link: o botão **Copiar link do loadout** serve para salvar ou compartilhar, sem login.

## Rodar no seu PC (Windows)

Não precisa instalar nada além do que você já tem.

**Opção A, mais rápida:** dê dois cliques em `index.html`. O site abre no navegador.

**Opção B, recomendada para desenvolver (atualiza sozinho ao salvar):**

1. No VS Code, abra a pasta do projeto (`Arquivo > Abrir Pasta...`).
2. Instale a extensão **Live Server** (de Ritwick Dey).
3. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.

## Estrutura

```
index.html        página única do site
_headers          cabeçalhos de segurança (Cloudflare Pages / Netlify)
SECURITY.md       como reportar falhas e regras de segurança do projeto
css/estilo.css    visual (cores, layout, celular)
js/catalogo.js    categorias e peças: edite aqui para incluir ou mudar peças
js/lojas.js       lojas pesquisadas: aqui entram depois os links de afiliado e as lojas parceiras
js/app.js         lógica (seleção, loadout, link compartilhável)
```

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
- [ ] Preços dentro do site (comparação entre lojas, como o meupc.net)
- [ ] Manequim 3D que gira para ver as peças no corpo
