// GET /api/ml/teste?key=ADMIN_KEY[&q=termo]
// Diagnóstico: testa quais buscas da API do Mercado Livre funcionam com o nosso token.
import { tokenValido, mlGet, faltando, chaveAdminValida, json, texto } from "../../../lib/ml.js";

function resumoItens(lista) {
  return (lista || []).slice(0, 3).map((x) => ({
    id: x.id,
    nome: x.title || x.name,
    preco: x.price ?? (x.buy_box_winner && x.buy_box_winner.price) ?? null,
    link: x.permalink || null,
  }));
}

export async function onRequestGet({ request, env }) {
  const f = faltando(env);
  if (f.length) return texto("Configuração incompleta no Cloudflare: " + f.join(", "), 500);

  const url = new URL(request.url);
  if (!(await chaveAdminValida(env, url.searchParams.get("key")))) return texto("Não autorizado.", 401);

  let token;
  try { token = await tokenValido(env); } catch (e) { return json({ ok: false, erro: e.message }, 502); }
  if (!token) return json({ ok: false, erro: "Nenhuma conta do ML conectada. Abra /api/ml/login?key=... primeiro." }, 400);

  const q = (url.searchParams.get("q") || "red dot airsoft").slice(0, 80);
  const enc = encodeURIComponent(q);

  const testes = {
    conta: "/users/me",
    busca_catalogo: "/products/search?status=active&site_id=MLB&q=" + enc,
    busca_anuncios: "/sites/MLB/search?q=" + enc + "&limit=3",
  };

  const resultado = { termo: q };
  for (const [nome, caminho] of Object.entries(testes)) {
    const r = await mlGet(token, caminho);
    const d = r.dados || {};
    resultado[nome] = {
      status: r.status,
      funciona: r.status === 200,
      ...(nome === "conta" ? { apelido: d.nickname || null } : { total: d.paging ? d.paging.total : null, exemplos: resumoItens(d.results) }),
      ...(r.status !== 200 ? { erro: d.message || d.error || null } : {}),
    };
  }

  // Se a busca de catálogo funcionou, testa também o preço dos anúncios do primeiro produto
  const prim = resultado.busca_catalogo.exemplos && resultado.busca_catalogo.exemplos[0];
  if (prim && prim.id) {
    const r = await mlGet(token, "/products/" + encodeURIComponent(prim.id) + "/items");
    const d = r.dados || {};
    resultado.precos_do_produto = {
      status: r.status,
      funciona: r.status === 200,
      ofertas: (d.results || []).slice(0, 3).map((x) => ({ preco: x.price, vendedor: x.seller_id, frete_gratis: !!(x.shipping && x.shipping.free_shipping) })),
      ...(r.status !== 200 ? { erro: d.message || d.error || null } : {}),
    };
  }
  return json(resultado);
}
