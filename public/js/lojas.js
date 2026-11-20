/*
 * Lojas onde o site pesquisa cada peça.
 * -------------------------------------
 * "url" é o endereço de busca da loja; {q} é trocado pelo termo da peça.
 * Quando você fechar parceria ou conseguir link de afiliado, é só trocar a url aqui
 * (ex.: acrescentar seu código de afiliado) ou incluir uma loja parceira nova.
 *
 * "formato":
 *   "query" -> o termo entra codificado normalmente (espaços viram %20)
 *   "hifen" -> espaços viram hífen (padrão do Mercado Livre)
 */
window.MEULOADOUT_LOJAS = [
  { id: "mercadolivre", nome: "Mercado Livre", url: "https://lista.mercadolivre.com.br/{q}", formato: "hifen" },
  { id: "amazon", nome: "Amazon", url: "https://www.amazon.com.br/s?k={q}", formato: "query" },
  { id: "aliexpress", nome: "AliExpress", url: "https://pt.aliexpress.com/w/wholesale-{q}.html", formato: "hifen" },
  { id: "shopee", nome: "Shopee", url: "https://shopee.com.br/search?keyword={q}", formato: "query" },
  { id: "google", nome: "Google Shopping", url: "https://www.google.com/search?tbm=shop&q={q}", formato: "query" }
];
