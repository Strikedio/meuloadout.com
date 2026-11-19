/*
 * Preços de referência do Meu Loadout
 * ===================================
 * Preencha aqui o preço que você encontrou numa loja brasileira para cada produto do catálogo.
 * A chave é o "id" do produto (veja em js/catalogo.js). Exemplo:
 *
 *   "sa-e05": { valor: 1899.90, loja: "Nome da Loja", data: "2026-11-19", link: "https://www.loja.com.br/produto" },
 *
 *   valor -> número com PONTO nos centavos (1899.90), sem "R$" e sem ponto de milhar
 *   loja  -> nome curto da loja
 *   data  -> dia em que você consultou o preço, no formato ANO-MÊS-DIA
 *   link  -> opcional; endereço da oferta (precisa começar com https://). Pode ser link de afiliado.
 *
 * O site mostra a data da consulta. Preços com mais de 45 dias aparecem com o aviso "pode ter mudado".
 * Produto sem preço aqui continua aparecendo normalmente, só sem valor.
 * Quando a API do Mercado Livre funcionar, ela vai complementar/substituir estes valores.
 */
window.MEULOADOUT_PRECOS = {
  itens: {
    // "id-do-produto": { valor: 0.00, loja: "", data: "2026-11-19", link: "https://..." },
  }
};
