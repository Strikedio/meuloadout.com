/*
 * Ofertas automáticas de lojas com API de afiliados (roda no servidor, nas Funções do Cloudflare Pages).
 *
 * Variáveis configuradas no painel do Cloudflare (NUNCA no código):
 *   AliExpress (portals.aliexpress.com + open.aliexpress.com)
 *     ALI_APP_KEY      -> App Key do app no Open Platform (tipo "Text")
 *     ALI_APP_SECRET   -> App Secret (tipo "Secret")
 *     ALI_TRACKING_ID  -> Tracking ID do portal de afiliados (tipo "Text"); sem ele o link sai sem comissão
 *   Shopee (affiliate.shopee.com.br -> Open API)
 *     SHOPEE_APP_ID    -> App ID (tipo "Text")
 *     SHOPEE_SECRET    -> Secret (tipo "Secret")
 * Ligação (binding) KV: ML_KV (a mesma do Mercado Livre) guarda as ofertas em cache.
 *
 * Enquanto as chaves de uma loja não estiverem cadastradas, ela simplesmente fica desligada.
 */

const enc = new TextEncoder();
const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

async function hmacSha256(segredo, msg) {
  const chave = await crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", chave, enc.encode(msg)));
}
async function sha256(msg) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(msg)));
}

// Só aceita links https de domínios da própria loja (evita mandar o visitante para um site estranho)
function linkDaLoja(u, dominios) {
  try {
    const x = new URL(u);
    if (x.protocol !== "https:") return null;
    const h = x.hostname.toLowerCase();
    return dominios.some((d) => h === d || h.endsWith("." + d)) ? x.href : null;
  } catch (e) {
    return null;
  }
}
const numero = (v) => {
  const n = typeof v === "number" ? v : parseFloat(String(v || "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};
const textoCurto = (s, max = 120) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);

/* ------------------------------------------------------------------ AliExpress */
const ALI_GATEWAY = "https://api-sg.aliexpress.com/sync";
export const aliAtivo = (env) => !!(env.ALI_APP_KEY && env.ALI_APP_SECRET);

// Assinatura do Open Platform: parâmetros em ordem alfabética, "chavevalor" colados, HMAC-SHA256 em maiúsculas
async function aliChamar(env, metodo, params) {
  const p = {
    app_key: env.ALI_APP_KEY,
    method: metodo,
    sign_method: "sha256",
    timestamp: String(Date.now()),
    v: "2.0",
    format: "json",
    ...params,
  };
  const base = Object.keys(p).sort().map((k) => k + p[k]).join("");
  p.sign = (await hmacSha256(env.ALI_APP_SECRET, base)).toUpperCase();
  const r = await fetch(ALI_GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8", Accept: "application/json" },
    body: new URLSearchParams(p),
  });
  const dados = await r.json().catch(() => null);
  return { status: r.status, dados };
}

export async function buscarAliExpress(env, termo, limite = 3) {
  const params = {
    keywords: termo,
    target_currency: "BRL",
    target_language: "PT",
    ship_to_country: "BR",
    page_no: "1",
    page_size: String(limite),
    fields: "product_title,target_sale_price,target_sale_price_currency,promotion_link,product_detail_url,shop_name",
  };
  if (env.ALI_TRACKING_ID) params.tracking_id = env.ALI_TRACKING_ID;
  const { status, dados } = await aliChamar(env, "aliexpress.affiliate.product.query", params);
  const resp = dados && dados.aliexpress_affiliate_product_query_response;
  const rr = resp && resp.resp_result;
  if (status !== 200 || !rr || String(rr.resp_code) !== "200") {
    const msg = (dados && dados.error_response && (dados.error_response.msg || dados.error_response.code)) || (rr && rr.resp_msg) || "sem resposta";
    throw new Error("AliExpress HTTP " + status + ": " + textoCurto(msg, 160));
  }
  const lista = (rr.result && rr.result.products && rr.result.products.product) || [];
  return lista.map((x) => ({
    loja: "AliExpress",
    titulo: textoCurto(x.product_title),
    valor: x.target_sale_price_currency === "BRL" ? numero(x.target_sale_price) : null,
    link: linkDaLoja(x.promotion_link || x.product_detail_url, ["aliexpress.com", "aliexpress.us"]),
    importado: true,
  })).filter((o) => o.valor && o.link).slice(0, limite);
}

/* ------------------------------------------------------------------ Shopee */
const SHOPEE_GRAPHQL = "https://open-api.affiliate.shopee.com.br/graphql";
export const shopeeAtivo = (env) => !!(env.SHOPEE_APP_ID && env.SHOPEE_SECRET);

// Assinatura: SHA256(AppId + Timestamp + corpo + Secret), timestamp em segundos
async function shopeeChamar(env, query, variables) {
  const corpo = JSON.stringify({ query, variables });
  const ts = String(Math.floor(Date.now() / 1000));
  const assinatura = await sha256(env.SHOPEE_APP_ID + ts + corpo + env.SHOPEE_SECRET);
  const r = await fetch(SHOPEE_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "SHA256 Credential=" + env.SHOPEE_APP_ID + ", Timestamp=" + ts + ", Signature=" + assinatura,
    },
    body: corpo,
  });
  const dados = await r.json().catch(() => null);
  return { status: r.status, dados };
}

export async function buscarShopee(env, termo, limite = 3) {
  const query = `query($q:String,$n:Int){productOfferV2(keyword:$q,limit:$n,page:1,sortType:1){nodes{productName price priceMin offerLink productLink shopName}}}`;
  const { status, dados } = await shopeeChamar(env, query, { q: termo, n: limite });
  if (status !== 200 || !dados || (dados.errors && dados.errors.length)) {
    const e = dados && dados.errors && dados.errors[0];
    const msg = e ? (e.message || "") + (e.extensions && e.extensions.code ? " (" + e.extensions.code + ")" : "") : "sem resposta";
    throw new Error("Shopee HTTP " + status + ": " + textoCurto(msg, 160));
  }
  const nos = (dados.data && dados.data.productOfferV2 && dados.data.productOfferV2.nodes) || [];
  return nos.map((x) => ({
    loja: "Shopee",
    titulo: textoCurto(x.productName),
    valor: numero(x.priceMin) || numero(x.price),
    link: linkDaLoja(x.offerLink || x.productLink, ["shopee.com.br"]),
    importado: false,
  })).filter((o) => o.valor && o.link).slice(0, limite);
}

/* ------------------------------------------------------------------ Termos do catálogo */
// O servidor só pesquisa termos que existem no catálogo do site. Assim ninguém consegue
// usar a nossa conta de afiliado para buscar qualquer coisa e gastar a cota das APIs.
let termosEmMemoria = null;
export async function termosDoCatalogo(env, request) {
  if (termosEmMemoria && termosEmMemoria.ate > Date.now()) return termosEmMemoria.mapa;
  const r = await env.ASSETS.fetch(new URL("/js/catalogo.js", request.url));
  if (!r.ok) throw new Error("catálogo indisponível");
  const fonte = await r.text();
  const str = '"((?:[^"\\\\]|\\\\.)*)"';
  const reP = new RegExp("\\bP\\(\\s*" + str + "\\s*,\\s*" + str + "\\s*,\\s*" + str, "g");
  const reBusca = new RegExp("busca:\\s*" + str);
  const mapa = new Map();
  for (const linha of fonte.split("\n")) {
    reP.lastIndex = 0;
    const m = reP.exec(linha);
    if (!m) continue;
    const ler = (s) => { try { return JSON.parse('"' + s + '"'); } catch (e) { return s; } };
    const b = reBusca.exec(linha);
    mapa.set(ler(m[2]), textoCurto(b ? ler(b[1]) : ler(m[3]), 80));
  }
  termosEmMemoria = { mapa, ate: Date.now() + 10 * 60 * 1000 };
  return mapa;
}
