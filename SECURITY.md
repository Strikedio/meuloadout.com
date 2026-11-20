# Segurança

## Como reportar uma vulnerabilidade

Encontrou uma falha de segurança no meuloadout.com? **Não abra uma issue pública.**

Use o reporte privado do GitHub: aba **Security** deste repositório → **Report a vulnerability**.
A mensagem chega só para o mantenedor. Responderemos assim que possível.

## Como o site é protegido

- Site 100% estático: não há servidor, banco de dados, login nem senhas.
- O loadout fica no próprio link (depois do `#`), que não é enviado ao servidor.
- Nenhum script de terceiros: tudo é carregado do próprio domínio, e a política de segurança (CSP) bloqueia o resto.
- Todo texto digitado ou vindo de um link é exibido como texto, nunca como HTML.
- Cabeçalhos de segurança definidos em `_headers` (CSP, anti-iframe, HSTS etc.).
- As chaves das APIs (Mercado Livre, AliExpress, Shopee) ficam só nas variáveis secretas do Cloudflare. As consultas às lojas são feitas pelo servidor, e a busca pública só aceita produtos do catálogo.
- Links de ofertas só são aceitos se forem `https` e do domínio da própria loja.

## Regras para quem contribui

- Nunca coloque senhas, tokens, chaves de API ou dados pessoais no repositório. Ele é público, e o histórico do Git guarda tudo, mesmo depois de apagado.
- Chaves futuras (APIs de lojas, afiliados) ficam nas variáveis de ambiente da hospedagem, nunca no código.
- Não adicione scripts de CDNs externas sem revisar e atualizar a CSP em `_headers` e no `index.html`.
- Não use `innerHTML` com dados vindos do usuário ou do link.
