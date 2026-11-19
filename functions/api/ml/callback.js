// GET /api/ml/callback?code=...&state=...
// O Mercado Livre devolve o operador para cá depois do login. Troca o código por um token e guarda no KV.
import { trocarCodigo, faltando, texto } from "../../../lib/ml.js";

export async function onRequestGet({ request, env }) {
  const f = faltando(env);
  if (f.length) return texto("Configuração incompleta no Cloudflare: " + f.join(", "), 500);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !/^[a-f0-9]{48}$/.test(state)) return texto("Requisição inválida.", 400);

  // O state precisa ter sido criado pelo /api/ml/login nos últimos 10 minutos, e só vale uma vez
  const chave = "ml_state:" + state;
  if (!(await env.ML_KV.get(chave))) return texto("Login expirado ou inválido. Comece de novo pelo /api/ml/login.", 400);
  await env.ML_KV.delete(chave);

  try {
    await trocarCodigo(env, code);
  } catch (e) {
    return texto(e.message, 502);
  }
  return texto("Conta do Mercado Livre conectada ao meuloadout.com. Pode fechar esta aba.");
}
