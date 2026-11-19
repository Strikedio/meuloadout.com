// GET /api/ml/login?key=ADMIN_KEY
// Só o administrador (quem tem a ADMIN_KEY) consegue ligar a conta do Mercado Livre ao site.
import { ML_AUTH, redirectUri, faltando, chaveAdminValida, aleatorio, texto } from "../../../lib/ml.js";

export async function onRequestGet({ request, env }) {
  const f = faltando(env);
  if (f.length) return texto("Configuração incompleta no Cloudflare: " + f.join(", "), 500);

  const url = new URL(request.url);
  if (!(await chaveAdminValida(env, url.searchParams.get("key")))) return texto("Não autorizado.", 401);

  // "state" aleatório e de uso único, válido por 10 minutos (protege contra login forjado)
  const state = aleatorio();
  await env.ML_KV.put("ml_state:" + state, "1", { expirationTtl: 600 });

  const destino = new URL(ML_AUTH);
  destino.searchParams.set("response_type", "code");
  destino.searchParams.set("client_id", env.ML_CLIENT_ID);
  destino.searchParams.set("redirect_uri", redirectUri(env));
  destino.searchParams.set("state", state);
  return Response.redirect(destino.toString(), 302);
}
