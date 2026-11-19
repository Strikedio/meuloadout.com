# meuloadout.com

Site self-service para operadores de airsoft montarem o próprio loadout peça por peça e verem onde comprar cada item.

**Como funciona (versão 1):**

1. O operador clica numa região da silhueta (cabeça, peito, cinto, arma principal...).
2. Escolhe a peça e, se quiser, digita a marca ou o modelo.
3. Cada peça adicionada ganha links de busca no Mercado Livre, na Amazon, na Shopee e no Google Shopping.
4. O loadout inteiro fica guardado no próprio link: o botão **Copiar link do loadout** serve para salvar ou compartilhar, sem login.

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
css/estilo.css    visual (cores, layout, celular)
js/catalogo.js    categorias e peças: edite aqui para incluir ou mudar peças
js/lojas.js       lojas pesquisadas: aqui entram depois os links de afiliado e as lojas parceiras
js/app.js         lógica (seleção, loadout, link compartilhável)
```

### Incluir uma peça

Em `js/catalogo.js`, dentro da categoria, copie uma linha e altere os valores:

```js
{ id: "novapeca", grupo: "Acessório", nome: "Nome que aparece", busca: "termo de busca nas lojas" },
```

O `id` vai dentro dos links compartilhados. Depois de publicado, não mude o `id` de uma peça existente, senão os links antigos perdem esse item.

### Trocar ou incluir uma loja

Em `js/lojas.js`, `{q}` é trocado pelo termo da peça. Para usar um link de afiliado, basta colocar o seu parâmetro de afiliado na `url`.

## Próximos passos

- [ ] Publicar (Cloudflare Pages, Vercel ou GitHub Pages) e apontar o domínio meuloadout.com
- [ ] Links de afiliado e lojas parceiras
- [ ] Busca automática de produtos e preços nas lojas (precisa de um pequeno servidor/API)
- [ ] Filtros pelos atributos de cada peça (já listados em `catalogo.js`)
- [ ] Manequim 3D que gira para ver as peças no corpo
