/*
 * Arte do Meu Loadout — personagem e peças em SVG (desenhos originais)
 * ====================================================================
 * Coordenadas do personagem: viewBox "0 0 300 600" (de frente, centro em x = 150).
 * Cada vaga tem uma função que desenha a peça NO CORPO, escolhendo a variação pelos
 * atributos do produto (ex.: AK com madeira, M4, sniper; capacete ou boné...).
 * O mesmo desenho, recortado, vira o ícone do slot no inventário.
 *
 * Só monta texto SVG estático: nenhum texto digitado pelo usuário entra aqui.
 */
(function () {
  "use strict";

  // ---------- Paleta ----------
  const C = {
    preto: "#1b1d18", grafite: "#2a2d26", ranger: "#4b5236", oliva: "#585f3c",
    coyote: "#806b48", tan: "#a08a62", madeira: "#6e4124", metal: "#3a3d38",
    linha: "#0f110d", lente: "#0d1012", brilho: "#9fb3b8", tela: "#2f332b",
  };

  // Definições compartilhadas (padrões de camuflagem e gradientes) — inseridas 1 vez na página
  const DEFS = `
  <svg class="ml-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="ml-pele" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2b2f27"/><stop offset=".5" stop-color="#3a3f34"/><stop offset="1" stop-color="#262a22"/>
    </linearGradient>
    <linearGradient id="ml-sombra" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".45" stop-color="#000" stop-opacity="0"/>
      <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
    </linearGradient>
    <pattern id="ml-camo" width="60" height="60" patternUnits="userSpaceOnUse">
      <rect width="60" height="60" fill="#5a5f3e"/>
      <path d="M4 8c10-6 18 2 14 9s-14 4-14-9zM34 4c9 0 14 8 6 12s-16-8-6-12zM40 30c12-2 16 10 6 14s-14-12-6-14zM8 38c8-4 16 4 10 10s-16 0-10-10zM24 22c5-3 10 2 6 6s-10 0-6-6z" fill="#3f4428"/>
      <path d="M22 4c6 0 8 6 2 8s-8-8-2-8zM48 14c6-2 10 4 4 7s-9-5-4-7zM28 40c7-1 9 7 3 9s-9-8-3-9zM2 26c6-2 9 5 3 7s-7-6-3-7zM50 48c5-1 8 5 3 7s-7-6-3-7z" fill="#7a7350"/>
      <path d="M14 26c3-2 6 1 4 3s-6 0-4-3zM40 52c3-1 5 2 3 4s-5-1-3-4zM52 30c2-1 4 1 3 3s-4 0-3-3z" fill="#2e3220"/>
    </pattern>
    <pattern id="ml-tela" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="#1d201a"/><path d="M0 0L4 4M4 0L0 4" stroke="#4a4f43" stroke-width=".6"/>
    </pattern>
    <pattern id="ml-molle" width="10" height="9" patternUnits="userSpaceOnUse">
      <rect width="10" height="9" fill="none"/><rect y="6" width="10" height="2" fill="#000" fill-opacity=".28"/>
    </pattern>
  </defs></svg>`;

  const a = (p, campo) => (p && p.a ? p.a[campo] : undefined);
  const tem = (lista) => lista && lista.length > 0;
  const espelho = (svg) => `<g transform="matrix(-1 0 0 1 300 0)">${svg}</g>`;
  const par = (svg) => svg + espelho(svg);

  // ---------- Manequim (base) ----------
  const G = {
    cabeca: '<ellipse cx="150" cy="60" rx="23" ry="28"/>',
    pescoco: '<path d="M140 82h20l3 22h-26z"/>',
    tronco: '<path d="M106 106Q150 94 194 106Q206 112 205 136Q204 196 192 252L188 292H112L108 252Q96 196 95 136Q94 112 106 106Z"/>',
    braco: '<path d="M100 110Q84 114 82 138L78 214L74 288Q74 300 84 300Q93 300 93 290L99 214L104 150Z"/>',
    bracoCurto: '<path d="M100 110Q84 114 82 138L80 174H101L104 150Z"/>',
    mao: '<ellipse cx="84" cy="310" rx="10" ry="14"/>',
    perna: '<path d="M112 290H150L149 340L145 430L142 538H118L114 430L108 336Z"/>',
    pernaCurta: '<path d="M112 290H150L149 340L147 400H113L108 336Z"/>',
    pe: '<path d="M116 536H144L146 562H104Q102 548 116 536Z"/>',
  };

  function manequim() {
    return `<g class="ml-base" fill="url(#ml-pele)" stroke="#4a5040" stroke-width="1.2">
      ${par(G.braco)}${par(G.mao)}${par(G.perna)}${par(G.pe)}${G.pescoco}${G.tronco}${G.cabeca}
      <g fill="url(#ml-sombra)" stroke="none">${G.tronco}</g>
    </g>`;
  }

  // ---------- Roupas ----------
  function camisa(ps) {
    const p = ps[0];
    const tipo = a(p, "tipo");
    const cor = tipo === "Jaqueta" ? C.coyote : "url(#ml-camo)";
    const curto = /Camiseta/i.test(p.nome || "");
    const b = curto ? G.bracoCurto : G.braco;
    return `<g stroke="${C.linha}" stroke-width="1.2" fill="${cor}">${par(b)}${G.tronco}
      ${tipo === "Combat shirt" ? `<path d="M118 104Q150 98 182 104L186 250H114Z" fill="${C.ranger}"/>` : ""}
      <path d="M137 104l13 12 13-12" fill="none" stroke="${C.linha}" stroke-width="2"/>
      <g fill="url(#ml-sombra)" stroke="none">${G.tronco}</g></g>`;
  }

  function calca(ps) {
    const p = ps[0];
    const bermuda = a(p, "tipo") === "Bermuda";
    const perna = bermuda ? G.pernaCurta : G.perna;
    const joelho = a(p, "tipo") === "Combat pants"
      ? par('<rect x="116" y="390" width="30" height="34" rx="9" fill="#3d4229" stroke="#0f110d"/>') : "";
    return `<g fill="url(#ml-camo)" stroke="${C.linha}" stroke-width="1.2">${par(perna)}
      <path d="M110 286H190L192 304H108Z"/>${joelho}
      ${par('<rect x="110" y="352" width="10" height="26" rx="3" fill="#000" fill-opacity=".25" stroke="none"/>')}</g>`;
  }

  function joelheira(ps) {
    const interna = a(ps[0], "tipo") === "Interna";
    if (interna) return "";
    return par(`<g><rect x="114" y="390" width="34" height="38" rx="11" fill="${C.preto}" stroke="${C.linha}"/>
      <rect x="120" y="398" width="22" height="20" rx="7" fill="${C.grafite}"/>
      <rect x="112" y="400" width="38" height="4" fill="${C.grafite}"/></g>`);
  }

  function calcado(ps) {
    const t = a(ps[0], "tipo");
    const topo = t === "Cano alto" ? 494 : t === "Cano médio" ? 512 : 528;
    const cor = t === "Tênis" ? "#3b3d38" : "#2b2620";
    return par(`<g><path d="M114 ${topo}H146L148 564H102Q100 546 114 536Z" fill="${cor}" stroke="${C.linha}" stroke-width="1.2"/>
      <path d="M102 558H149V566H101Z" fill="${C.preto}"/>
      ${t !== "Tênis" ? `<path d="M118 ${topo + 8}h24M118 ${topo + 16}h24M118 ${topo + 24}h24" stroke="#000" stroke-opacity=".4" stroke-width="1.5"/>` : ""}</g>`);
  }

  function luvas(ps) {
    const t = a(ps[0], "tipo");
    const meio = t === "Meio-dedo";
    return par(`<g><ellipse cx="84" cy="310" rx="11" ry="15" fill="${C.preto}" stroke="${C.linha}"/>
      ${meio ? '<ellipse cx="84" cy="321" rx="8" ry="5" fill="url(#ml-pele)"/>' : ""}
      ${/juntas/i.test(ps[0].nome || "") || /Mechanix M-Pact/.test(ps[0].nome || "") ? `<rect x="76" y="304" width="16" height="6" rx="3" fill="${C.grafite}"/>` : ""}
      <rect x="74" y="294" width="20" height="6" rx="2" fill="${C.grafite}"/></g>`);
  }

  // ---------- Peito ----------
  function corColete(p) {
    if (/Invictus/.test(p.nome || "")) return "url(#ml-camo)";
    if (/JPC/.test(p.nome || "")) return C.ranger;
    if (a(p, "tipo") === "Chest rig") return C.oliva;
    return C.coyote;
  }
  function colete(ps) {
    const p = ps[0], t = a(p, "tipo"), cor = corColete(p);
    if (t === "Chest rig") {
      return `<g stroke="${C.linha}" stroke-width="1.2">
        <path d="M116 106L142 178M184 106L158 178" stroke="${C.grafite}" stroke-width="7"/>
        <path d="M108 176H192L190 240H110Z" fill="${cor}"/><rect x="108" y="176" width="84" height="64" fill="url(#ml-molle)" stroke="none"/>
        <path d="M108 200H96M192 200H204" stroke="${C.grafite}" stroke-width="5"/></g>`;
    }
    const grande = t === "Colete MOLLE";
    const y2 = grande ? 252 : 238;
    return `<g stroke="${C.linha}" stroke-width="1.2">
      <path d="M100 168H112V${y2 - 4}H102Q98 ${y2 - 30} 100 168ZM200 168H188V${y2 - 4}H198Q202 ${y2 - 30} 200 168Z" fill="${cor}"/>
      <rect x="116" y="98" width="17" height="30" rx="4" fill="${cor}"/><rect x="167" y="98" width="17" height="30" rx="4" fill="${cor}"/>
      <path d="M112 118Q150 112 188 118L${grande ? 196 : 190} ${y2}H${grande ? 104 : 110}Z" fill="${cor}"/>
      <path d="M112 118Q150 112 188 118L${grande ? 196 : 190} ${y2}H${grande ? 104 : 110}Z" fill="url(#ml-molle)" stroke="none"/>
      <path d="M124 128H176V150H124Z" fill="#000" fill-opacity=".18" stroke="none"/>
      <rect x="136" y="132" width="28" height="12" rx="2" fill="#000" fill-opacity=".25" stroke="none"/></g>`;
  }

  function pouchPeito(ps) {
    let s = "";
    ps.forEach((p) => {
      const t = a(p, "tipo");
      if (t === "Porta-carregador") {
        const ak = a(p, "para") === "AK";
        const n = ak ? 2 : 3, w = ak ? 22 : 18, x0 = ak ? 126 : 121;
        for (let i = 0; i < n; i++) {
          s += `<rect x="${x0 + i * (w + 2)}" y="198" width="${w}" height="38" rx="3" fill="${C.oliva}" stroke="${C.linha}"/>
                <rect x="${x0 + i * (w + 2) + 2}" y="194" width="${w - 4}" height="10" rx="2" fill="${C.ranger}" stroke="${C.linha}"/>`;
        }
      } else if (t === "Admin") {
        s += `<rect x="128" y="154" width="44" height="34" rx="3" fill="${C.ranger}" stroke="${C.linha}"/><path d="M128 162h44" stroke="${C.linha}"/>`;
      } else if (t === "Porta-rádio") {
        s += `<rect x="176" y="150" width="16" height="40" rx="3" fill="${C.ranger}" stroke="${C.linha}"/>`;
      }
    });
    return s;
  }

  // ---------- Cintura ----------
  function cinto(ps) {
    const battle = a(ps[0], "tipo") === "Battle belt";
    return battle
      ? `<g stroke="${C.linha}" stroke-width="1.2"><path d="M102 268H198L200 300H100Z" fill="${C.ranger}"/>
          <rect x="100" y="268" width="100" height="32" fill="url(#ml-molle)" stroke="none"/>
          <rect x="136" y="282" width="28" height="12" rx="2" fill="${C.preto}"/></g>`
      : `<g stroke="${C.linha}" stroke-width="1.2"><path d="M106 280H194L195 292H105Z" fill="${C.preto}"/>
          <rect x="142" y="279" width="16" height="14" rx="2" fill="${C.metal}"/></g>`;
  }

  function pouchCinto(ps) {
    let s = "";
    ps.forEach((p) => {
      const t = a(p, "tipo"), para = a(p, "para");
      if (t === "Porta-carregador" && para === "Pistola") {
        s += `<rect x="116" y="270" width="9" height="28" rx="2" fill="${C.oliva}" stroke="${C.linha}"/><rect x="126" y="270" width="9" height="28" rx="2" fill="${C.oliva}" stroke="${C.linha}"/>`;
      } else if (t === "Porta-carregador") {
        s += `<rect x="164" y="266" width="16" height="34" rx="3" fill="${C.oliva}" stroke="${C.linha}"/>`;
      } else if (t === "Porta-torniquete") {
        s += `<rect x="104" y="266" width="10" height="26" rx="4" fill="#5a1f1f" stroke="${C.linha}"/>`;
      } else if (t === "Dump pouch") {
        s += `<path d="M98 290H112L114 330Q105 336 96 330Z" fill="${C.ranger}" stroke="${C.linha}"/>`;
      }
    });
    return s;
  }

  function pistolaNaCintura(p, comColdre) {
    const aep = a(p, "sistema") === "AEP";
    const madeira = /1911/.test(a(p, "plataforma") || "");
    return `<path d="M188 ${comColdre ? 280 : 284}H204L207 ${comColdre ? 304 : 312}H191Z" fill="${madeira ? C.madeira : aep ? C.grafite : C.preto}" stroke="${C.linha}" stroke-width="1.2"/>
      <rect x="186" y="${comColdre ? 300 : 306}" width="22" height="6" rx="1" fill="${C.metal}"/>`;
  }
  function coldre(ps, pistola) {
    const t = a(ps[0], "tipo");
    const cor = t === "Rígido" ? C.preto : C.ranger;
    return `<g stroke="${C.linha}" stroke-width="1.2">
      <path d="M152 334H200M152 356H200" stroke="${C.preto}" stroke-width="5"/>
      <path d="M184 298H208L210 368H188Z" fill="${cor}"/>
      ${t === "Rígido" ? '<path d="M188 312h18" stroke="#000" stroke-opacity=".5"/>' : ""}
      ${pistola ? pistolaNaCintura(pistola, true) : ""}</g>`;
  }

  // ---------- Costas ----------
  function mochilaAtras(ps) {
    const t = a(ps[0], "tipo");
    const larg = t === "3 dias" ? 18 : t === "Assalto" ? 12 : 4;
    const topo = t === "3 dias" ? 84 : t === "Assalto" ? 94 : 104;
    return `<rect x="${100 - larg}" y="${topo}" width="${100 + larg * 2}" height="${t === "Hidratação" ? 150 : 170}" rx="16" fill="${t === "3 dias" ? C.coyote : C.ranger}" stroke="${C.linha}" stroke-width="1.2"/>`;
  }
  function mochilaAlcas() {
    return `<g stroke="${C.preto}" stroke-width="8" fill="none" stroke-linecap="round">
      <path d="M118 104Q114 160 112 228"/><path d="M182 104Q186 160 188 228"/></g>`;
  }

  // ---------- Cabeça ----------
  function mascara(ps) {
    const t = a(ps[0], "tipo");
    if (t === "Balaclava") {
      return `<g><ellipse cx="150" cy="60" rx="24" ry="29" fill="${C.preto}" stroke="${C.linha}"/>
        <path d="M150 82h11l3 22h-28l3-22z" fill="${C.preto}"/><rect x="132" y="50" width="36" height="12" rx="6" fill="url(#ml-pele)"/></g>`;
    }
    if (t === "Full face") {
      return `<g stroke="${C.linha}" stroke-width="1.2"><ellipse cx="150" cy="62" rx="25" ry="29" fill="url(#ml-tela)"/>
        <rect x="128" y="46" width="44" height="18" rx="8" fill="${C.lente}"/><path d="M134 50h12" stroke="${C.brilho}" stroke-opacity=".5"/></g>`;
    }
    return `<path d="M127 62H173Q172 86 150 92Q128 86 127 62Z" fill="url(#ml-tela)" stroke="${C.linha}" stroke-width="1.2"/>
      <path d="M127 64L118 58M173 64L182 58" stroke="${C.preto}" stroke-width="2.5"/>`;
  }
  function oculos(ps) {
    const goggle = a(ps[0], "tipo") === "Goggle" || /mesh/i.test(ps[0].nome || "");
    const h = goggle ? 17 : 12;
    return `<g stroke="${C.linha}" stroke-width="1"><path d="M124 54H176" stroke="${C.preto}" stroke-width="${goggle ? 5 : 2}"/>
      <rect x="128" y="${goggle ? 45 : 48}" width="44" height="${h}" rx="${goggle ? 7 : 5}" fill="${/mesh/i.test(ps[0].nome || "") ? "url(#ml-tela)" : C.lente}"/>
      <path d="M133 ${goggle ? 49 : 51}h10" stroke="${C.brilho}" stroke-opacity=".6" stroke-width="1.5"/></g>`;
  }
  function capacete(ps) {
    const p = ps[0], t = a(p, "tipo");
    if (t === "Boné") {
      return `<g stroke="${C.linha}" stroke-width="1.2"><path d="M127 44Q127 22 150 21Q173 22 173 44Z" fill="${C.oliva}"/>
        <path d="M124 42H176L184 49H128Z" fill="${C.ranger}"/><rect x="141" y="30" width="18" height="10" rx="2" fill="#000" fill-opacity=".25" stroke="none"/></g>`;
    }
    const cor = /Emerson/.test(p.nome || "") ? C.ranger : C.tan;
    return `<g stroke="${C.linha}" stroke-width="1.2">
      <path d="M123 54Q120 18 150 16Q180 18 177 54L170 55Q169 44 162 43H138Q131 44 130 55Z" fill="${cor}"/>
      <rect x="119" y="36" width="9" height="16" rx="2" fill="${C.grafite}"/><rect x="172" y="36" width="9" height="16" rx="2" fill="${C.grafite}"/>
      <rect x="140" y="17" width="20" height="9" rx="2" fill="${C.grafite}"/>
      <path d="M128 30Q150 22 172 30" fill="none" stroke="#000" stroke-opacity=".3"/></g>`;
  }
  function comunicacaoArco(ps) {
    return ps.some((p) => a(p, "tipo") === "Headset") ? `<path d="M124 50Q122 22 150 20Q178 22 176 50" fill="none" stroke="${C.preto}" stroke-width="5"/>` : "";
  }
  function comunicacao(ps) {
    let s = "";
    ps.forEach((p) => {
      const t = a(p, "tipo");
      if (t === "Headset") {
        const cor = /Earmor/.test(p.nome || "") ? C.coyote : C.ranger;
        s += par(`<rect x="114" y="48" width="15" height="26" rx="6" fill="${cor}" stroke="${C.linha}"/><rect x="117" y="54" width="9" height="14" rx="4" fill="#000" fill-opacity=".3"/>`)
          + `<path d="M126 70Q132 84 146 86" fill="none" stroke="${C.preto}" stroke-width="2.5"/>`;
      } else if (t === "Rádio") {
        s += `<rect x="178" y="152" width="12" height="32" rx="2" fill="${C.preto}" stroke="${C.linha}"/><path d="M184 152V112" stroke="${C.preto}" stroke-width="2.5"/>`;
      } else if (t === "PTT") {
        s += `<rect x="124" y="124" width="12" height="12" rx="3" fill="${C.preto}" stroke="${C.linha}"/>`;
      }
    });
    return s;
  }

  // ---------- Arma principal (desenhada na horizontal, centro em 0,0, cano para a direita) ----------
  function fuzil(p) {
    const plat = a(p, "plataforma") || "M4";
    const preto = C.preto, mad = C.madeira, L = C.linha;
    const sw = `stroke="${L}" stroke-width="1.2"`;
    if (plat === "AK") {
      return `<g ${sw}>
        <path d="M-112 -6L-62 -10V8L-108 14Z" fill="${mad}"/>
        <rect x="-64" y="-12" width="66" height="20" rx="2" fill="${preto}"/>
        <path d="M-50 6L-40 6L-44 26L-52 24Z" fill="${mad}"/>
        <path d="M-26 8Q-24 30 -10 44L2 40Q-10 26 -10 8Z" fill="#7a3a1c"/>
        <path d="M2 -10H52V6H2Z" fill="${mad}"/><rect x="2" y="-16" width="46" height="6" rx="2" fill="${preto}"/>
        <rect x="52" y="-5" width="48" height="5" fill="${C.metal}"/><rect x="96" y="-9" width="4" height="9" fill="${preto}"/></g>`;
    }
    if (plat === "VSR-10" || plat === "Striker") {
      const cor = plat === "Striker" ? C.grafite : C.ranger;
      return `<g ${sw}>
        <path d="M-118 -4Q-110 -10 -70 -8L-40 -8L60 -6V4L-40 6Q-60 20 -78 18L-118 14Z" fill="${cor}"/>
        <rect x="-50" y="-12" width="60" height="9" rx="3" fill="${C.metal}"/><circle cx="-36" cy="-14" r="4" fill="${C.metal}"/>
        <rect x="58" y="-5" width="62" height="5" fill="${preto}"/></g>`;
    }
    if (plat === "Shotgun M870") {
      return `<g ${sw}>
        <path d="M-112 -6L-60 -8V8L-108 16Z" fill="${preto}"/><rect x="-62" y="-12" width="52" height="20" rx="2" fill="${preto}"/>
        <path d="M-50 8L-42 8L-44 26L-52 24Z" fill="${preto}"/>
        <rect x="-10" y="-8" width="104" height="6" fill="${C.metal}"/><rect x="-10" y="0" width="96" height="6" fill="${preto}"/>
        <rect x="12" y="-2" width="34" height="12" rx="3" fill="${C.grafite}"/></g>`;
    }
    if (plat === "MP5") {
      return `<g ${sw}>
        <path d="M-84 -8H-56V10H-80Z" fill="${preto}"/><rect x="-58" y="-12" width="72" height="18" rx="3" fill="${preto}"/>
        <path d="M-42 6L-34 6L-36 24L-44 22Z" fill="${preto}"/>
        <path d="M-14 6Q-12 26 -4 38L4 36Q-2 22 -4 6Z" fill="${C.metal}"/>
        <rect x="14" y="-9" width="34" height="14" rx="3" fill="${preto}"/><rect x="48" y="-5" width="18" height="6" fill="${C.metal}"/></g>`;
    }
    // Família AR (M4, M4 MWS, SR-25) e G36
    const longo = plat === "SR-25";
    const g36 = plat === "G36";
    const hg = longo ? 70 : 54, cano = longo ? 36 : 28;
    return `<g ${sw}>
      ${g36 ? `<path d="M-108 -10H-66V10H-100L-108 4ZM-100 -4H-74V4H-100Z" fill="${preto}" fill-rule="evenodd"/>`
            : `<path d="M-110 -10H-82V12H-106Z" fill="${preto}"/><rect x="-84" y="-4" width="22" height="8" fill="${C.metal}"/>`}
      <rect x="-64" y="-12" width="58" height="20" rx="2" fill="${g36 ? C.grafite : preto}"/>
      ${g36 ? `<path d="M-50 -12Q-30 -26 -8 -12" fill="none" stroke="${preto}" stroke-width="5"/>` : ""}
      <path d="M-52 6L-42 6L-46 28L-54 26Z" fill="${preto}"/>
      ${g36 ? `<path d="M-26 8L-12 8Q-10 30 -4 40L-14 42Q-22 30 -26 8Z" fill="${C.grafite}"/>`
            : `<path d="M-30 8H-16L-14 40H-28Z" fill="${preto}"/>`}
      <rect x="-6" y="-10" width="${hg}" height="16" rx="2" fill="${preto}"/>
      <path d="M-4 -10h${hg - 4}" stroke="${C.metal}" stroke-width="2" stroke-dasharray="3 2"/>
      <rect x="${hg - 6}" y="-5" width="${cano}" height="5" fill="${C.metal}"/>
      <rect x="${hg + cano - 8}" y="-7" width="8" height="9" rx="1" fill="${preto}"/></g>`;
  }
  function mira(ps, plat) {
    const p = ps[0];
    const t = a(p, "tipo");
    const bolt = plat === "VSR-10" || plat === "Striker";
    const x = bolt ? -30 : -40, y = bolt ? -14 : -14;
    const L = C.linha;
    if (t === "Red dot") return `<rect x="${x}" y="${y - 12}" width="16" height="12" rx="3" fill="${C.preto}" stroke="${L}"/><rect x="${x + 3}" y="${y - 9}" width="8" height="6" rx="1" fill="#7a1f1a"/>`;
    if (t === "Holográfica") return `<rect x="${x - 4}" y="${y - 16}" width="26" height="16" rx="2" fill="${C.preto}" stroke="${L}"/><rect x="${x}" y="${y - 13}" width="16" height="9" fill="${C.lente}"/>`;
    if (t === "Mira de ferro") return `<rect x="${x}" y="${y - 8}" width="8" height="8" fill="${C.preto}" stroke="${L}"/><rect x="${x + 70}" y="${y - 8}" width="5" height="8" fill="${C.preto}"/>`;
    const comp = t === "Luneta fixa" ? 30 : t === "LPVO" ? 46 : 58;
    return `<g stroke="${L}" stroke-width="1.2"><rect x="${x - 6}" y="${y - 13}" width="${comp}" height="9" rx="3" fill="${C.preto}"/>
      <rect x="${x - 8}" y="${y - 15}" width="10" height="13" rx="3" fill="${C.preto}"/><rect x="${x + comp - 12}" y="${y - 16}" width="12" height="15" rx="3" fill="${C.preto}"/>
      <rect x="${x + comp / 2 - 6}" y="${y - 5}" width="8" height="6" fill="${C.grafite}"/></g>`;
  }
  function acessRifle(ps) {
    let s = "";
    ps.forEach((p) => {
      const t = a(p, "tipo");
      if (t === "Empunhadura") s += `<rect x="16" y="6" width="9" height="20" rx="3" fill="${C.preto}" stroke="${C.linha}"/>`;
      if (t === "Lanterna") s += `<rect x="28" y="6" width="22" height="8" rx="3" fill="${C.preto}" stroke="${C.linha}"/><rect x="48" y="7" width="4" height="6" fill="#d8d0a0"/>`;
      if (t === "Bipé") s += `<path d="M40 6L32 32M42 6L50 32" stroke="${C.preto}" stroke-width="3"/>`;
    });
    return s;
  }
  function armaCompleta(prodArma, prodsMira, prodsAcess) {
    const plat = a(prodArma, "plataforma");
    return fuzil(prodArma) + (tem(prodsAcess) ? acessRifle(prodsAcess) : "") + (tem(prodsMira) ? mira(prodsMira, plat) : "");
  }

  // ---------- Pistola (ícone de lado) ----------
  function pistolaLado(p) {
    const plat = a(p, "plataforma") || "";
    const madeira = /1911/.test(plat);
    return `<g stroke="${C.linha}" stroke-width="1.2">
      <path d="M-36 2H-14L-18 34Q-26 38 -34 34L-42 8Z" fill="${madeira ? C.madeira : C.grafite}"/>
      <path d="M-14 4Q-12 16 0 16H6V4" fill="none" stroke="${C.preto}" stroke-width="3"/>
      <path d="M-14 3L-10 12" stroke="${C.metal}" stroke-width="2"/>
      <rect x="-42" y="-14" width="76" height="17" rx="2" fill="${C.preto}"/>
      <path d="M-30 -14v17M-25 -14v17M-20 -14v17" stroke="${C.metal}" stroke-width="1"/>
      <rect x="34" y="-9" width="4" height="7" fill="${C.metal}"/>
      ${a(p, "trilho") === "Sim" ? `<path d="M4 6h26" stroke="${C.metal}" stroke-width="3" stroke-dasharray="3 2"/>` : ""}</g>`;
  }

  // ---------- Ícones dedicados (itens que não aparecem no corpo) ----------
  const ICONE = {
    magRifle: (p) => {
      const curvo = ["AK", "MP5"].includes(a(p, "plataforma"));
      const shell = a(p, "plataforma") === "Shotgun M870";
      if (shell) return `<g stroke="${C.linha}">${[0, 1, 2].map((i) => `<rect x="${-22 + i * 16}" y="-14" width="12" height="28" rx="3" fill="#8a2a1f"/><rect x="${-22 + i * 16}" y="8" width="12" height="7" fill="#b79a4a"/>`).join("")}</g>`;
      return curvo
        ? `<path d="M-10 -26H8Q12 0 24 24L8 30Q-6 6 -10 -26Z" fill="${a(p, "plataforma") === "AK" ? "#7a3a1c" : C.metal}" stroke="${C.linha}" stroke-width="1.2"/>`
        : `<g stroke="${C.linha}" stroke-width="1.2"><path d="M-9 -28H9L12 26H-6Z" fill="${C.preto}"/><path d="M-6 -22h12M-5 -12h12" stroke="${C.metal}"/></g>`;
    },
    bateria: (p) => a(p, "tipo") === "Carregador"
      ? `<g stroke="${C.linha}"><rect x="-26" y="-16" width="52" height="32" rx="4" fill="${C.preto}"/><rect x="-18" y="-10" width="22" height="12" fill="#2d5a6a"/><circle cx="14" cy="6" r="4" fill="${C.metal}"/></g>`
      : `<g stroke="${C.linha}" stroke-width="1.2"><rect x="-34" y="-9" width="60" height="18" rx="4" fill="#2b3f5c"/><rect x="-28" y="-5" width="30" height="10" fill="#d8c25a" fill-opacity=".8"/><path d="M26 -3H40M26 3H40" stroke="#b33" stroke-width="2"/></g>`,
    upgrades: () => `<g stroke="${C.linha}" stroke-width="1.2" fill="${C.metal}"><circle r="16"/><circle r="6" fill="#111"/>${Array.from({ length: 8 }, (_, i) => `<rect x="-3" y="-22" width="6" height="8" transform="rotate(${i * 45})"/>`).join("")}</g>`,
    magPistola: () => `<g stroke="${C.linha}" stroke-width="1.2"><path d="M-8 -26H8L10 24H-6Z" fill="${C.preto}"/><rect x="-8" y="20" width="20" height="6" rx="2" fill="${C.grafite}"/></g>`,
    energiaPistola: (p) => a(p, "tipo") === "Gás"
      ? `<g stroke="${C.linha}" stroke-width="1.2"><rect x="-14" y="-20" width="28" height="44" rx="6" fill="#2f6a3a"/><rect x="-5" y="-28" width="10" height="9" fill="${C.metal}"/><rect x="-10" y="-4" width="20" height="10" fill="#e8e0c0" fill-opacity=".8"/></g>`
      : a(p, "tipo") === "Bateria"
        ? `<g stroke="${C.linha}"><rect x="-26" y="-8" width="46" height="16" rx="4" fill="#2b3f5c"/><path d="M20 -2H30" stroke="#b33" stroke-width="2"/></g>`
        : `<g stroke="${C.linha}" stroke-width="1.2"><rect x="-9" y="-22" width="18" height="42" rx="4" fill="#d8d4c4"/><rect x="-5" y="-30" width="10" height="9" fill="${C.preto}"/></g>`,
    acessPistola: (p) => a(p, "tipo") === "Lanterna"
      ? `<g stroke="${C.linha}"><rect x="-26" y="-8" width="44" height="16" rx="5" fill="${C.preto}"/><rect x="16" y="-6" width="6" height="12" fill="#d8d0a0"/></g>`
      : `<g stroke="${C.linha}"><rect x="-16" y="-12" width="32" height="20" rx="4" fill="${C.preto}"/><rect x="-9" y="-8" width="18" height="10" fill="#7a1f1a" fill-opacity=".8"/></g>`,
    mochila: (p) => {
      const t = a(p, "tipo");
      const cor = t === "3 dias" ? C.coyote : C.ranger;
      return `<g stroke="${C.linha}" stroke-width="1.2"><rect x="-24" y="-30" width="48" height="60" rx="10" fill="${cor}"/>
        <rect x="-24" y="-30" width="48" height="60" rx="10" fill="url(#ml-molle)" stroke="none"/>
        <rect x="-16" y="4" width="32" height="20" rx="4" fill="#000" fill-opacity=".2"/>
        ${t === "Hidratação" ? '<path d="M24 -20Q34 0 26 26" fill="none" stroke="#111" stroke-width="3"/>' : ""}</g>`;
    },
  };

  // Recortes do corpo usados como ícones (viewBox no espaço 300x600)
  const RECORTE = {
    oculos: "114 34 72 36", mascara: "112 26 76 74", capacete: "112 8 76 54", comunicacao: "104 12 92 80",
    colete: "92 92 116 164", pouchPeito: "112 146 86 96", camisa: "66 92 168 216", luvas: "66 288 36 40",
    cinto: "96 260 108 46", coldre: "148 270 66 104", pouchCinto: "92 260 96 80",
    calca: "100 280 100 276", joelheira: "106 380 88 54", calcado: "96 488 108 82",
  };

  // Desenho de uma vaga sobre o corpo
  function sobreCorpo(vaga, ps, todos) {
    switch (vaga) {
      case "camisa": return camisa(ps);
      case "calca": return calca(ps);
      case "joelheira": return joelheira(ps);
      case "calcado": return calcado(ps);
      case "luvas": return luvas(ps);
      case "colete": return colete(ps);
      case "pouchPeito": return pouchPeito(ps);
      case "cinto": return cinto(ps);
      case "pouchCinto": return pouchCinto(ps);
      case "coldre": return coldre(ps, todos && todos.armaSecundaria ? todos.armaSecundaria[0] : null);
      case "mascara": return mascara(ps);
      case "oculos": return oculos(ps);
      case "capacete": return capacete(ps);
      case "comunicacao": return comunicacaoArco(ps) + comunicacao(ps);
      default: return "";
    }
  }

  // ---------- Personagem completo ----------
  // porVaga: { vagaId: [produto, ...] } (só produtos do catálogo)
  function personagem(porVaga) {
    const v = (id) => porVaga[id] || [];
    const arma = v("armaPrincipal")[0];
    const pistola = v("armaSecundaria")[0];
    const camadas = [
      tem(v("mochila")) ? mochilaAtras(v("mochila")) : "",
      manequim(),
      tem(v("calca")) ? calca(v("calca")) : "",
      tem(v("joelheira")) ? joelheira(v("joelheira")) : "",
      tem(v("calcado")) ? calcado(v("calcado")) : "",
      tem(v("camisa")) ? camisa(v("camisa")) : "",
      tem(v("luvas")) ? luvas(v("luvas")) : "",
      tem(v("colete")) ? colete(v("colete")) : "",
      tem(v("mochila")) ? mochilaAlcas() : "",
      tem(v("pouchPeito")) ? pouchPeito(v("pouchPeito")) : "",
      tem(v("cinto")) ? cinto(v("cinto")) : "",
      tem(v("pouchCinto")) ? pouchCinto(v("pouchCinto")) : "",
      tem(v("coldre")) ? coldre(v("coldre"), pistola) : pistola ? pistolaNaCintura(pistola, false) : "",
      tem(v("mascara")) ? mascara(v("mascara")) : "",
      comunicacaoArco(v("comunicacao")),
      tem(v("capacete")) ? capacete(v("capacete")) : "",
      tem(v("oculos")) ? oculos(v("oculos")) : "",
      tem(v("comunicacao")) ? comunicacao(v("comunicacao")) : "",
      arma ? `<path d="M114 106L196 286" stroke="${C.grafite}" stroke-width="4" fill="none"/>
        <g transform="translate(150 200) rotate(-34) scale(1.18)">${armaCompleta(arma, v("mira"), v("acessRifle"))}</g>` : "",
    ];
    return `<svg viewBox="0 0 300 600" xmlns="http://www.w3.org/2000/svg" class="ml-personagem" role="img" aria-label="Personagem com o loadout escolhido">${camadas.join("")}</svg>`;
  }

  // ---------- Ícone de um slot ----------
  // prods: produtos do catálogo da vaga (pode ser vazio = slot vazio); todos: porVaga
  function icone(vaga, prods, todos) {
    const vazio = !tem(prods);
    const exemplo = vazio ? null : prods[0];
    const cls = "ml-icone" + (vazio ? " ml-vazio" : "");
    const svg = (vb, conteudo) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" class="${cls}" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${conteudo}</svg>`;
    const PADRAO = DEFAULTS[vaga];
    const ps = vazio ? (PADRAO ? [PADRAO] : []) : prods;

    if (vaga === "armaPrincipal" || vaga === "mira" || vaga === "acessRifle") {
      const arma = (todos.armaPrincipal && todos.armaPrincipal[0]) || DEFAULTS.armaPrincipal;
      if (vaga === "armaPrincipal") return svg("-122 -46 244 92", fuzil(ps[0]) + (tem(todos.mira) ? mira(todos.mira, a(ps[0], "plataforma")) : "") + (tem(todos.acessRifle) ? acessRifle(todos.acessRifle) : ""));
      if (vaga === "mira") return svg("-62 -40 84 40", `<g opacity=".25">${fuzil(arma)}</g>` + mira(ps, a(arma, "plataforma")));
      return svg("-20 -16 84 52", `<g opacity=".25">${fuzil(arma)}</g>` + acessRifle(ps));
    }
    if (vaga === "armaSecundaria") return svg("-46 -22 84 60", pistolaLado(ps[0]));
    if (ICONE[vaga]) return svg("-40 -36 80 72", ICONE[vaga](ps[0]));
    const vb = RECORTE[vaga];
    if (!vb) return svg("0 0 10 10", "");
    const contexto = vaga === "camisa" || vaga === "calca" ? "" : `<g opacity=".18">${manequim()}</g>`;
    return svg(vb, contexto + sobreCorpo(vaga, ps, todos));
  }

  // Produto "modelo" usado para desenhar o contorno de slots vazios
  const DEFAULTS = {
    armaPrincipal: { a: { plataforma: "M4" } }, armaSecundaria: { a: { plataforma: "Glock", trilho: "Sim" } },
    mira: { a: { tipo: "Red dot" } }, acessRifle: { a: { tipo: "Lanterna" } }, magRifle: { a: { plataforma: "M4" } },
    bateria: { a: { tipo: "Bateria" } }, upgrades: { a: {} }, magPistola: { a: {} }, energiaPistola: { a: { tipo: "Gás" } },
    acessPistola: { a: { tipo: "Lanterna" } }, oculos: { a: { tipo: "Óculos balístico" } }, mascara: { a: { tipo: "Meia face" } },
    capacete: { a: { tipo: "Capacete FAST" } }, comunicacao: { a: { tipo: "Headset" } }, colete: { a: { tipo: "Plate carrier" } },
    pouchPeito: { a: { tipo: "Porta-carregador", para: "M4" } }, camisa: { a: { tipo: "Combat shirt" } }, luvas: { a: { tipo: "Dedos inteiros" } },
    cinto: { a: { tipo: "Battle belt" } }, coldre: { a: { tipo: "Rígido" } }, pouchCinto: { a: { tipo: "Porta-carregador", para: "Pistola" } },
    calca: { a: { tipo: "Calça tática" } }, joelheira: { a: { tipo: "Externa" } }, calcado: { a: { tipo: "Cano alto" } }, mochila: { a: { tipo: "Assalto" } },
  };

  window.MEULOADOUT_ARTE = { DEFS: DEFS, personagem: personagem, icone: icone };
})();
