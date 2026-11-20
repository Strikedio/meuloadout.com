/*
 * Operador 3D do Meu Loadout
 * ==========================
 * - Personagem base: "Universal Base Characters" by Quaternius (CC0 / domínio público)
 * - Armas e acessórios: "Ultimate Gun Pack" by Quaternius (CC0 / domínio público)
 * - Equipamento (capacete, colete, cinto, coldre...): modelado aqui, em código (original)
 * - Biblioteca 3D: three.js (licença MIT), em /vendor/three
 *
 * Só desenha a partir dos atributos do catálogo: nenhum texto digitado pelo usuário entra aqui.
 */
import * as THREE from "../vendor/three/three.module.min.js";
import { GLTFLoader } from "../vendor/three/GLTFLoader.js";
import { OrbitControls } from "../vendor/three/OrbitControls.js";

const COR = {
  preto: 0x1b1d18, grafite: 0x2a2d26, ranger: 0x4b5236, oliva: 0x585f3c, coyote: 0x806b48,
  tan: 0xa08a62, madeira: 0x6e4124, metal: 0x3a3d38, lente: 0x0b0e10, bota: 0x2b2620, tenis: 0x3b3d38,
};

// ---------- Utilidades ----------
const a = (p, campo) => (p && p.a ? p.a[campo] : undefined);
const nomeTem = (p, re) => !!(p && p.nome && re.test(p.nome));

function texturaCamo() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#5a5f3e"; g.fillRect(0, 0, 256, 256);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const manchas = (cor, n, rmin, rmax) => {
    g.fillStyle = cor;
    for (let i = 0; i < n; i++) {
      const x = rnd() * 256, y = rnd() * 256, r = rmin + rnd() * (rmax - rmin);
      g.beginPath();
      g.ellipse(x, y, r, r * (0.5 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  };
  manchas("#3f4428", 26, 10, 26); manchas("#7a7350", 22, 6, 18); manchas("#2e3220", 18, 3, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

let CAMO = null;
function mat(cor, extra) {
  if (cor === "camo") return new THREE.MeshStandardMaterial(Object.assign({ map: CAMO, roughness: 0.9 }, extra || {}));
  return new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: 0.85, metalness: 0.05 }, extra || {}));
}
function caixa(w, h, d, cor, raio) {
  let geo;
  if (raio) {
    const r = Math.min(raio, w / 2 - 0.001, h / 2 - 0.001);
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const bev = Math.min(0.006, d / 4);
    geo = new THREE.ExtrudeGeometry(s, { depth: d - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 6 });
    geo.translate(0, 0, -(d - bev * 2) / 2);
  } else {
    geo = new THREE.BoxGeometry(w, h, d);
  }
  return new THREE.Mesh(geo, typeof cor === "object" ? cor : mat(cor));
}
function em(obj, x, y, z, rx, ry, rz) {
  obj.position.set(x, y, z);
  if (rx || ry || rz) obj.rotation.set(rx || 0, ry || 0, rz || 0);
  return obj;
}
function barraEntre(p1, p2, larg, esp, cor) {
  const v1 = new THREE.Vector3(...p1), v2 = new THREE.Vector3(...p2);
  const m = caixa(larg, v1.distanceTo(v2), esp, cor);
  m.position.copy(v1).add(v2).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
  return m;
}

// ---------- Corpo: roupas pintadas direto no manequim (shader) ----------
function materialCorpo() {
  const m = new THREE.MeshStandardMaterial({ color: 0x3a3e36, roughness: 0.8 });
  const U = {
    uCamisaOn: { value: 0 }, uCamisaCor: { value: new THREE.Color(COR.ranger) }, uCamisaCamo: { value: 0 }, uMangaCurta: { value: 0 }, uCombat: { value: 0 },
    uCalcaOn: { value: 0 }, uCalcaCor: { value: new THREE.Color(COR.oliva) }, uCalcaCamo: { value: 0 }, uBermuda: { value: 0 },
    uBotaOn: { value: 0 }, uBotaAlt: { value: 0.0 }, uBotaCor: { value: new THREE.Color(COR.bota) },
    uLuvaOn: { value: 0 }, uLuvaCor: { value: new THREE.Color(COR.preto) }, uMeioDedo: { value: 0 },
    uCabecaOn: { value: 0 }, uCabecaCor: { value: new THREE.Color(COR.preto) },
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
vec3 ml_camo(vec3 p){ float n = ml_n(p * 9.0) * 0.62 + ml_n(p * 23.0) * 0.38;
  vec3 c = vec3(0.353, 0.373, 0.243);
  if (n < 0.40) c = vec3(0.247, 0.267, 0.157);
  if (n > 0.64) c = vec3(0.478, 0.451, 0.314);
  if (n > 0.78) c = vec3(0.180, 0.196, 0.125);
  return pow(c, vec3(2.2)); }`)
      .replace("#include <color_fragment>", `#include <color_fragment>
{
  vec3 p = vBind; float ax = abs(p.x);
  bool braco = ax > 0.23 && p.y > 1.28;
  bool mao = braco && ax > 0.69;
  bool cabeca = !braco && p.y > 1.565;
  bool tronco = !braco && p.y > 1.02 && p.y <= 1.565;
  bool perna = !braco && p.y <= 1.02;
  bool pe = !braco && p.y < uBotaAlt;
  vec3 cor = diffuseColor.rgb;
  if (uCalcaOn > 0.5 && (perna || (!braco && p.y < 1.06)) && !(pe && uBotaOn > 0.5) && (uBermuda < 0.5 || p.y > 0.60))
    cor = uCalcaCamo > 0.5 ? ml_camo(p) : uCalcaCor;
  if (uCamisaOn > 0.5 && ((tronco && p.y > 1.04) || (braco && !mao && (uMangaCurta < 0.5 || ax < 0.40)))) {
    cor = uCamisaCamo > 0.5 ? ml_camo(p) : uCamisaCor;
    if (uCombat > 0.5 && tronco) cor = uCamisaCor;
  }
  if (uBotaOn > 0.5 && pe) cor = uBotaCor;
  if (uLuvaOn > 0.5 && mao && !(uMeioDedo > 0.5 && ax > 0.80)) cor = uLuvaCor;
  if (uCabecaOn > 0.5 && cabeca && !(p.y > 1.675 && p.y < 1.728 && p.z > 0.04)) cor = uCabecaCor;
  diffuseColor.rgb = cor;
}`);
  };
  m.userData.U = U;
  return m;
}

// ---------- Pose: abaixa os braços da pose em T ----------
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
  const Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0);
  if (ossos.upperarm_l) girarNoMundo(ossos.upperarm_l, Z, -1.36);
  if (ossos.upperarm_r) girarNoMundo(ossos.upperarm_r, Z, 1.36);
  if (ossos.lowerarm_l) girarNoMundo(ossos.lowerarm_l, X, -0.22);
  if (ossos.lowerarm_r) girarNoMundo(ossos.lowerarm_r, X, -0.22);
  if (ossos.hand_l) girarNoMundo(ossos.hand_l, Z, 0.12);
  if (ossos.hand_r) girarNoMundo(ossos.hand_r, Z, -0.12);
  return ossos;
}

// ---------- Equipamento (posições em metros, personagem de frente para +Z) ----------
function corColete(p) {
  if (nomeTem(p, /Invictus/)) return "camo";
  if (nomeTem(p, /JPC/)) return COR.ranger;
  if (a(p, "tipo") === "Chest rig") return COR.oliva;
  return COR.coyote;
}
const PECA = {
  capacete(ps) {
    const p = ps[0], g = new THREE.Group();
    if (a(p, "tipo") === "Boné") {
      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.106, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.47), mat(COR.oliva));
      g.add(em(cup, 0, 1.712, -0.004));
      cup.scale.set(1, 0.95, 1.12);
      g.add(em(caixa(0.17, 0.008, 0.10, COR.ranger, 0.03), 0, 1.722, 0.13, 0.16));
      return g;
    }
    const cor = nomeTem(p, /Emerson/) ? COR.ranger : COR.tan;
    const casco = new THREE.Mesh(new THREE.SphereGeometry(0.122, 36, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(cor, { roughness: 0.7 }));
    casco.scale.set(1, 0.98, 1.1);
    g.add(em(casco, 0, 1.70, -0.005));
    [-1, 1].forEach((l) => g.add(em(caixa(0.018, 0.05, 0.13, COR.grafite, 0.004), l * 0.12, 1.715, -0.005)));
    g.add(em(caixa(0.055, 0.035, 0.02, COR.grafite, 0.006), 0, 1.79, 0.112, -0.5));
    return g;
  },
  oculos(ps) {
    const goggle = a(ps[0], "tipo") === "Goggle";
    const g = new THREE.Group();
    const lente = caixa(goggle ? 0.19 : 0.17, goggle ? 0.062 : 0.044, 0.03, mat(COR.lente, { roughness: 0.12, metalness: 0.6 }), 0.018);
    g.add(em(lente, 0, 1.703, 0.107));
    const tira = new THREE.Mesh(new THREE.TorusGeometry(0.104, goggle ? 0.009 : 0.004, 6, 40), mat(COR.preto));
    tira.scale.set(1, 1.12, 1);
    g.add(em(tira, 0, 1.703, 0.0, Math.PI / 2));
    return g;
  },
  mascara(ps) {
    const t = a(ps[0], "tipo"), g = new THREE.Group();
    if (t === "Balaclava") return g; // pintada no corpo (shader)
    const tela = mat(0x2a2e27, { roughness: 0.6 });
    const malha = new THREE.MeshBasicMaterial({ color: 0x55604c, wireframe: true });
    if (t === "Full face") {
      const geo = new THREE.CylinderGeometry(0.106, 0.098, 0.19, 28, 4, true, -Math.PI / 2, Math.PI);
      g.add(em(new THREE.Mesh(geo, tela), 0, 1.675, 0.005), em(new THREE.Mesh(geo, malha), 0, 1.675, 0.006));
      g.add(em(caixa(0.18, 0.06, 0.03, mat(COR.lente, { roughness: 0.12, metalness: 0.6 }), 0.02), 0, 1.705, 0.112));
      return g;
    }
    const geo = new THREE.CylinderGeometry(0.098, 0.082, 0.085, 24, 3, true, -Math.PI / 2.2, Math.PI / 1.1);
    g.add(em(new THREE.Mesh(geo, tela), 0, 1.632, 0.012), em(new THREE.Mesh(geo, malha), 0, 1.632, 0.013));
    return g;
  },
  comunicacao(ps, ctx) {
    const g = new THREE.Group();
    ps.forEach((p) => {
      const t = a(p, "tipo");
      if (t === "Headset") {
        const cor = nomeTem(p, /Earmor/) ? COR.coyote : COR.ranger;
        [-1, 1].forEach((l) => {
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 24), mat(cor, { roughness: 0.6 }));
          g.add(em(cup, l * 0.112, 1.69, -0.005, 0, 0, Math.PI / 2));
        });
        if (!ctx.temCapacete) {
          const arco = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.008, 6, 24, Math.PI), mat(COR.preto));
          g.add(em(arco, 0, 1.70, -0.005));
        }
        g.add(barraEntre([0.10, 1.665, 0.03], [0.035, 1.64, 0.105], 0.006, 0.006, COR.preto));
      } else if (t === "Rádio") {
        const z = ctx.frenteColete + 0.02;
        g.add(em(caixa(0.05, 0.11, 0.03, COR.preto, 0.006), 0.14, 1.33, z));
        g.add(em(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6), mat(COR.preto)), 0.155, 1.46, z));
      } else if (t === "PTT") {
        g.add(em(caixa(0.035, 0.035, 0.02, COR.preto, 0.006), -0.09, 1.40, ctx.frenteColete + 0.01));
      }
    });
    return g;
  },
  colete(ps) {
    const p = ps[0], t = a(p, "tipo"), cor = corColete(p), g = new THREE.Group();
    const molle = mat(0x000000, { transparent: true, opacity: 0.28 });
    if (t === "Chest rig") {
      g.add(em(caixa(0.33, 0.16, 0.06, cor, 0.015), 0, 1.20, 0.15));
      [0, 1, 2].forEach((i) => g.add(em(caixa(0.31, 0.007, 0.004, molle), 0, 1.16 + i * 0.035, 0.182)));
      g.add(barraEntre([-0.11, 1.50, 0.06], [0.05, 1.27, 0.15], 0.035, 0.012, COR.grafite));
      g.add(barraEntre([0.11, 1.50, 0.06], [-0.05, 1.27, 0.15], 0.035, 0.012, COR.grafite));
      return g;
    }
    const grande = t === "Colete MOLLE";
    const h = grande ? 0.40 : 0.32, w = grande ? 0.37 : 0.33, y = grande ? 1.27 : 1.31;
    g.add(em(caixa(w, h, 0.045, cor, 0.025), 0, y, 0.152));
    g.add(em(caixa(w, h, 0.045, cor, 0.025), 0, y, -0.19));
    [-1, 1].forEach((l) => {
      g.add(em(caixa(0.022, 0.15, 0.31, cor, 0.008), l * (w / 2 + 0.012), y - 0.10, -0.02));
      g.add(em(caixa(0.065, 0.028, 0.34, cor, 0.01), l * 0.105, y + h / 2 + 0.02, -0.02));
    });
    for (let i = 0; i < (grande ? 6 : 4); i++) g.add(em(caixa(w - 0.03, 0.008, 0.004, molle), 0, y - h / 2 + 0.05 + i * 0.035, 0.176));
    g.add(em(caixa(0.13, 0.06, 0.006, mat(0x000000, { transparent: true, opacity: 0.22 })), 0, y + 0.08, 0.177));
    return g;
  },
  pouchPeito(ps, ctx) {
    const g = new THREE.Group(), z = ctx.frenteColete + 0.022;
    ps.forEach((p) => {
      const t = a(p, "tipo");
      if (t === "Porta-carregador") {
        const ak = a(p, "para") === "AK", n = ak ? 2 : 3, w = ak ? 0.085 : 0.07;
        for (let i = 0; i < n; i++) {
          const x = (i - (n - 1) / 2) * (w + 0.008);
          g.add(em(caixa(w, 0.12, 0.045, COR.oliva, 0.01), x, 1.20, z));
          g.add(em(caixa(w - 0.01, 0.03, 0.05, COR.ranger, 0.008), x, 1.265, z + 0.002));
        }
      } else if (t === "Admin") {
        g.add(em(caixa(0.14, 0.10, 0.03, COR.ranger, 0.012), 0, 1.38, z));
      } else if (t === "Porta-rádio") {
        g.add(em(caixa(0.055, 0.13, 0.04, COR.ranger, 0.01), 0.15, 1.33, z));
      }
    });
    return g;
  },
  cinto(ps) {
    const battle = a(ps[0], "tipo") === "Battle belt", g = new THREE.Group();
    const anel = new THREE.Mesh(new THREE.CylinderGeometry(0.178, 0.178, battle ? 0.07 : 0.035, 40, 1, true),
      mat(battle ? COR.ranger : COR.preto, { side: THREE.DoubleSide }));
    anel.scale.set(1, 1, 0.76);
    g.add(em(anel, 0, 1.025, -0.02));
    g.add(em(caixa(battle ? 0.07 : 0.05, battle ? 0.045 : 0.03, 0.012, battle ? COR.preto : COR.metal, 0.004), 0, 1.025, 0.118));
    return g;
  },
  pouchCinto(ps) {
    const g = new THREE.Group();
    ps.forEach((p) => {
      const t = a(p, "tipo"), para = a(p, "para");
      if (t === "Porta-carregador" && para === "Pistola") {
        g.add(em(caixa(0.032, 0.085, 0.03, COR.oliva, 0.006), 0.085, 1.00, 0.122), em(caixa(0.032, 0.085, 0.03, COR.oliva, 0.006), 0.122, 1.00, 0.112));
      } else if (t === "Porta-carregador") {
        g.add(em(caixa(0.065, 0.11, 0.045, COR.oliva, 0.01), 0.165, 0.995, 0.06, 0, 0.5));
      } else if (t === "Porta-torniquete") {
        g.add(em(caixa(0.045, 0.10, 0.04, 0x5a1f1f, 0.01), 0.185, 1.0, -0.03, 0, 1.4));
      } else if (t === "Dump pouch") {
        g.add(em(caixa(0.11, 0.13, 0.06, COR.ranger, 0.02), -0.10, 0.94, -0.165));
      }
    });
    return g;
  },
  joelheira(ps) {
    const g = new THREE.Group();
    if (a(ps[0], "tipo") === "Interna") return g;
    [-1, 1].forEach((l) => g.add(em(caixa(0.10, 0.11, 0.04, COR.preto, 0.03), l * 0.114, 0.54, 0.05)));
    return g;
  },
  calcado(ps) {
    const g = new THREE.Group();
    if (a(ps[0], "tipo") === "Tênis") return g;
    [-1, 1].forEach((l) => g.add(em(caixa(0.115, 0.03, 0.28, COR.preto, 0.02), l * 0.114, 0.012, -0.015)));
    return g;
  },
  mochila(ps, ctx) {
    const t = a(ps[0], "tipo"), g = new THREE.Group();
    const dim = t === "3 dias" ? [0.36, 0.52, 0.22, 1.24, -0.32] : t === "Hidratação" ? [0.24, 0.40, 0.07, 1.30, -0.245] : [0.31, 0.43, 0.16, 1.27, -0.29];
    const cor = t === "3 dias" ? COR.coyote : COR.ranger;
    g.add(em(caixa(dim[0], dim[1], dim[2], cor, 0.04), 0, dim[3], dim[4]));
    if (t !== "Hidratação") g.add(em(caixa(dim[0] - 0.08, dim[1] * 0.4, 0.04, cor, 0.02), 0, dim[3] - dim[1] * 0.18, dim[4] - dim[2] / 2 - 0.015));
    const zf = ctx.frenteColete + 0.006;
    [-1, 1].forEach((l) => {
      g.add(barraEntre([l * 0.10, 1.53, -0.04], [l * 0.10, 1.50, zf - 0.02], 0.045, 0.012, COR.preto));
      g.add(barraEntre([l * 0.10, 1.49, zf], [l * 0.115, 1.17, zf], 0.045, 0.012, COR.preto));
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
    CAMO = texturaCamo();
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.domElement.className = "ml-canvas";
    this.el.append(r.domElement);

    const cena = (this.cena = new THREE.Scene());
    cena.add(new THREE.HemisphereLight(0xd8dcc8, 0x1a1d14, 1.25));
    const luz = new THREE.DirectionalLight(0xfff2dd, 2.6);
    luz.position.set(1.6, 3, 2.4);
    cena.add(luz);
    const recorte = new THREE.DirectionalLight(0xb8c8ff, 1.1);
    recorte.position.set(-2, 2.2, -2.5);
    cena.add(recorte);

    // chão: disco com degradê
    const cv = document.createElement("canvas"); cv.width = cv.height = 128;
    const gc = cv.getContext("2d"); const gr = gc.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, "rgba(200,168,90,0.30)"); gr.addColorStop(0.5, "rgba(120,110,70,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    gc.fillStyle = gr; gc.fillRect(0, 0, 128, 128);
    const chao = new THREE.Mesh(new THREE.CircleGeometry(0.7, 40), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    chao.rotation.x = -Math.PI / 2;
    cena.add(chao);

    const cam = (this.cam = new THREE.PerspectiveCamera(28, 1, 0.1, 30));
    cam.position.set(0.7, 1.2, 3.55);
    const ctl = (this.ctl = new OrbitControls(cam, r.domElement));
    ctl.target.set(0, 0.97, 0);
    ctl.enablePan = false;
    ctl.minDistance = 1.6; ctl.maxDistance = 5;
    ctl.minPolarAngle = 1.1; ctl.maxPolarAngle = 1.85;
    ctl.addEventListener("change", () => this.render());
    ctl.update();

    const gltf = await this.loader.loadAsync("modelos/operador.glb");
    this.corpo = gltf.scene;
    this.matCorpo = materialCorpo();
    this.corpo.traverse((o) => { if (o.isMesh) { o.material = this.matCorpo; o.frustumCulled = false; } });
    posar(this.corpo);
    cena.add(this.corpo);
    this.equip = new THREE.Group();
    cena.add(this.equip);

    this.ro = new ResizeObserver(() => this.redimensionar());
    this.ro.observe(this.el);
    this.redimensionar();
    return true;
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
        // os modelos vêm escuros: clareia um pouco para a madeira e o metal aparecerem
        g.scene.traverse((o) => {
          if (!o.isMesh) return;
          const lista = Array.isArray(o.material) ? o.material : [o.material];
          lista.forEach((m) => { m.color.multiplyScalar(1.9); m.roughness = 0.55; m.metalness = 0.25; });
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
    if (luva) U.uMeioDedo.value = a(luva, "tipo") === "Meio-dedo" ? 1 : 0;
    U.uCabecaOn.value = masc && a(masc, "tipo") === "Balaclava" ? 1 : 0;
  }

  async atualizar(pv) {
    if (!this.corpo) return;
    const versao = ++this.versao;
    this.roupas(pv);
    const ctx = {
      temCapacete: !!(pv.capacete && pv.capacete.length && a(pv.capacete[0], "tipo") !== "Boné"),
      frenteColete: pv.colete && pv.colete.length ? (a(pv.colete[0], "tipo") === "Chest rig" ? 0.18 : 0.175) : 0.125,
    };
    const novo = new THREE.Group();
    for (const [vaga, f] of Object.entries(PECA)) if (pv[vaga] && pv[vaga].length) novo.add(f(pv[vaga], ctx));

    // Pistola (no coldre ou na cintura)
    const pistola = (pv.armaSecundaria || [])[0];
    if (pistola) {
      const m = await this.modelo(MODELO_PISTOLA[a(pistola, "plataforma")] || "pistola-glock");
      if (versao !== this.versao) return;
      const g = new THREE.Group(); g.add(m);
      const temColdre = pv.coldre && pv.coldre.length;
      if (temColdre) {
        const rigido = a(pv.coldre[0], "tipo") === "Rígido";
        const coldre = new THREE.Group();
        coldre.add(em(caixa(0.045, 0.17, 0.08, rigido ? COR.preto : COR.ranger, 0.012), 0, -0.03, 0));
        [0.80, 0.70].forEach((y) => {
          const tira = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.008, 6, 28), mat(COR.preto));
          coldre.add(em(tira, 0.10, y - 0.86, 0.0, Math.PI / 2));
        });
        em(coldre, -0.215, 0.86, -0.01);
        novo.add(coldre);
        em(g, -0.215, 0.905, -0.01, 0, Math.PI / 2, -Math.PI / 2 + 0.15);
      } else {
        em(g, -0.19, 1.0, 0.04, 0, Math.PI / 2, -Math.PI / 2 + 0.3);
      }
      novo.add(g);
    } else if (pv.coldre && pv.coldre.length) {
      novo.add(em(caixa(0.045, 0.17, 0.08, a(pv.coldre[0], "tipo") === "Rígido" ? COR.preto : COR.ranger, 0.012), -0.215, 0.83, -0.01));
    }

    // Arma principal na bandoleira, atravessada no peito
    const arma = (pv.armaPrincipal || [])[0];
    if (arma) {
      const plat = a(arma, "plataforma");
      const nome = MODELO_ARMA[plat] || "ar-m4";
      const m = await this.modelo(nome);
      if (versao !== this.versao) return;
      const g = new THREE.Group(); g.add(m);
      const cx = new THREE.Box3().setFromObject(m), comp = cx.max.x - cx.min.x;
      const topo = cx.max.y, base = cx.min.y;
      const sniper = nome.startsWith("sniper");
      const miras = pv.mira || [];
      if (miras.length && !sniper) {
        const t = a(miras[0], "tipo"), xm = cx.min.x + comp * (nome === "ar-ak" ? 0.42 : 0.40);
        const ym = (cx.min.y + cx.max.y) / 2 + (nome === "ar-ak" ? 0.04 : 0.055);
        if (t === "LPVO" || t === "Luneta variável") {
          const l = await this.modelo("acc-luneta");
          if (versao !== this.versao) return;
          l.scale.setScalar(t === "LPVO" ? 0.8 : 1); g.add(em(l, xm, ym + 0.03, 0));
        } else if (t === "Luneta fixa") {
          const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.14, 16), mat(COR.preto));
          g.add(em(tubo, xm, ym + 0.03, 0, 0, 0, Math.PI / 2));
        } else if (t === "Holográfica") {
          g.add(em(caixa(0.07, 0.05, 0.04, COR.preto, 0.008), xm, ym + 0.02, 0));
        } else if (t === "Red dot") {
          g.add(em(caixa(0.05, 0.04, 0.035, COR.preto, 0.01), xm, ym + 0.015, 0));
        }
      }
      for (const p of pv.acessRifle || []) {
        const t = a(p, "tipo");
        const xf = cx.min.x + comp * 0.74, yb = (cx.min.y + cx.max.y) / 2 - 0.03;
        if (t === "Empunhadura") { const q = await this.modelo("acc-grip"); if (versao !== this.versao) return; q.scale.setScalar(0.7); g.add(em(q, xf, yb - 0.035, 0)); }
        if (t === "Lanterna") { const q = await this.modelo("acc-lanterna"); if (versao !== this.versao) return; g.add(em(q, xf + 0.04, yb + 0.02, 0.03)); }
        if (t === "Bipé") { const q = await this.modelo("acc-bipe"); if (versao !== this.versao) return; g.add(em(q, cx.min.x + comp * 0.8, base - 0.06, 0)); }
      }
      void topo;
      const z = ctx.frenteColete + (pv.pouchPeito && pv.pouchPeito.length ? 0.09 : 0.06);
      em(g, 0.02, 1.20, z, 0.05, -0.18, 0.62);
      novo.add(g);
      novo.add(barraEntre([-0.14, 1.50, 0.10], [0.20, 0.98, 0.10], 0.022, 0.006, COR.grafite));
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
