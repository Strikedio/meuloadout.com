// GET /api/ofertas/teste?key=ADMIN_KEY[&q=termo]
// Diagnóstico: mostra se as chaves de cada loja estão cadastradas e se a busca funciona (sem usar o cache).
import { json, texto, chaveAdminValida } from "../../../lib/ml.js";
import { aliAtivo, shopeeAtivo, buscarAliExpress, buscarShopee } from "../../../lib/ofertas.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!(await chaveAdminValida(env, url.searchParams.get("key")))) return texto("Não autorizado.", 401);
  const q = (url.searchParams.get("q") || "red dot airsoft").slice(0, 80);

  const lojas = {
    aliexpress: { ativo: aliAtivo(env), falta: ["ALI_APP_KEY", "ALI_APP_SECRET", "ALI_TRACKING_ID"].filter((k) => !env[k]), buscar: buscarAliExpress },
    shopee: { ativo: shopeeAtivo(env), falta: ["SHOPEE_APP_ID", "SHOPEE_SECRET"].filter((k) => !env[k]), buscar: buscarShopee },
  };
  const resultado = { termo: q, cache_kv: !!env.ML_KV };
  for (const [nome, l] of Object.entries(lojas)) {
    if (!l.ativo) { resultado[nome] = { ativo: false, falta: l.falta }; continue; }
    try {
      resultado[nome] = { ativo: true, funciona: true, falta: l.falta, ofertas: await l.buscar(env, q, 3) };
    } catch (e) {
      resultado[nome] = { ativo: true, funciona: false, falta: l.falta, erro: e.message };
    }
  }
  return json(resultado);
}
