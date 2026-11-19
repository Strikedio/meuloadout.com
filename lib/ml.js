/*
 * Integração com a API do Mercado Livre (roda no servidor, nas Funções do Cloudflare Pages).
 *
 * Variáveis configuradas no painel do Cloudflare (NUNCA no código):
 *   ML_CLIENT_ID      -> ID do app criado no portal de desenvolvedores do ML
 *   ML_CLIENT_SECRET  -> chave secreta do app (tipo "Secret"/criptografada)
 *   ADMIN_KEY         -> senha longa só sua, para as rotas de administração (tipo "Secret")
 *   ML_REDIRECT_URI   -> opcional; padrão https://meuloadout.com/api/ml/callback
 * Ligação (binding) KV:
 *   ML_KV             -> guarda o token de acesso e o estado temporário do login
 */

export const ML_API = "https://api.mercadolibre.com";
export const ML_AUTH = "https://auth.mercadolivre.com.br/authorization";
const CHAVE_TOKEN = "ml_token";

export function redirectUri(env) {
  return env.ML_REDIRECT_URI || "https://meuloadout.com/api/ml/callback";
}

// Respostas com cabeçalhos seguros (o arquivo _headers não vale para as Funções)
const CABECALHOS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};
export function json(dados, status = 200, extra = {}) {
  return new Response(JSON.stringify(dados, null, 2), {
    status,
    headers: { ...CABECALHOS, "Content-Type": "application/json; charset=utf-8", ...extra },
  });
}
export function texto(msg, status = 200) {
  return new Response(msg, { status, headers: { ...CABECALHOS, "Content-Type": "text/plain; charset=utf-8" } });
}

// Verifica se o ambiente está configurado
export function faltando(env) {
  const f = [];
  if (!env.ML_CLIENT_ID) f.push("ML_CLIENT_ID");
  if (!env.ML_CLIENT_SECRET) f.push("ML_CLIENT_SECRET");
  if (!env.ADMIN_KEY) f.push("ADMIN_KEY");
  if (!env.ML_KV) f.push("ML_KV (binding KV)");
  return f;
}

// Comparação em tempo constante (evita descobrir a senha medindo o tempo de resposta)
export async function chaveAdminValida(env, recebida) {
  if (!env.ADMIN_KEY || typeof recebida !== "string" || recebida.length < 20) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(env.ADMIN_KEY)),
    crypto.subtle.digest("SHA-256", enc.encode(recebida)),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}

export function aleatorio(bytes = 24) {
  const v = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(v, (n) => n.toString(16).padStart(2, "0")).join("");
}

async function pedirToken(env, params) {
  const corpo = new URLSearchParams({
    client_id: env.ML_CLIENT_ID,
    client_secret: env.ML_CLIENT_SECRET,
    ...params,
  });
  const r = await fetch(ML_API + "/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: corpo,
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok || !dados.access_token) {
    // Nunca devolve o corpo inteiro: pode conter dados sensíveis
    throw new Error("Falha ao obter token do ML (HTTP " + r.status + ", " + (dados.error || "erro desconhecido") + ")");
  }
  const token = {
    access_token: dados.access_token,
    refresh_token: dados.refresh_token,
    expira_em: Date.now() + (Number(dados.expires_in) || 21600) * 1000,
    user_id: dados.user_id,
  };
  await env.ML_KV.put(CHAVE_TOKEN, JSON.stringify(token));
  return token;
}

export function trocarCodigo(env, codigo) {
  return pedirToken(env, { grant_type: "authorization_code", code: codigo, redirect_uri: redirectUri(env) });
}

// Devolve um token válido, renovando quando estiver perto de vencer.
// O ML troca o refresh_token a cada renovação, por isso o novo é salvo no KV.
export async function tokenValido(env) {
  const salvo = await env.ML_KV.get(CHAVE_TOKEN, "json");
  if (!salvo) return null;
  if (salvo.expira_em - Date.now() > 5 * 60 * 1000) return salvo.access_token;
  if (!salvo.refresh_token) return null;
  const novo = await pedirToken(env, { grant_type: "refresh_token", refresh_token: salvo.refresh_token });
  return novo.access_token;
}

export async function mlGet(token, caminho) {
  const r = await fetch(ML_API + caminho, {
    headers: { Authorization: "Bearer " + token, Accept: "application/json" },
  });
  let dados = null;
  try { dados = await r.json(); } catch (e) { /* resposta sem JSON */ }
  return { status: r.status, dados };
}
