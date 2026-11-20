// GET /api/ofertas?id=ID_DO_PRODUTO
// Devolve as melhores ofertas encontradas nas lojas com API (AliExpress, Shopee) para uma peça do catálogo.
// Resposta: { ativo: bool, ofertas: [{ loja, titulo, valor, link, importado }], atualizado: "ISO" }
import { json } from "../../../lib/ml.js";
import { aliAtivo, shopeeAtivo, buscarAliExpress, buscarShopee, termosDoCatalogo } from "../../../lib/ofertas.js";

const VERSAO = "v1";
const CACHE_OK = 6 * 60 * 60;   // 6 horas
const CACHE_ERRO = 30 * 60;     // 30 minutos quando a loja falhar (não insiste toda hora)

export async function onRequestGet({ request, env }) {
  const lojas = [];
  if (aliAtivo(env)) lojas.push(["aliexpress", buscarAliExpress]);
  if (shopeeAtivo(env)) lojas.push(["shopee", buscarShopee]);
  if (!lojas.length || !env.ML_KV) return json({ ativo: false, ofertas: [] }, 200, { "Cache-Control": "public, max-age=600" });

  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[a-z0-9-]{1,40}$/i.test(id)) return json({ erro: "id inválido" }, 400);

  let termo;
  try { termo = (await termosDoCatalogo(env, request)).get(id); } catch (e) { return json({ erro: "catálogo indisponível" }, 503); }
  if (!termo) return json({ erro: "produto não encontrado" }, 404);

  const ofertas = [];
  let atualizado = null;
  await Promise.all(lojas.map(async ([nome, buscar]) => {
    const chave = "of:" + VERSAO + ":" + nome + ":" + id;
    let salvo = await env.ML_KV.get(chave, "json");
    if (!salvo) {
      try {
        salvo = { ofertas: await buscar(env, termo, 3), quando: new Date().toISOString() };
        await env.ML_KV.put(chave, JSON.stringify(salvo), { expirationTtl: CACHE_OK });
      } catch (e) {
        salvo = { ofertas: [], quando: new Date().toISOString(), falhou: true };
        await env.ML_KV.put(chave, JSON.stringify(salvo), { expirationTtl: CACHE_ERRO });
      }
    }
    ofertas.push(...salvo.ofertas);
    if (!atualizado || salvo.quando < atualizado) atualizado = salvo.quando;
  }));

  ofertas.sort((a, b) => a.valor - b.valor);
  return json({ ativo: true, ofertas, atualizado }, 200, { "Cache-Control": "public, max-age=1800" });
}
