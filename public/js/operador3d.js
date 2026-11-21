/*
 * Operador 3D do Meu Loadout
 * ==========================
 * - Personagem base: "Universal Base Characters" by Quaternius (CC0 / domínio público)
 * - Armas e acessórios: "Ultimate Gun Pack" by Quaternius (CC0 / domínio público)
 * - Equipamento (capacete, colete, cinto, coldre...): modelado aqui, em código (original),
 *   com texturas de tecido/MOLLE geradas na hora (canvas), também originais
 * - Biblioteca 3D: three.js (licença MIT), em /vendor/three
 *
 * Só desenha a partir dos atributos do catálogo: nenhum texto digitado pelo usuário entra aqui.
 */
import * as THREE from "../vendor/three/three.module.min.js";
import { GLTFLoader } from "../vendor/three/GLTFLoader.js";
import { OrbitControls } from "../vendor/three/OrbitControls.js";
import { RoomEnvironment } from "../vendor/three/RoomEnvironment.js";

const COR = {
  preto: "#1c1e19", grafite: "#2b2e27", ranger: "#4d5438", oliva: "#5b623e", coyote: "#86704b",
  tan: "#a48d64", madeira: "#6e4124", metal: "#3a3d38", lente: "#0b0e10", bota: "#2a241e", tenis: "#5b5e5f",
};
const a = (p, campo) => (p && p.a ? p.a[campo] : undefined);
const nomeTem = (p, re) => !!(p && p.nome && re.test(p.nome));

// ---------- Texturas geradas (tecido cordura, MOLLE, camuflado, tela) ----------
const TEX = new Map();
let rndSeed = 11;
const rnd = () => ((rndSeed = (rndSeed * 16807) % 2147483647) / 2147483647);

function canvas(n) { const c = document.createElement("canvas"); c.width = c.height = n; return c; }
function manchasCamo(g, n) {
  const manchas = (cor, q, rmin, rmax) => {
    g.fillStyle = cor;
    for (let i = 0; i < q; i++) {
      const x = rnd() * n, y = rnd() * n, r = (rmin + rnd() * (rmax - rmin)) * n / 256;
      g.beginPath(); g.ellipse(x, y, r, r * (0.45 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2); g.fill();
    }
  };
  manchas("#3f4428", 26, 10, 26); manchas("#7a7350", 22, 6, 18); manchas("#2e3220", 18, 3, 8);
}
// cor: "#rrggbb" ou "camo"; molle: fitas horizontais costuradas
function texturas(cor, molle) {
  const chave = cor + (molle ? "|m" : "");
  if (TEX.has(chave)) return TEX.get(chave);
  rndSeed = 11;
  const N = 256, c = canvas(N), g = c.getContext("2d"), b = canvas(N), gb = b.getContext("2d");
  g.fillStyle = cor === "camo" ? "#5a5f3e" : cor; g.fillRect(0, 0, N, N);
  if (cor === "camo") manchasCamo(g, N);
  gb.fillStyle = "#808080"; gb.fillRect(0, 0, N, N);
  for (let i = 0; i < N; i += 2) {
    g.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.04})`; g.fillRect(0, i, N, 1);
    g.fillStyle = `rgba(255,255,255,${0.02 + rnd() * 0.02})`; g.fillRect(i, 0, 1, N);
    gb.fillStyle = i % 4 ? "#8a8a8a" : "#767676"; gb.fillRect(0, i, N, 1);
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`; g.fillRect(rnd() * N, rnd() * N, 2, 2); }
  if (molle) {
    for (let y = 18; y < N; y += 40) {
      g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(0, y + 13, N, 3);
      g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(0, y, N, 2);
      gb.fillStyle = "#b8b8b8"; gb.fillRect(0, y, N, 13);
      gb.fillStyle = "#4a4a4a"; gb.fillRect(0, y + 13, N, 3);
      for (let x = 0; x < N; x += 32) {
        g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(x, y, 2, 13);
        gb.fillStyle = "#5a5a5a"; gb.fillRect(x, y, 2, 13);
      }
    }
  }
  const map = new THREE.CanvasTexture(c), bump = new THREE.CanvasTexture(b);
  map.colorSpace = THREE.SRGBColorSpace;
  [map, bump].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; });
  const r = { map, bump };
  TEX.set(chave, r);
  return r;
}
function texturaTela() {
  if (TEX.has("tela")) return TEX.get("tela");
  const N = 64, c = canvas(N), g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, N, N);
  g.fillStyle = "#000";
  for (let y = 0; y < N; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < N; x += 8) { g.beginPath(); g.ellipse(x + 2, y + 4, 2.4, 2.8, 0, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 4);
  TEX.set("tela", t);
  return t;
}

// As geometrias extrudadas usam metros como UV → 1 repetição a cada ~13 cm
const ESCALA_TEX = 7.5;
function tecido(cor, opts) {
  const o = opts || {};
  const t = texturas(cor, !!o.molle);
  const rep = o.rep || ESCALA_TEX;
  const map = t.map.clone(), bump = t.bump.clone();
  [map, bump].forEach((x) => { x.repeat.set(rep * (o.rx || 1), rep * (o.ry || 1)); x.needsUpdate = true; });
  return new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: o.bump || 1.2, roughness: 0.93, metalness: 0, envMapIntensity: 0.35, side: o.lados ? THREE.DoubleSide : THREE.FrontSide });
}
function plastico(cor, extra) {
  return new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.6 }, extra || {}));
}
function metal(cor) { return new THREE.MeshStandardMaterial({ color: cor || "#4a4d48", roughness: 0.35, metalness: 0.8, envMapIntensity: 1 }); }
const LENTE = () => new THREE.MeshStandardMaterial({ color: "#0a0d10", roughness: 0.04, metalness: 0.95, envMapIntensity: 1.6 });

// ---------- Geometria ----------
function caixa(w, h, d, material, raio) {
  const r = Math.max(0.002, Math.min(raio || 0.004, w / 2 - 0.001, h / 2 - 0.001));
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const bev = Math.min(0.007, d / 3);
  const geo = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0005, d - bev * 2), bevelEnabled: true, bevelThickness: bev, bevelSize: Math.min(bev, r * 0.8), bevelSegments: 3, curveSegments: 5 });
  geo.translate(0, 0, -(d - bev * 2) / 2);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function malha(geo, material) { const m = new THREE.Mesh(geo, material); m.castShadow = m.receiveShadow = true; return m; }
function em(obj, x, y, z, rx, ry, rz) {
  obj.position.set(x, y, z);
  if (rx || ry || rz) obj.rotation.set(rx || 0, ry || 0, rz || 0);
  return obj;
}
function barraEntre(p1, p2, larg, esp, material) {
  const v1 = new THREE.Vector3(...p1), v2 = new THREE.Vector3(...p2);
  const m = caixa(larg, v1.distanceTo(v2), esp, material, 0.003);
  m.position.copy(v1).add(v2).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
  return m;
}
// faixa curva em volta do tronco (cummerbund, cinto): elipse rx × rz, do ângulo t0 ao t1 (0 = frente)
function faixa(rx, rz, h, t0, t1, material, y) {
  const m = malha(new THREE.CylinderGeometry(1, 1, h, 40, 1, true, t0, t1 - t0), material);
  m.scale.set(rx, 1, rz);
  m.position.y = y;
  return m;
}
function fivela(x, y, z, larg) {
  const g = new THREE.Group();
  g.add(em(caixa(larg || 0.03, 0.022, 0.008, plastico(COR.preto), 0.004), 0, 0, 0));
  g.add(em(caixa((larg || 0.03) * 0.6, 0.006, 0.01, plastico("#111"), 0.002), 0, 0.004, 0.002));
  return em(g, x, y, z);
}

// ---------- Corpo: roupas pintadas no manequim (shader) ----------
function materialCorpo() {
  const m = new THREE.MeshStandardMaterial({ color: 0x343832, roughness: 0.62, metalness: 0.05, envMapIntensity: 0.5 });
  const cor = (h) => new THREE.Color(h);
  const U = {
    uCamisaOn: { value: 0 }, uCamisaCor: { value: cor(COR.ranger) }, uCamisaCamo: { value: 0 }, uMangaCurta: { value: 0 }, uCombat: { value: 0 },
    uCalcaOn: { value: 0 }, uCalcaCor: { value: cor(COR.oliva) }, uCalcaCamo: { value: 0 }, uBermuda: { value: 0 },
    uBotaOn: { value: 0 }, uBotaAlt: { value: 0.0 }, uBotaCor: { value: cor(COR.bota) },
    uLuvaOn: { value: 0 }, uLuvaCor: { value: cor(COR.preto) }, uMeioDedo: { value: 0 },
    uCabecaOn: { value: 0 }, uCabecaCor: { value: cor(COR.preto) },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBind;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBind = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec3 vBind;
uniform float uCamisaOn, uCamisaCamo, uMangaCurta, uCombat, uCalcaOn, uCalcaCamo, uBermuda, uBotaOn, uBotaAlt, uLuvaOn, uMeioDedo, uCabecaOn;
uniform vec3 uCamisaCor, uCalcaCor, uBotaCor, uLuvaCor, uCabecaCor;
float ml_h(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float ml_n(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ml_h(i), ml_h(i + vec3(1,0,0)), f.x), mix(ml_h(i + vec3(0,1,0)), ml_h(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(ml_h(i + vec3(0,0,1)), ml_h(i + vec3(1,0,1)), f.x), mix(ml_h(i + vec3(0,1,1)), ml_h(i + vec3(1,1,1)), f.x), f.y), f.z); }
vec3 ml_camo(vec3 p){ float n = ml_n(p * 11.0) * 0.6 + ml_n(p * 27.0) * 0.4;
  vec3 c = vec3(0.353, 0.373, 0.243);
  if (n < 0.40) c = vec3(0.247, 0.267, 0.157);
  if (n > 0.63) c = vec3(0.478, 0.451, 0.314);
  if (n > 0.77) c = vec3(0.180, 0.196, 0.125);
  return pow(c, vec3(2.2)); }
float ml_trama(vec3 p){ return 0.9 + 0.1 * ml_n(p * 260.0) + 0.04 * sin(p.y * 1400.0); }`)
      .replace("#include <color_fragment>", `#include <color_fragment>
float ml_rough = roughness;
{
  vec3 p = vBind; float ax = abs(p.x);
  bool braco = ax > 0.23 && p.y > 1.28;
  bool mao = braco && ax > 0.69;
  bool cabeca = !braco && p.y > 1.565;
  bool tronco = !braco && p.y > 1.02 && p.y <= 1.565;
  bool perna = !braco && p.y <= 1.02;
  bool pe = !braco && p.y < uBotaAlt;
  vec3 cor = diffuseColor.rgb;
  bool pano = false;
  if (uCalcaOn > 0.5 && (perna || (!braco && p.y < 1.06)) && !(pe && uBotaOn > 0.5) && (uBermuda < 0.5 || p.y > 0.60)) {
    cor = uCalcaCamo > 0.5 ? ml_camo(p) : uCalcaCor; pano = true;
    if (p.y > 1.035 && p.y < 1.06) cor *= 0.72;
    if (uBotaOn > 0.5 && p.y < uBotaAlt + 0.02) cor *= 0.8;
    if (ax > 0.16 && ax < 0.21 && p.y > 0.62 && p.y < 0.86 && abs(p.z) < 0.03) cor *= 0.78;
  }
  if (uCamisaOn > 0.5 && ((tronco && p.y > 1.04) || (braco && !mao && (uMangaCurta < 0.5 || ax < 0.40)))) {
    cor = uCamisaCamo > 0.5 ? ml_camo(p) : uCamisaCor; pano = true;
    if (uCombat > 0.5 && tronco) cor = uCamisaCor;
    if (braco && ax > 0.655 && ax < 0.69) cor *= 0.75;
    if (!braco && p.y > 1.50 && p.y < 1.565 && p.z > -0.02) cor *= 0.82;
    if (braco && ax > 0.30 && ax < 0.42 && p.y > 1.48) cor *= 0.85;
  }
  if (uBotaOn > 0.5 && pe) {
    cor = uBotaCor; ml_rough = 0.7;
    if (p.y < 0.028) cor = vec3(0.012);
    if (p.z > 0.02 && p.y > 0.05 && p.y < uBotaAlt - 0.02 && mod(p.y, 0.018) < 0.005) cor *= 0.35;
  }
  if (uLuvaOn > 0.5 && mao && !(uMeioDedo > 0.5 && ax > 0.80)) { cor = uLuvaCor; pano = true; }
  if (uCabecaOn > 0.5 && cabeca && !(p.y > 1.675 && p.y < 1.728 && p.z > 0.04)) { cor = uCabecaCor; pano = true; }
  if (pano) { cor *= ml_trama(p); ml_rough = 0.94; }
  diffuseColor.rgb = cor;
}`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = ml_rough;");
  };
  m.userData.U = U;
  return m;
}

// ---------- Pose ----------
function girarNoMundo(osso, eixo, ang) {
  const q = new THREE.Quaternion().setFromAxisAngle(eixo, ang);
  const pai = new THREE.Quaternion(); osso.parent.getWorldQuaternion(pai);
  const mundo = new THREE.Quaternion(); osso.getWorldQuaternion(mundo);
  osso.quaternion.copy(pai.invert().multiply(q.multiply(mundo)));
  osso.updateMatrixWorld(true);
}
function posar(raiz) {
  const ossos = {};
  raiz.traverse((o) => { if (o.isBone) ossos[o.name] = o; });
  raiz.updateMatrixWorld(true);
  const Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  if (ossos.upperarm_l) { girarNoMundo(ossos.upperarm_l, Z, -1.33); girarNoMundo(ossos.upperarm_l, Y, 0.12); }
  if (ossos.upperarm_r) { girarNoMundo(ossos.upperarm_r, Z, 1.33); girarNoMundo(ossos.upperarm_r, Y, -0.12); }
  if (ossos.lowerarm_l) girarNoMundo(ossos.lowerarm_l, X, -0.26);
  if (ossos.lowerarm_r) girarNoMundo(ossos.lowerarm_r, X, -0.26);
  if (ossos.hand_l) girarNoMundo(ossos.hand_l, Z, 0.1);
  if (ossos.hand_r) girarNoMundo(ossos.hand_r, Z, -0.1);
  if (ossos.thigh_l) girarNoMundo(ossos.thigh_l, Z, 0.035);
  if (ossos.thigh_r) girarNoMundo(ossos.thigh_r, Z, -0.035);
  return ossos;
}

// ---------- Equipamento ----------
function corColete(p) {
  if (nomeTem(p, /Invictus/)) return "camo";
  if (nomeTem(p, /JPC/)) return COR.ranger;
  if (a(p, "tipo") === "Chest rig") return COR.oliva;
  return COR.coyote;
}
function bolsaCarregador(w, h, d, corPano) {
  const g = new THREE.Group();
  g.add(em(caixa(w, h, d, tecido(corPano), 0.008), 0, 0, 0));
  g.add(em(caixa(w + 0.004, h * 0.32, d + 0.006, tecido(corPano), 0.008), 0, h * 0.36, 0.002));
  g.add(em(caixa(w * 0.35, 0.018, 0.006, plastico(COR.preto), 0.003), 0, h * 0.2, d / 2 + 0.006));
  return g;
}


// ---------- Capacete FAST (estilo "Maritime", corte alto) ----------
// Casco = elipsoide ajustado à cabeça do manequim (centro 0, 1.70, -0.006).
// A borda inferior muda com o ângulo: alta na frente e nas orelhas, baixa na nuca.
const CASCO = { cx: 0, cy: 1.70, cz: -0.006, ax: 0.098, ay: 0.126, az: 0.121, esp: 0.008 };
const BORDA_FAST = [[0, 1.742], [35, 1.736], [62, 1.722], [80, 1.728], [100, 1.73], [118, 1.712], [138, 1.680], [160, 1.664], [180, 1.660]];
function bordaFast(grau) {
  const g = Math.min(180, Math.abs(grau));
  for (let i = 1; i < BORDA_FAST.length; i++) {
    const [g0, y0] = BORDA_FAST[i - 1], [g1, y1] = BORDA_FAST[i];
    if (g <= g1) { const t = (g - g0) / (g1 - g0); const s = t * t * (3 - 2 * t); return y0 + (y1 - y0) * s; }
  }
  return BORDA_FAST[BORDA_FAST.length - 1][1];
}
// ponto na superfície do casco: th = ângulo em volta (0 = frente, +90 = lado esquerdo do boneco/+x), y = altura, off = afastamento
function noCasco(th, y, off, enc) {
  const k = 1 - (enc || 0);
  const ax = CASCO.ax * k, ay = CASCO.ay * k, az = CASCO.az * k;
  const c = Math.max(-1, Math.min(1, (y - CASCO.cy) / ay));
  const sf = Math.sqrt(1 - c * c);
  const p = new THREE.Vector3(Math.sin(th) * ax * sf, CASCO.cy + c * ay, CASCO.cz + Math.cos(th) * az * sf);
  const n = new THREE.Vector3(p.x / (ax * ax), (p.y - CASCO.cy) / (ay * ay), (p.z - CASCO.cz) / (az * az)).normalize();
  if (off) p.addScaledVector(n, off);
  return { p, n };
}
// malha que acompanha o casco: th0..th1 (graus) e de cima (fração "v" do polo até a borda)
function superficieCasco(material, o) {
  const N = o.segU || 64, M = o.segV || 24;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= M; j++) {
    for (let i = 0; i <= N; i++) {
      const grau = o.th0 + (o.th1 - o.th0) * (i / N);
      const th = grau * Math.PI / 180;
      const yTopo = o.yTopo != null ? o.yTopo : CASCO.cy + CASCO.ay * (1 - (o.enc || 0));
      const yBase = o.yBase != null ? (typeof o.yBase === "function" ? o.yBase(grau) : o.yBase) : bordaFast(grau);
      const y = yTopo + (yBase - yTopo) * (j / M);
      const { p } = noCasco(th, y, o.off || 0, o.enc);
      pos.push(p.x, p.y, p.z);
      uv.push((grau / 360) * (o.repU || 1), (y - CASCO.cy) * (o.repV || 1));
    }
  }
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
    const a0 = j * (N + 1) + i, b0 = a0 + N + 1;
    if (o.inverter) idx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0); else idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return malha(geo, material);
}
// textura granulada do casco e felpuda do velcro
function texturaGrao(chave, base, var1, felpa) {
  if (TEX.has(chave)) return TEX.get(chave);
  const N = 256, c = canvas(N), g = c.getContext("2d"), b = canvas(N), gb = b.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, N, N); gb.fillStyle = "#808080"; gb.fillRect(0, 0, N, N);
  const qtd = felpa ? 9000 : 5000;
  for (let i = 0; i < qtd; i++) {
    const x = rnd() * N, y = rnd() * N, r = felpa ? 0.6 + rnd() * 1.4 : 0.5 + rnd() * 1.1, v = rnd();
    g.fillStyle = v > 0.5 ? "rgba(255,255,255," + (var1 * rnd()) + ")" : "rgba(0,0,0," + (var1 * 1.4 * rnd()) + ")";
    g.fillRect(x, y, r, r);
    const t = Math.floor(80 + v * 120); gb.fillStyle = "rgb(" + t + "," + t + "," + t + ")"; gb.fillRect(x, y, r, r);
  }
  const map = new THREE.CanvasTexture(c), bump = new THREE.CanvasTexture(b);
  map.colorSpace = THREE.SRGBColorSpace;
  [map, bump].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; });
  const r = { map, bump };
  TEX.set(chave, r);
  return r;
}
function materialCasco(cor) {
  const t = texturaGrao("casco" + cor, cor, 0.07, false);
  const map = t.map.clone(), bump = t.bump.clone();
  [map, bump].forEach((x) => { x.repeat.set(6, 22); x.needsUpdate = true; });
  return new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 0.35, roughness: 0.78, metalness: 0.02, envMapIntensity: 0.55 });
}
function materialVelcro(cor) {
  const t = texturaGrao("velcro" + cor, cor, 0.22, true);
  const map = t.map.clone(), bump = t.bump.clone();
  [map, bump].forEach((x) => { x.repeat.set(10, 40); x.needsUpdate = true; });
  return new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 2.2, roughness: 1, metalness: 0, envMapIntensity: 0.2, polygonOffset: true, polygonOffsetFactor: -2 });
}
// peça rígida (caixa) encostada no casco, orientada pela normal e pela direção "ao longo"
function naSuperficie(obj, th, y, off, giro) {
  const { p, n } = noCasco(th, y, off);
  const lado = new THREE.Vector3(Math.cos(th), 0, -Math.sin(th));
  const cima = new THREE.Vector3().crossVectors(n, lado).normalize();
  lado.crossVectors(cima, n).normalize();
  const m = new THREE.Matrix4().makeBasis(lado, cima, n);
  obj.quaternion.setFromRotationMatrix(m);
  if (giro) obj.rotateZ(giro);
  obj.position.copy(p);
  return obj;
}
function corMais(cor, f) { const c = new THREE.Color(cor); c.multiplyScalar(f); return "#" + c.getHexString(); }

function capaceteFast(p) {
  const g = new THREE.Group();
  let cor = "#6d6350", corVelcro = "#5c4f33", corFita = "#7a6644";
  if (nomeTem(p, /Emerson|ranger|verde|green/i)) { cor = "#5d6248"; corVelcro = "#4d5438"; corFita = "#5b623e"; }
  if (nomeTem(p, /preto|black/i)) { cor = "#2b2d29"; corVelcro = "#1f211d"; corFita = "#2b2e27"; }
  const casco = materialCasco(cor);
  const trilhoMat = plastico(corMais(cor, 0.9), { roughness: 0.68 });
  const escuro = plastico("#151613", { roughness: 0.6 });
  const velcro = materialVelcro(corVelcro);
  const fita = tecido(corFita, { rep: 3, bump: 0.8 });

  // casco: face externa, face interna (forro escuro) e borda arredondada
  g.add(superficieCasco(casco, { th0: -180, th1: 180, segU: 96, segV: 36 }));
  g.add(superficieCasco(plastico("#1b1c19", { roughness: 0.95, side: THREE.DoubleSide }), { th0: -180, th1: 180, segU: 72, segV: 24, enc: CASCO.esp / CASCO.ay, inverter: true }));
  const bordaPts = [];
  for (let i = 0; i <= 96; i++) { const gr = -180 + 360 * i / 96; bordaPts.push(noCasco(gr * Math.PI / 180, bordaFast(gr), -CASCO.esp * 0.45).p); }
  const curvaBorda = new THREE.CatmullRomCurve3(bordaPts, true);
  g.add(malha(new THREE.TubeGeometry(curvaBorda, 160, CASCO.esp * 0.55, 8, true), casco));
  // almofadas internas (aparecem por baixo)
  [[0, 1.775], [180, 1.72], [90, 1.75], [-90, 1.75]].forEach(([gr, y]) => {
    g.add(naSuperficie(caixa(0.05, 0.035, 0.016, plastico("#2a2b28", { roughness: 1 }), 0.012), gr * Math.PI / 180, y, -CASCO.esp - 0.008));
  });

  // velcro: coroa, faixas laterais no alto e faixa traseira
  g.add(superficieCasco(velcro, { th0: -180, th1: 180, segU: 64, segV: 8, yBase: 1.814, off: 0.0016, repU: 2, repV: 8 }));
  g.add(superficieCasco(velcro, { th0: -24, th1: 24, segU: 10, segV: 8, yTopo: 1.816, yBase: 1.782, off: 0.0016, repU: 2, repV: 8 }));
  [-1, 1].forEach((l) => {
    g.add(superficieCasco(velcro, { th0: l > 0 ? 58 : -122, th1: l > 0 ? 122 : -58, segU: 16, segV: 6, yTopo: 1.80, yBase: 1.764, off: 0.0016, repU: 2, repV: 8 }));
  });
  g.add(superficieCasco(velcro, { th0: 142, th1: 218, segU: 20, segV: 6, yTopo: 1.728, yBase: 1.694, off: 0.0016, repU: 2, repV: 8 }));

  // trilhos laterais (estilo ARC): horizontal e descendo para trás
  [-1, 1].forEach((l) => {
    const pts = [];
    for (let gr = 56; gr <= 112; gr += 4) pts.push([gr, 1.744]);
    for (let gr = 116; gr <= 140; gr += 4) { const t = (gr - 112) / 28; pts.push([gr, 1.744 - t * t * 0.05]); }
    pts.forEach(([gr, y], i) => {
      const th = l * gr * Math.PI / 180;
      const prox = pts[Math.min(i + 1, pts.length - 1)], ant = pts[Math.max(i - 1, 0)];
      const inc = Math.atan2(prox[1] - ant[1], (prox[0] - ant[0]) * Math.PI / 180 * 0.1) * l;
      const peca = caixa(0.017, 0.03, 0.009, trilhoMat, 0.004);
      g.add(naSuperficie(peca, th, y, 0.003, -inc));
      if (i % 2 === 0 && gr < 136) {
        g.add(naSuperficie(caixa(0.004, 0.012, 0.004, escuro, 0.001), th, y, 0.0075, -inc));
      }
      if (gr % 8 === 0) {
        g.add(naSuperficie(caixa(0.0045, 0.0022, 0.003, escuro, 0.0008), th, y + 0.0125, 0.007, -inc));
        g.add(naSuperficie(caixa(0.0045, 0.0022, 0.003, escuro, 0.0008), th, y - 0.0125, 0.007, -inc));
      }
    });
    // parafusos
    [[66, 1.744], [124, 1.735]].forEach(([gr, y]) => {
      const pf = malha(new THREE.CylinderGeometry(0.0065, 0.0065, 0.004, 16), metal("#202220"));
      pf.rotation.x = Math.PI / 2;
      const grupo = new THREE.Group(); grupo.add(pf);
      g.add(naSuperficie(grupo, l * gr * Math.PI / 180, y, 0.0085));
    });
    // presilha frontal do trilho (onde o cordão prende)
    g.add(naSuperficie(caixa(0.012, 0.016, 0.01, escuro, 0.003), l * 50 * Math.PI / 180, 1.738, 0.004));
  });

  // shroud frontal (suporte de NVG)
  const shroud = new THREE.Group();
  shroud.add(em(caixa(0.07, 0.05, 0.007, trilhoMat, 0.008), 0, 0, 0));
  shroud.add(em(caixa(0.044, 0.026, 0.006, plastico("#24231f", { roughness: 0.5 }), 0.004), 0, -0.002, 0.004));
  shroud.add(em(caixa(0.05, 0.008, 0.009, trilhoMat, 0.003), 0, 0.017, 0.004));
  shroud.add(em(caixa(0.05, 0.007, 0.009, trilhoMat, 0.003), 0, -0.02, 0.004));
  [-1, 1].forEach((l) => {
    shroud.add(em(caixa(0.012, 0.042, 0.011, trilhoMat, 0.004), l * 0.03, -0.002, 0.004));
    const pino = malha(new THREE.CylinderGeometry(0.0045, 0.0045, 0.006, 14), plastico(corMais(cor, 0.85)));
    pino.rotation.x = Math.PI / 2; pino.position.set(l * 0.042, 0.018, 0.002); shroud.add(pino);
  });
  g.add(naSuperficie(shroud, 0, 1.772, 0.004));

  // cordão elástico (bungee) contornando a frente
  const cord = [];
  for (let gr = -52; gr <= 52; gr += 4) cord.push(noCasco(gr * Math.PI / 180, bordaFast(gr) + 0.006 + Math.abs(gr) * 0.00008, 0.0045).p);
  g.add(malha(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cord), 60, 0.0022, 6, false), plastico(corFita, { roughness: 0.9 })));
  [-1, 1].forEach((l) => g.add(naSuperficie(caixa(0.008, 0.006, 0.006, escuro, 0.002), l * 22 * Math.PI / 180, bordaFast(22) + 0.008, 0.006)));

  // regulagem traseira (dial)
  const dial = new THREE.Group();
  const roda = malha(new THREE.CylinderGeometry(0.017, 0.018, 0.012, 20), plastico(corMais(cor, 0.85), { roughness: 0.7 }));
  roda.rotation.x = Math.PI / 2; dial.add(roda);
  for (let i = 0; i < 10; i++) { const r = caixa(0.003, 0.012, 0.004, plastico(corMais(cor, 0.7)), 0.001); r.position.set(0, 0, 0.007); r.rotation.z = i * Math.PI / 5; dial.add(r); }
  dial.position.set(0, 1.648, CASCO.cz - CASCO.az * 0.83); dial.rotation.y = Math.PI; dial.rotation.x = 0.35;
  g.add(dial);
  g.add(barraEntre([-0.045, 1.66, -0.105], [0.045, 1.66, -0.105], 0.012, 0.004, fita));

  // jugular: tiras da frente e de trás descendo até a fivela e o queixo
  [-1, 1].forEach((l) => {
    const dentroF = noCasco(l * 62 * Math.PI / 180, bordaFast(62) + 0.004, -CASCO.esp - 0.004).p;
    const dentroT = noCasco(l * 128 * Math.PI / 180, bordaFast(128) + 0.004, -CASCO.esp - 0.004).p;
    const juncao = [l * 0.072, 1.622, 0.014];
    const queixo = [l * 0.04, 1.58, 0.06];
    g.add(barraEntre([dentroF.x, dentroF.y, dentroF.z], [l * 0.084, 1.665, 0.038], 0.014, 0.003, fita));
    g.add(barraEntre([l * 0.084, 1.665, 0.038], juncao, 0.014, 0.003, fita));
    g.add(barraEntre([dentroT.x, dentroT.y, dentroT.z], [l * 0.084, 1.66, -0.035], 0.014, 0.003, fita));
    g.add(barraEntre([l * 0.084, 1.66, -0.035], juncao, 0.014, 0.003, fita));
    g.add(barraEntre(juncao, queixo, 0.016, 0.003, fita));
    g.add(em(caixa(0.012, 0.02, 0.007, plastico(corMais(corFita, 0.7)), 0.003), juncao[0], juncao[1] + 0.004, juncao[2], 0, l * 1.45, 0));
    g.add(em(caixa(0.012, 0.016, 0.006, plastico(corMais(corFita, 0.7)), 0.003), l * 0.083, 1.69, 0.026, 0, l * 1.45, 0));
  });
  // concha do queixo
  const arco = [[-0.04, 1.58, 0.06], [-0.024, 1.574, 0.083], [0, 1.571, 0.092], [0.024, 1.574, 0.083], [0.04, 1.58, 0.06]];
  for (let i = 0; i < arco.length - 1; i++) g.add(barraEntre(arco[i], arco[i + 1], 0.02, 0.004, fita));
  g.add(em(caixa(0.018, 0.012, 0.008, plastico(corMais(corFita, 0.6)), 0.003), 0.03, 1.577, 0.076, 0, 0.6, 0));
  return g;
}

const PECA = {
  capacete(ps) {
    const p = ps[0], g = new THREE.Group();
    if (a(p, "tipo") === "Boné") {
      const cup = malha(new THREE.SphereGeometry(0.106, 40, 14, 0, Math.PI * 2, 0, Math.PI * 0.47), tecido(COR.oliva, { rep: 2 }));
      cup.scale.set(1, 0.95, 1.12);
      g.add(em(cup, 0, 1.712, -0.004));
      g.add(em(caixa(0.17, 0.10, 0.008, tecido(COR.ranger), 0.035), 0, 1.722, 0.13, Math.PI / 2 + 0.16));
      g.add(em(caixa(0.07, 0.04, 0.004, tecido(COR.preto, { bump: 2 }), 0.006), 0, 1.79, 0.095, -0.45));
      return g;
    }
    return capaceteFast(p);
  },
  oculos(ps) {
    const goggle = a(ps[0], "tipo") === "Goggle" || nomeTem(ps[0], /mesh/i);
    const g = new THREE.Group();
    const w = goggle ? 0.19 : 0.172, h = goggle ? 0.064 : 0.046;
    g.add(em(caixa(w + 0.012, h + 0.012, 0.022, plastico(COR.preto), 0.02), 0, 1.703, 0.1));
    g.add(em(caixa(w, h, 0.012, LENTE(), 0.018), 0, 1.703, 0.113));
    const tira = malha(new THREE.TorusGeometry(0.104, goggle ? 0.01 : 0.004, 6, 48), goggle ? tecido(COR.preto, { rep: 2 }) : plastico(COR.preto));
    tira.scale.set(1, 1.12, 1);
    g.add(em(tira, 0, 1.703, 0.0, Math.PI / 2));
    return g;
  },
  mascara(ps) {
    const t = a(ps[0], "tipo"), g = new THREE.Group();
    if (t === "Balaclava") return g;
    const tela = new THREE.MeshStandardMaterial({ color: "#3a3f38", metalness: 0.75, roughness: 0.4, alphaMap: texturaTela(), alphaTest: 0.5, side: THREE.DoubleSide, envMapIntensity: 1 });
    const fundo = new THREE.MeshStandardMaterial({ color: "#0e100d", roughness: 1, side: THREE.BackSide });
    if (t === "Full face") {
      const geo = new THREE.CylinderGeometry(0.108, 0.1, 0.19, 32, 4, true, -Math.PI / 2, Math.PI);
      g.add(em(malha(geo, tela), 0, 1.675, 0.006), em(malha(geo, fundo), 0, 1.675, 0.004));
      g.add(em(caixa(0.18, 0.06, 0.02, LENTE(), 0.02), 0, 1.705, 0.113));
      g.add(em(caixa(0.2, 0.075, 0.016, plastico(COR.preto), 0.025), 0, 1.705, 0.104));
      return g;
    }
    const geo = new THREE.CylinderGeometry(0.1, 0.084, 0.088, 28, 3, true, -Math.PI / 2.15, Math.PI / 1.075);
    g.add(em(malha(geo, tela), 0, 1.632, 0.012), em(malha(geo, fundo), 0, 1.632, 0.01));
    [-1, 1].forEach((l) => g.add(barraEntre([l * 0.085, 1.65, 0.0], [l * 0.11, 1.67, -0.07], 0.012, 0.004, tecido(COR.preto))));
    return g;
  },
  comunicacao(ps, ctx) {
    const g = new THREE.Group();
    ps.forEach((p) => {
      const t = a(p, "tipo");
      if (t === "Headset") {
        const cor = nomeTem(p, /Earmor/) ? COR.coyote : COR.ranger;
        [-1, 1].forEach((l) => {
          g.add(em(malha(new THREE.CylinderGeometry(0.042, 0.04, 0.038, 32), plastico(cor, { roughness: 0.6 })), l * 0.114, 1.69, -0.005, 0, 0, Math.PI / 2));
          g.add(em(malha(new THREE.TorusGeometry(0.034, 0.009, 8, 24), plastico("#111", { roughness: 0.9 })), l * 0.096, 1.69, -0.005, 0, Math.PI / 2));
          g.add(em(malha(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 8), plastico("#111")), l * 0.135, 1.715, 0.012, 0, 0, Math.PI / 2));
        });
        if (!ctx.temCapacete) g.add(em(malha(new THREE.TorusGeometry(0.12, 0.009, 8, 32, Math.PI), plastico(COR.preto)), 0, 1.70, -0.005));
        g.add(barraEntre([0.10, 1.665, 0.035], [0.035, 1.635, 0.108], 0.006, 0.006, plastico(COR.preto)));
        g.add(em(malha(new THREE.SphereGeometry(0.011, 12, 8), tecido(COR.preto, { rep: 1 })), 0.03, 1.633, 0.112));
      } else if (t === "Rádio") {
        const z = ctx.frenteColete + 0.022;
        g.add(em(caixa(0.052, 0.11, 0.032, plastico(COR.preto), 0.007), 0.145, 1.33, z));
        g.add(em(caixa(0.04, 0.03, 0.004, metal("#555"), 0.003), 0.145, 1.35, z + 0.017));
        g.add(em(malha(new THREE.CylinderGeometry(0.005, 0.004, 0.17, 8), plastico(COR.preto)), 0.158, 1.47, z));
      } else if (t === "PTT") {
        g.add(em(caixa(0.04, 0.04, 0.02, plastico(COR.preto), 0.008), -0.09, 1.40, ctx.frenteColete + 0.012));
        g.add(em(malha(new THREE.CylinderGeometry(0.01, 0.01, 0.008, 16), plastico("#5a1f1f")), -0.09, 1.40, ctx.frenteColete + 0.024, Math.PI / 2));
      }
    });
    return g;
  },
  colete(ps) {
    const p = ps[0], t = a(p, "tipo"), cor = corColete(p), g = new THREE.Group();
    const pano = tecido(cor, { molle: true }), liso = tecido(cor);
    if (t === "Chest rig") {
      g.add(em(caixa(0.34, 0.17, 0.065, pano, 0.02), 0, 1.20, 0.152));
      for (let i = 0; i < 4; i++) g.add(em(bolsaCarregador(0.068, 0.11, 0.035, cor), -0.111 + i * 0.074, 1.215, 0.19));
      g.add(barraEntre([-0.12, 1.51, 0.05], [0.06, 1.28, 0.16], 0.038, 0.012, tecido(COR.grafite)));
      g.add(barraEntre([0.12, 1.51, 0.05], [-0.06, 1.28, 0.16], 0.038, 0.012, tecido(COR.grafite)));
      g.add(barraEntre([-0.12, 1.51, 0.03], [0.10, 1.22, -0.16], 0.038, 0.012, tecido(COR.grafite)));
      g.add(barraEntre([0.12, 1.51, 0.03], [-0.10, 1.22, -0.16], 0.038, 0.012, tecido(COR.grafite)));
      g.add(faixa(0.205, 0.175, 0.04, Math.PI * 0.25, Math.PI * 1.75, tecido(COR.grafite, { lados: true }), 1.19));
      return g;
    }
    const grande = t === "Colete MOLLE";
    const h = grande ? 0.40 : 0.33, w = grande ? 0.37 : 0.32, y = grande ? 1.27 : 1.31;
    g.add(em(caixa(w, h, 0.05, pano, 0.035), 0, y, 0.15));
    g.add(em(caixa(w, h, 0.05, pano, 0.035), 0, y, -0.19));
    g.add(em(caixa(0.15, 0.065, 0.006, tecido(COR.preto, { bump: 2 }), 0.008), 0, y + h / 2 - 0.06, 0.178));
    g.add(em(caixa(w - 0.04, 0.085, 0.02, liso, 0.015), 0, y - h / 2 + 0.05, 0.183));
    const cb = tecido(cor, { molle: true, lados: true, rep: 1, rx: 6, ry: 1.2 });
    g.add(faixa(0.21, 0.185, 0.15, Math.PI * 0.22, Math.PI * 0.78, cb, y - 0.09));
    g.add(faixa(0.21, 0.185, 0.15, Math.PI * 1.22, Math.PI * 1.78, cb, y - 0.09));
    [-1, 1].forEach((l) => {
      g.add(barraEntre([l * 0.1, y + h / 2 - 0.02, 0.15], [l * 0.112, 1.525, 0.03], 0.07, 0.022, liso));
      g.add(barraEntre([l * 0.112, 1.525, 0.03], [l * 0.1, y + h / 2 - 0.02, -0.18], 0.07, 0.022, liso));
      g.add(fivela(l * 0.1, y + h / 2 - 0.035, 0.18, 0.04));
    });
    g.add(em(malha(new THREE.TorusGeometry(0.035, 0.008, 6, 16, Math.PI), tecido(COR.preto)), 0, y + h / 2 - 0.02, -0.222));
    return g;
  },
  pouchPeito(ps, ctx) {
    const g = new THREE.Group(), z = ctx.frenteColete + 0.026;
    const cor = ctx.corColete || COR.oliva;
    ps.forEach((p) => {
      const t = a(p, "tipo");
      if (t === "Porta-carregador") {
        const ak = a(p, "para") === "AK", n = ak ? 2 : 3, w = ak ? 0.085 : 0.07;
        for (let i = 0; i < n; i++) g.add(em(bolsaCarregador(w, 0.12, 0.045, cor), (i - (n - 1) / 2) * (w + 0.008), 1.215, z));
      } else if (t === "Admin") {
        g.add(em(caixa(0.14, 0.10, 0.032, tecido(cor), 0.014), 0, 1.385, z));
        g.add(em(caixa(0.09, 0.04, 0.004, tecido(COR.preto, { bump: 2 }), 0.006), 0, 1.395, z + 0.018));
      } else if (t === "Porta-rádio") {
        g.add(em(bolsaCarregador(0.058, 0.13, 0.042, cor), 0.15, 1.33, z));
      }
    });
    return g;
  },
  cinto(ps) {
    const battle = a(ps[0], "tipo") === "Battle belt", g = new THREE.Group();
    if (battle) {
      g.add(faixa(0.184, 0.142, 0.07, 0, Math.PI * 2, tecido(COR.ranger, { molle: true, lados: true, rep: 1, rx: 9, ry: 0.9 }), 1.022));
      g.add(faixa(0.188, 0.146, 0.03, 0, Math.PI * 2, tecido(COR.preto, { lados: true, rep: 1, rx: 12, ry: 0.5 }), 1.022));
      g.add(em(caixa(0.06, 0.035, 0.012, metal("#2f312d"), 0.008), 0, 1.022, 0.15));
      g.add(em(caixa(0.03, 0.02, 0.014, metal("#555"), 0.004), 0, 1.022, 0.152));
    } else {
      g.add(faixa(0.183, 0.141, 0.035, 0, Math.PI * 2, tecido(COR.preto, { lados: true, rep: 1, rx: 12, ry: 0.5 }), 1.025));
      g.add(em(caixa(0.05, 0.032, 0.012, metal("#3c3e3a"), 0.006), 0, 1.025, 0.148));
    }
    return g;
  },
  pouchCinto(ps) {
    const g = new THREE.Group();
    ps.forEach((p) => {
      const t = a(p, "tipo"), para = a(p, "para");
      if (t === "Porta-carregador" && para === "Pistola") {
        g.add(em(bolsaCarregador(0.034, 0.09, 0.03, COR.oliva), 0.085, 1.0, 0.155, 0, 0.35));
        g.add(em(bolsaCarregador(0.034, 0.09, 0.03, COR.oliva), 0.122, 1.0, 0.138, 0, 0.55));
      } else if (t === "Porta-carregador") {
        g.add(em(bolsaCarregador(0.066, 0.115, 0.045, COR.oliva), 0.168, 0.995, 0.085, 0, 0.9));
      } else if (t === "Porta-torniquete") {
        g.add(em(caixa(0.045, 0.105, 0.04, tecido("#5a1f1f"), 0.012), 0.185, 1.0, -0.03, 0, 1.5));
      } else if (t === "Dump pouch") {
        g.add(em(caixa(0.12, 0.14, 0.065, tecido(COR.ranger), 0.03), -0.11, 0.94, -0.16, 0.1, 0.3));
      }
    });
    return g;
  },
  joelheira(ps) {
    const g = new THREE.Group();
    if (a(ps[0], "tipo") === "Interna") return g;
    [-1, 1].forEach((l) => {
      const capa = malha(new THREE.SphereGeometry(0.05, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), plastico(COR.grafite, { roughness: 0.5 }));
      capa.scale.set(1, 1.1, 0.55);
      g.add(em(caixa(0.105, 0.12, 0.03, tecido(COR.preto), 0.035), l * 0.118, 0.545, 0.045));
      g.add(em(capa, l * 0.118, 0.545, 0.058, Math.PI / 2));
      [0.585, 0.505].forEach((yy) => g.add(em(caixa(0.115, 0.012, 0.012, tecido(COR.preto), 0.004), l * 0.118, yy, 0.03)));
    });
    return g;
  },
  calcado(ps) {
    const g = new THREE.Group();
    const t = a(ps[0], "tipo"), tenis = t === "Tênis";
    const alt = t === "Cano alto" ? 0.27 : t === "Cano médio" ? 0.19 : 0;
    const couro = plastico(tenis ? "#55585a" : "#3b2f25", { roughness: 0.62, envMapIntensity: 0.5 });
    const lona = tecido(tenis ? "#4a4d4f" : "#4a3c2c", { rep: 6 });
    [-1, 1].forEach((l) => {
      const x = l * 0.114;
      g.add(em(caixa(0.112, 0.27, tenis ? 0.016 : 0.022, plastico("#0d0d0b", { roughness: 0.9 }), 0.035), x, 0.011, -0.012, Math.PI / 2));   // sola
      g.add(em(caixa(0.108, tenis ? 0.06 : 0.075, 0.262, couro, 0.03), x, tenis ? 0.05 : 0.058, -0.012));                                    // pé
      g.add(em(caixa(0.104, 0.03, 0.09, couro, 0.014), x, 0.03, 0.085));                                                                      // biqueira
      if (alt) {
        const cano = malha(new THREE.CylinderGeometry(0.064, 0.06, alt - 0.06, 24, 1, true), lona);
        cano.scale.set(1, 1, 1.12);
        g.add(em(cano, x, 0.06 + (alt - 0.06) / 2, -0.083));
        const n = Math.floor((alt - 0.08) / 0.022);
        for (let i = 0; i < n; i++) g.add(em(caixa(0.05, 0.005, 0.006, plastico("#151513"), 0.002), x, 0.09 + i * 0.022, -0.02, 0.15));       // cadarço
        g.add(em(malha(new THREE.TorusGeometry(0.066, 0.006, 6, 24), couro), x, alt - 0.005, -0.083, Math.PI / 2));                          // borda do cano
      } else {
        for (let i = 0; i < 3; i++) g.add(em(caixa(0.045, 0.005, 0.006, plastico("#dddddd"), 0.002), x, 0.075 + i * 0.006, 0.02 + i * 0.022, 0.4));
      }
    });
    return g;
  },
  mochila(ps, ctx) {
    const t = a(ps[0], "tipo"), g = new THREE.Group();
    const dim = t === "3 dias" ? [0.36, 0.52, 0.22, 1.24, -0.32] : t === "Hidratação" ? [0.24, 0.40, 0.07, 1.30, -0.245] : [0.31, 0.43, 0.16, 1.27, -0.29];
    const cor = t === "3 dias" ? COR.coyote : COR.ranger;
    const [w, h, d, y, z] = dim;
    g.add(em(caixa(w, h, d, tecido(cor, { molle: t !== "Hidratação" }), 0.05), 0, y, z));
    if (t !== "Hidratação") {
      g.add(em(caixa(w - 0.06, h * 0.42, 0.045, tecido(cor, { molle: true }), 0.03), 0, y - h * 0.2, z - d / 2 - 0.018));
      g.add(em(caixa(w - 0.02, 0.07, d + 0.01, tecido(cor), 0.03), 0, y + h / 2 - 0.02, z));
      [-1, 1].forEach((l) => [y + 0.08, y - 0.1].forEach((yy) => g.add(em(caixa(0.012, 0.025, d * 0.9, tecido(COR.preto), 0.004), l * (w / 2 + 0.004), yy, z))));
    } else {
      const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(0.09, 1.48, -0.2), new THREE.Vector3(0.13, 1.52, 0.0), new THREE.Vector3(0.14, 1.38, ctx.frenteColete + 0.01), new THREE.Vector3(0.13, 1.25, ctx.frenteColete + 0.015)]);
      g.add(malha(new THREE.TubeGeometry(curva, 24, 0.008, 8), plastico(COR.preto)));
    }
    const zf = ctx.frenteColete + 0.008;
    [-1, 1].forEach((l) => {
      g.add(barraEntre([l * 0.10, 1.535, -0.06], [l * 0.10, 1.505, zf - 0.02], 0.05, 0.016, tecido(COR.preto)));
      g.add(barraEntre([l * 0.10, 1.49, zf], [l * 0.115, 1.17, zf], 0.048, 0.014, tecido(COR.preto)));
      g.add(fivela(l * 0.115, 1.26, zf + 0.01, 0.045));
    });
    return g;
  },
};

// ---------- Armas ----------
const MODELO_ARMA = {
  "M4": "ar-m4", "M4 MWS": "ar-m4b", "SR-25": "ar-m4", "G36": "ar-m4b", "AK": "ar-ak", "MP5": "smg-mp5",
  "VSR-10": "sniper-bolt", "Striker": "sniper-thumb", "Shotgun M870": "shotgun",
};
const MODELO_PISTOLA = { "Glock TM": "pistola-glock", "Glock WE": "pistola-glock", "Glock 18C AEP": "pistola-glock", "1911 WE": "pistola-1911", "Hi-Capa TM": "pistola-hicapa", "M9 KJ": "pistola-m9" };

// ---------- Visualizador ----------
class Visualizador {
  constructor(container) {
    this.el = container;
    this.cache = new Map();
    this.loader = new GLTFLoader();
    this.versao = 0;
  }

  async iniciar() {
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.className = "ml-canvas";
    this.el.append(r.domElement);

    const cena = (this.cena = new THREE.Scene());
    const pmrem = new THREE.PMREMGenerator(r);
    cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    cena.environmentIntensity = 0.55;

    cena.add(new THREE.HemisphereLight(0xd8dcc8, 0x14170f, 0.55));
    const luz = new THREE.DirectionalLight(0xffefd6, 2.4);
    luz.position.set(1.4, 3.2, 2.2);
    luz.castShadow = true;
    luz.shadow.mapSize.set(1024, 1024);
    Object.assign(luz.shadow.camera, { left: -1.1, right: 1.1, top: 2.2, bottom: -0.2, near: 0.5, far: 8 });
    luz.shadow.bias = -0.0005;
    luz.shadow.normalBias = 0.02;
    luz.shadow.radius = 4;
    cena.add(luz);
    const recorte = new THREE.DirectionalLight(0xa9c2ff, 1.6);
    recorte.position.set(-2.2, 2.0, -2.4);
    cena.add(recorte);
    const preenchimento = new THREE.DirectionalLight(0xffe2b8, 0.35);
    preenchimento.position.set(-1.5, 0.8, 2.5);
    cena.add(preenchimento);

    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.ShadowMaterial({ opacity: 0.45 }));
    sombra.rotation.x = -Math.PI / 2;
    sombra.receiveShadow = true;
    cena.add(sombra);
    const cv = canvas(256), gc = cv.getContext("2d"), gr = gc.createRadialGradient(128, 128, 6, 128, 128, 128);
    gr.addColorStop(0, "rgba(210,178,100,0.32)"); gr.addColorStop(0.45, "rgba(130,115,70,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    gc.fillStyle = gr; gc.fillRect(0, 0, 256, 256);
    const anel = new THREE.Mesh(new THREE.CircleGeometry(1.0, 48), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    anel.rotation.x = -Math.PI / 2;
    anel.position.y = 0.001;
    cena.add(anel);

    const cam = (this.cam = new THREE.PerspectiveCamera(28, 1, 0.1, 30));
    cam.position.set(1.05, 1.22, 3.95);
    const ctl = (this.ctl = new OrbitControls(cam, r.domElement));
    ctl.target.set(0.14, 0.93, 0);
    ctl.enablePan = false;
    ctl.minDistance = 1.4; ctl.maxDistance = 5;
    ctl.minPolarAngle = 1.05; ctl.maxPolarAngle = 1.85;
    ctl.enableDamping = true;
    ctl.dampingFactor = 0.12;
    ctl.addEventListener("change", () => this.pedirQuadro());
    ctl.update();

    const gltf = await this.loader.loadAsync("modelos/operador.glb");
    this.corpo = gltf.scene;
    this.matCorpo = materialCorpo();
    this.corpo.traverse((o) => { if (o.isMesh) { o.material = this.matCorpo; o.frustumCulled = false; o.castShadow = o.receiveShadow = true; } });
    posar(this.corpo);
    cena.add(this.corpo);
    this.equip = new THREE.Group();
    cena.add(this.equip);

    this.ro = new ResizeObserver(() => this.redimensionar());
    this.ro.observe(this.el);
    this.redimensionar();
    return true;
  }

  // desenha só quando algo muda (economiza bateria); o amortecimento pede mais quadros sozinho
  pedirQuadro() {
    if (this.quadro) return;
    this.quadro = requestAnimationFrame(() => {
      this.quadro = 0;
      if (this.ctl.update()) this.pedirQuadro();
      this.render();
    });
  }
  redimensionar() {
    const w = this.el.clientWidth || 300, h = this.el.clientHeight || 500;
    this.renderer.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
    this.render();
  }
  render() { if (this.renderer) this.renderer.render(this.cena, this.cam); }

  async modelo(nome) {
    if (!this.cache.has(nome)) {
      this.cache.set(nome, this.loader.loadAsync("modelos/armas/" + nome + ".glb").then((g) => {
        g.scene.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = o.receiveShadow = true;
          const lista = Array.isArray(o.material) ? o.material : [o.material];
          lista.forEach((m) => {
            const hsl = {}; m.color.getHSL(hsl);
            const madeira = hsl.h < 0.12 && hsl.s > 0.2;
            m.color.multiplyScalar(madeira ? 2.1 : 1.6);
            m.roughness = madeira ? 0.6 : 0.48;
            m.metalness = madeira ? 0 : 0.55;
            m.envMapIntensity = 0.9;
          });
        });
        return g.scene;
      }));
    }
    const cena = await this.cache.get(nome);
    return cena.clone(true);
  }

  roupas(pv) {
    const U = this.matCorpo.userData.U;
    const camisa = (pv.camisa || [])[0], calca = (pv.calca || [])[0], bota = (pv.calcado || [])[0], luva = (pv.luvas || [])[0];
    const masc = (pv.mascara || [])[0];
    U.uCamisaOn.value = camisa ? 1 : 0;
    if (camisa) {
      const t = a(camisa, "tipo");
      U.uCamisaCamo.value = t === "Jaqueta" ? 0 : 1;
      U.uCamisaCor.value.set(t === "Jaqueta" ? COR.coyote : t === "Combat shirt" ? COR.ranger : COR.oliva);
      U.uCombat.value = t === "Combat shirt" ? 1 : 0;
      U.uMangaCurta.value = nomeTem(camisa, /Camiseta/) ? 1 : 0;
    }
    U.uCalcaOn.value = calca ? 1 : 0;
    if (calca) { U.uCalcaCamo.value = 1; U.uBermuda.value = a(calca, "tipo") === "Bermuda" ? 1 : 0; }
    U.uBotaOn.value = bota ? 1 : 0;
    if (bota) {
      const t = a(bota, "tipo");
      U.uBotaAlt.value = t === "Cano alto" ? 0.27 : t === "Cano médio" ? 0.19 : 0.11;
      U.uBotaCor.value.set(t === "Tênis" ? COR.tenis : COR.bota);
    }
    U.uLuvaOn.value = luva ? 1 : 0;
    if (luva) { U.uMeioDedo.value = a(luva, "tipo") === "Meio-dedo" ? 1 : 0; U.uLuvaCor.value.set(nomeTem(luva, /M-Pact/) ? "#2a2c27" : COR.preto); }
    U.uCabecaOn.value = masc && a(masc, "tipo") === "Balaclava" ? 1 : 0;
  }

  // Arma principal com mira e acessórios (na horizontal, cano para +X)
  async armaMontada(arma, pv, versao) {
    const nome = MODELO_ARMA[a(arma, "plataforma")] || "ar-m4";
    const m = await this.modelo(nome);
    if (versao !== this.versao) return null;
    const g = new THREE.Group(); g.add(m);
    const cx = new THREE.Box3().setFromObject(m), comp = cx.max.x - cx.min.x;
    const meio = (cx.min.y + cx.max.y) / 2;
    const miras = pv.mira || [];
    if (miras.length && !nome.startsWith("sniper")) {
      const t = a(miras[0], "tipo"), xm = cx.min.x + comp * (nome === "ar-ak" ? 0.42 : 0.40);
      const ym = meio + (nome === "ar-ak" ? 0.04 : 0.055);
      if (t === "LPVO" || t === "Luneta variável") {
        const l = await this.modelo("acc-luneta");
        if (versao !== this.versao) return null;
        l.scale.setScalar(t === "LPVO" ? 0.8 : 1); g.add(em(l, xm, ym + 0.03, 0));
      } else if (t === "Luneta fixa") {
        g.add(em(malha(new THREE.CylinderGeometry(0.02, 0.023, 0.14, 24), plastico(COR.preto, { metalness: 0.5 })), xm, ym + 0.032, 0, 0, 0, Math.PI / 2));
        g.add(em(malha(new THREE.CircleGeometry(0.019, 24), LENTE()), xm + 0.0705, ym + 0.032, 0, 0, Math.PI / 2));
      } else if (t === "Holográfica") {
        g.add(em(caixa(0.075, 0.05, 0.042, plastico(COR.preto, { metalness: 0.4 }), 0.008), xm, ym + 0.02, 0));
        g.add(em(caixa(0.004, 0.035, 0.032, LENTE(), 0.003), xm + 0.03, ym + 0.025, 0));
      } else if (t === "Red dot") {
        g.add(em(malha(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 24), plastico(COR.preto, { metalness: 0.4 })), xm, ym + 0.028, 0, 0, 0, Math.PI / 2));
        g.add(em(caixa(0.04, 0.012, 0.03, plastico(COR.preto), 0.003), xm, ym + 0.006, 0));
        g.add(em(malha(new THREE.CircleGeometry(0.017, 24), LENTE()), xm + 0.026, ym + 0.028, 0, 0, Math.PI / 2));
      }
    }
    for (const p of pv.acessRifle || []) {
      const t = a(p, "tipo");
      const xf = cx.min.x + comp * 0.74, yb = meio - 0.03;
      if (t === "Empunhadura") { const q = await this.modelo("acc-grip"); if (versao !== this.versao) return null; q.scale.setScalar(0.7); g.add(em(q, xf, yb - 0.035, 0)); }
      if (t === "Lanterna") { const q = await this.modelo("acc-lanterna"); if (versao !== this.versao) return null; g.add(em(q, xf + 0.04, yb + 0.02, 0.03)); }
      if (t === "Bipé") { const q = await this.modelo("acc-bipe"); if (versao !== this.versao) return null; g.add(em(q, cx.min.x + comp * 0.8, cx.min.y - 0.06, 0)); }
      if (t === "Bandoleira") {
        const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(cx.min.x + 0.03, meio - 0.02, -0.014), new THREE.Vector3(cx.min.x + comp * 0.45, meio - 0.16, -0.016), new THREE.Vector3(cx.min.x + comp * 0.78, meio - 0.01, -0.014)]);
        g.add(malha(new THREE.TubeGeometry(curva, 24, 0.006, 6), tecido(COR.preto, { rep: 2 })));
      }
    }
    return { grupo: g, comp, cx };
  }

  async atualizar(pv) {
    if (!this.corpo) return;
    const versao = ++this.versao;
    this.roupas(pv);
    const ctx = {
      temCapacete: !!(pv.capacete && pv.capacete.length && a(pv.capacete[0], "tipo") !== "Boné"),
      frenteColete: pv.colete && pv.colete.length ? (a(pv.colete[0], "tipo") === "Chest rig" ? 0.185 : 0.177) : 0.125,
      corColete: pv.colete && pv.colete.length ? corColete(pv.colete[0]) : null,
    };
    const novo = new THREE.Group();
    for (const [vaga, f] of Object.entries(PECA)) if (pv[vaga] && pv[vaga].length) novo.add(f(pv[vaga], ctx));

    // Pistola: no coldre de perna ou na cintura
    const pistola = (pv.armaSecundaria || [])[0];
    const temColdre = pv.coldre && pv.coldre.length;
    if (temColdre) {
      const rigido = a(pv.coldre[0], "tipo") === "Rígido";
      const coldre = new THREE.Group();
      coldre.add(em(caixa(0.05, 0.18, 0.085, rigido ? plastico(COR.preto, { roughness: 0.4 }) : tecido(COR.ranger), 0.018), 0, -0.03, 0));
      coldre.add(em(caixa(0.012, 0.22, 0.06, tecido(COR.preto), 0.006), 0.03, -0.06, 0));
      [0.80, 0.70].forEach((yy) => {
        const tira = malha(new THREE.TorusGeometry(0.094, 0.009, 6, 32), tecido(COR.preto, { rep: 1, rx: 6 }));
        tira.scale.set(1, 1, 0.12);
        coldre.add(em(tira, 0.10, yy - 0.86, 0.0, Math.PI / 2));
        coldre.add(fivela(0.075, yy - 0.86, 0.088, 0.03));
      });
      em(coldre, -0.222, 0.86, -0.01);
      novo.add(coldre);
    }
    if (pistola) {
      const m = await this.modelo(MODELO_PISTOLA[a(pistola, "plataforma")] || "pistola-glock");
      if (versao !== this.versao) return;
      const g = new THREE.Group(); g.add(m);
      if (temColdre) em(g, -0.222, 0.905, -0.01, 0, Math.PI / 2, -Math.PI / 2 + 0.15);
      else em(g, -0.2, 1.0, 0.05, 0, Math.PI / 2, -Math.PI / 2 + 0.3);
      novo.add(g);
    }

    // Arma principal: em pé, ao lado do operador, num expositor
    const arma = (pv.armaPrincipal || [])[0];
    if (arma) {
      const r = await this.armaMontada(arma, pv, versao);
      if (!r || versao !== this.versao) return;
      const expo = new THREE.Group();
      expo.add(r.grupo);
      r.grupo.position.set(-(r.cx.min.x + r.cx.max.x) / 2, -(r.cx.min.y + r.cx.max.y) / 2, 0);
      const altura = Math.max(0.62, r.comp / 2 + 0.07);
      expo.rotation.set(0, -0.35, Math.PI / 2 - 0.06);
      expo.position.set(0.47, altura, 0.12);
      novo.add(expo);
      novo.add(em(malha(new THREE.CylinderGeometry(0.11, 0.13, 0.025, 40), plastico("#24271f", { metalness: 0.5, roughness: 0.4 })), 0.47, 0.0125, 0.12));
      novo.add(em(malha(new THREE.CylinderGeometry(0.006, 0.006, altura - 0.12, 8), metal("#555")), 0.47, (altura - 0.12) / 2 + 0.02, 0.07));
    }

    if (versao !== this.versao) return;
    this.cena.remove(this.equip);
    this.equip.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.equip = novo;
    this.cena.add(novo);
    this.render();
  }
}

// ---------- API usada pelo app.js ----------
function suportaWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

let vis = null;
window.Operador3D = {
  disponivel: suportaWebGL(),
  async iniciar(container) {
    if (!this.disponivel) return false;
    try {
      vis = new Visualizador(container);
      await vis.iniciar();
      return true;
    } catch (e) {
      console.warn("Operador 3D indisponível:", e);
      vis = null;
      return false;
    }
  },
  atualizar(pv) { if (vis) vis.atualizar(pv).catch((e) => console.warn(e)); },
  redimensionar() { if (vis) vis.redimensionar(); },
};
window.dispatchEvent(new Event("operador3d-carregado"));
