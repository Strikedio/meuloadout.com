/*
 * Meu Loadout — lógica da página (v2)
 * - Tabela de montagem com uma linha por vaga (arma, mira, magazines...)
 * - Cada vaga abre a lista de produtos com filtros e checagem de compatibilidade
 * - O loadout fica guardado no próprio link (depois do #): salvar e compartilhar sem login
 */
(function () {
  "use strict";

  const DADOS = window.MEULOADOUT || { regioes: [], vagas: [], produtos: [] };
  const LOJAS = window.MEULOADOUT_LOJAS || [];
  const CHAVE_LOCAL = "meuloadout:v2";

  const vagaPorId = new Map(DADOS.vagas.map((v) => [v.id, v]));
  const prodPorId = new Map(DADOS.produtos.map((p) => [p.id, p]));
  const regiaoPorId = new Map(DADOS.regioes.map((r) => [r.id, r]));

  // estado.itens: { v: vagaId, p: produtoId }  ou  { v: vagaId, m: "nome digitado" }
  let estado = { nome: "", itens: [] };

  // ---------- Atalhos de DOM ----------
  const $ = (sel) => document.querySelector(sel);
  function el(tag, attrs, ...filhos) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const [k, val] of Object.entries(attrs)) {
        if (val == null || val === false) continue;
        if (k === "class") n.className = val;
        else if (k === "text") n.textContent = val;
        else if (k.startsWith("on")) n.addEventListener(k.slice(2), val);
        else n.setAttribute(k, val === true ? "" : val);
      }
    }
    filhos.flat().forEach((f) => f != null && n.append(f));
    return n;
  }

  // ---------- Link compartilhável ----------
  function codificar(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodificar(texto) {
    const b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  }
  function paraCompacto() {
    return { v: 2, n: estado.nome, i: estado.itens.map((x) => (x.p ? x.p : [x.v, x.m])) };
  }
  // Limites de segurança: um link gigante ou com lixo não deve travar a página
  const MAX_LINK = 6000;   // caracteres depois de "#l="
  const MAX_ITENS = 120;
  function textoLimpo(t, max) {
    // remove caracteres de controle e invisíveis de direção (usados para disfarçar texto)
    return String(t).replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "").trim().slice(0, max);
  }
  function deCompacto(o) {
    const lista = o && Array.isArray(o.i) ? o.i.slice(0, MAX_ITENS) : [];
    const itens = [];
    lista.forEach((x) => {
      if (typeof x === "string" && prodPorId.has(x)) itens.push({ v: prodPorId.get(x).vaga, p: x });
      else if (Array.isArray(x) && typeof x[0] === "string" && vagaPorId.has(x[0]) && typeof x[1] === "string" && textoLimpo(x[1], 80))
        itens.push({ v: x[0], m: textoLimpo(x[1], 80) });
    });
    return { nome: o && typeof o.n === "string" ? textoLimpo(o.n, 60) : "", itens: itens };
  }
  function salvar() {
    const hash = estado.itens.length || estado.nome ? "#l=" + codificar(paraCompacto()) : "";
    history.replaceState(null, "", location.pathname + location.search + hash);
    try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify(paraCompacto())); } catch (e) { /* sem armazenamento */ }
  }
  function carregar() {
    const m = location.hash.length <= MAX_LINK + 3 && location.hash.match(/^#l=([A-Za-z0-9_-]+)$/);
    if (m) { try { return deCompacto(decodificar(m[1])); } catch (e) { /* link inválido */ } }
    try {
      const s = localStorage.getItem(CHAVE_LOCAL);
      if (s) return deCompacto(JSON.parse(s));
    } catch (e) { /* ignora */ }
    return { nome: "", itens: [] };
  }

  // ---------- Preços de referência (js/precos.js) ----------
  const PRECOS = (window.MEULOADOUT_PRECOS && window.MEULOADOUT_PRECOS.itens) || {};
  const DIAS_PRECO_ANTIGO = 45;
  const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function linkSeguro(u) {
    try { const x = new URL(u); return x.protocol === "https:" ? x.href : null; } catch (e) { return null; }
  }
  function precoDe(prodId) {
    const p = Object.prototype.hasOwnProperty.call(PRECOS, prodId) ? PRECOS[prodId] : null;
    if (!p || typeof p.valor !== "number" || !(p.valor > 0)) return null;
    const data = /^\d{4}-\d{2}-\d{2}$/.test(p.data || "") ? p.data : null;
    const dias = data ? Math.floor((Date.now() - new Date(data + "T12:00:00").getTime()) / 864e5) : null;
    return {
      valor: p.valor,
      loja: typeof p.loja === "string" ? p.loja.slice(0, 40) : "",
      link: p.link ? linkSeguro(p.link) : null,
      data: data,
      antigo: dias == null || dias > DIAS_PRECO_ANTIGO,
    };
  }
  function dataCurta(iso) {
    return iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : "data desconhecida";
  }
  function blocoPreco(pr) {
    if (!pr) return el("span", { class: "preco-vazio", text: "Sem preço de referência" });
    const loja = pr.link
      ? el("a", { href: pr.link, target: "_blank", rel: "noopener noreferrer nofollow sponsored", text: pr.loja || "ver oferta" })
      : el("span", { text: pr.loja });
    return el("span", { class: "preco" + (pr.antigo ? " preco-antigo" : "") },
      el("strong", { text: moeda.format(pr.valor) }),
      pr.loja || pr.link ? [" · ", loja] : null,
      el("small", { text: " · consultado em " + dataCurta(pr.data) + (pr.antigo ? " (pode ter mudado)" : "") }));
  }

  // ---------- Lojas ----------
  function urlLoja(loja, termo) {
    const t = loja.formato === "hifen"
      ? encodeURIComponent(termo.trim().replace(/\s+/g, "-"))
      : encodeURIComponent(termo.trim());
    return loja.url.replace("{q}", t);
  }
  function chipsLojas(termo) {
    return el("div", { class: "lojas" },
      LOJAS.map((l) => el("a", { href: urlLoja(l, termo), target: "_blank", rel: "noopener noreferrer", text: l.nome })));
  }

  // ---------- Ofertas automáticas (AliExpress, Shopee) via /api/ofertas ----------
  // Só aparecem depois que as chaves das lojas forem cadastradas no Cloudflare.
  const cacheOfertas = new Map();
  let ofertasDesligadas = false;
  function buscarOfertas(prodId) {
    if (!cacheOfertas.has(prodId)) {
      cacheOfertas.set(prodId, fetch("/api/ofertas?id=" + encodeURIComponent(prodId), { headers: { Accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null));
    }
    return cacheOfertas.get(prodId);
  }
  function blocoOfertas(prodId) {
    const caixa = el("div", { class: "ofertas", hidden: true });
    if (ofertasDesligadas || !/^[a-z0-9-]{1,40}$/i.test(prodId)) return caixa;
    buscarOfertas(prodId).then((d) => {
      if (!d || !d.ativo) { if (d && d.ativo === false) ofertasDesligadas = true; return; }
      const lista = (Array.isArray(d.ofertas) ? d.ofertas : [])
        .filter((o) => o && typeof o.valor === "number" && o.valor > 0 && linkSeguro(o.link))
        .slice(0, 4);
      if (!lista.length) return;
      caixa.append(
        el("small", { class: "ofertas-titulo", text: "Ofertas online (resultado de busca, confira se é o mesmo produto)" }),
        el("ul", null, lista.map((o) => el("li", null,
          el("a", { href: linkSeguro(o.link), target: "_blank", rel: "noopener noreferrer nofollow sponsored" },
            el("strong", { text: moeda.format(o.valor) }),
            " · " + String(o.loja || "").slice(0, 20),
            o.importado ? el("span", { class: "selo-importado", text: "importado" }) : null),
          el("span", { class: "oferta-nome", text: String(o.titulo || "").slice(0, 90) })))));
      caixa.hidden = false;
    });
    return caixa;
  }

  // ---------- Compatibilidade ----------
  function produtosEscolhidos() {
    return estado.itens.filter((x) => x.p).map((x) => prodPorId.get(x.p));
  }
  function rotuloCampo(vagaId, campo) {
    const v = vagaPorId.get(vagaId);
    const c = v && v.colunas.find((c) => c[0] === campo);
    return c ? c[1].toLowerCase() : campo;
  }
  function textoConflito(dono, alvo, r) {
    if (r.msg) return dono.nome + " × " + alvo.nome + ": " + r.msg;
    return dono.nome + " é para " + r.aceita.join(" / ") + ", mas " + alvo.nome + " é " +
      (alvo.a[r.campo] || "—") + " (" + rotuloCampo(alvo.vaga, r.campo) + ").";
  }
  // Checa as regras do "dono" contra o "alvo"
  function checar(dono, alvo, saida) {
    (dono.req || []).forEach((r) => {
      if (r.alvo !== alvo.vaga || dono.id === alvo.id) return;
      if (!r.aceita.includes(alvo.a[r.campo])) saida.push({ nivel: r.nivel, texto: textoConflito(dono, alvo, r) });
    });
  }
  // Conflitos que um produto candidato teria com o que já está escolhido.
  // ignorarVaga: numa vaga de escolha única, o item atual vai ser trocado, então não conta.
  function conflitosDe(cand, ignorarVaga) {
    const saida = [];
    produtosEscolhidos().forEach((sel) => {
      if (sel.id === cand.id || (ignorarVaga && sel.vaga === ignorarVaga)) return;
      checar(cand, sel, saida);
      checar(sel, cand, saida);
    });
    return saida;
  }
  // Todos os conflitos do loadout atual (cada par uma vez)
  function conflitosGerais() {
    const escolhidos = produtosEscolhidos();
    const saida = [];
    escolhidos.forEach((dono) => escolhidos.forEach((alvo) => checar(dono, alvo, saida)));
    const vistos = new Set();
    return saida.filter((c) => !vistos.has(c.texto) && vistos.add(c.texto));
  }
  function pior(lista) {
    if (lista.some((c) => c.nivel === "erro")) return "erro";
    if (lista.length) return "aviso";
    return "ok";
  }

  // ---------- Montagem (tabela principal) ----------
  const montagem = $("#montagem");
  const compat = $("#compat");

  function renderTotal() {
    const box = $("#total");
    const prods = estado.itens.filter((x) => x.p);
    const comPreco = prods.map((x) => precoDe(x.p)).filter(Boolean);
    box.innerHTML = "";
    if (!estado.itens.length) { box.hidden = true; return; }
    box.hidden = false;
    const soma = comPreco.reduce((t, p) => t + p.valor, 0);
    const semPreco = estado.itens.length - comPreco.length;
    box.append(
      el("span", { class: "total-rotulo", text: "Total estimado" }),
      el("strong", { class: "total-valor", text: comPreco.length ? moeda.format(soma) : "—" }),
      el("small", { text: semPreco
        ? comPreco.length + " de " + estado.itens.length + " peças com preço de referência"
        : "todas as peças com preço de referência" }));
  }

  function renderCompat() {
    const lista = conflitosGerais();
    const nivel = pior(lista);
    compat.className = "compat compat-" + nivel;
    compat.innerHTML = "";
    if (!estado.itens.length) {
      compat.append(el("strong", { text: "Compatibilidade" }), " — escolha as peças e a gente avisa se algo não combina.");
      return;
    }
    if (nivel === "ok") {
      compat.append(el("strong", { text: "✓ Tudo compatível" }), " — nenhum problema encontrado entre as peças escolhidas.");
      return;
    }
    const erros = lista.filter((c) => c.nivel === "erro").length;
    const avisos = lista.length - erros;
    const partes = [];
    if (erros) partes.push(erros + (erros > 1 ? " incompatibilidades" : " incompatibilidade"));
    if (avisos) partes.push(avisos + (avisos > 1 ? " avisos" : " aviso"));
    compat.append(
      el("strong", { text: (nivel === "erro" ? "✕ " : "⚠ ") + partes.join(" e ") }),
      el("ul", null, lista.map((c) => el("li", { class: "c-" + c.nivel, text: c.texto })))
    );
  }

  function linhaItem(item, indice) {
    const prod = item.p ? prodPorId.get(item.p) : null;
    const nome = prod ? prod.nome : item.m;
    const vaga = vagaPorId.get(item.v);
    const detalhes = prod
      ? vaga.colunas
          .filter((c) => prod.a[c[0]] && prod.a[c[0]] !== "—" && prod.a[c[0]] !== "Diversas")
          .map((c) => (["Sim", "Não", "Varia"].includes(prod.a[c[0]]) ? c[1] + ": " + prod.a[c[0]].toLowerCase() : prod.a[c[0]]))
          .join(" · ")
      : "Adicionado manualmente";
    const problemas = prod ? conflitosDe(prod) : [];
    const nivel = pior(problemas);
    return el("div", { class: "escolhido escolhido-" + nivel },
      el("div", { class: "escolhido-topo" },
        el("div", null,
          el("strong", { text: nome }),
          nivel !== "ok" ? el("span", { class: "selo selo-" + nivel, title: problemas.map((p) => p.texto).join("\n"), text: nivel === "erro" ? "Incompatível" : "Atenção" }) : null,
          el("span", { class: "escolhido-detalhes", text: detalhes })),
        el("button", { type: "button", class: "btn-remover", "aria-label": "Remover " + nome, text: "×", onclick: () => remover(indice) })),
      prod ? el("div", { class: "escolhido-preco" }, blocoPreco(precoDe(prod.id))) : null,
      prod ? blocoOfertas(prod.id) : null,
      chipsLojas(prod ? prod.busca || prod.nome : item.m));
  }

  function renderMontagem() {
    montagem.innerHTML = "";
    DADOS.regioes.forEach((reg) => {
      const vagas = DADOS.vagas.filter((v) => v.regiao === reg.id);
      const corpo = el("tbody");
      vagas.forEach((vaga) => {
        const itens = estado.itens.map((x, i) => [x, i]).filter(([x]) => x.v === vaga.id);
        const celula = el("td", { class: "col-selecionado" }, itens.map(([x, i]) => linhaItem(x, i)));
        let rotuloBotao;
        if (!itens.length) rotuloBotao = "+ Escolher " + vaga.nome.toLowerCase();
        else if (vaga.multiplo) rotuloBotao = "+ Adicionar outro";
        else rotuloBotao = "Trocar";
        celula.append(el("button", {
          type: "button",
          class: itens.length ? "btn btn-escolher btn-escolher-leve" : "btn btn-escolher",
          text: rotuloBotao,
          onclick: () => abrirSeletor(vaga.id),
        }));
        corpo.append(el("tr", null, el("th", { scope: "row", class: "col-vaga", text: vaga.nome }), celula));
      });
      montagem.append(el("section", { class: "regiao-bloco", id: "reg-" + reg.id, "data-regiao": reg.id },
        el("h3", { text: reg.nome }),
        el("table", { class: "tabela-montagem" }, corpo)));
    });

    renderCompat();
    renderTotal();
    renderInventario();
  }

  // ---------- Ações no loadout ----------
  function escolher(vagaId, item) {
    const vaga = vagaPorId.get(vagaId);
    if (estado.itens.length >= MAX_ITENS) { mostrarAviso("Limite de " + MAX_ITENS + " peças por loadout."); return; }
    if (!vaga.multiplo) estado.itens = estado.itens.filter((x) => x.v !== vagaId);
    else if (item.p && estado.itens.some((x) => x.p === item.p)) return;
    estado.itens.push(Object.assign({ v: vagaId }, item));
    salvar();
    renderMontagem();
  }
  function remover(indice) {
    estado.itens.splice(indice, 1);
    salvar();
    renderMontagem();
  }

  // ---------- Inventário (personagem + slots, estilo jogo) ----------
  const ARTE = window.MEULOADOUT_ARTE;
  const GRUPOS_SLOTS = [
    { nome: "Cabeça", vagas: ["capacete", "oculos", "mascara", "comunicacao"] },
    { nome: "Armas", vagas: ["armaPrincipal", "armaSecundaria"] },
    { nome: "Arma principal · acessórios", vagas: ["mira", "magRifle", "bateria", "upgrades", "acessRifle"] },
    { nome: "Pistola · acessórios", vagas: ["magPistola", "energiaPistola", "acessPistola"] },
    { nome: "Tronco", vagas: ["camisa", "colete", "pouchPeito", "luvas", "mochila"] },
    { nome: "Cintura e pernas", vagas: ["cinto", "coldre", "pouchCinto", "calca", "joelheira", "calcado"] },
  ];
  const SLOT_LARGO = new Set(["armaPrincipal"]);
  // Imagens de produto: só arquivos do próprio site (img/...) ou de hosts liberados na CSP
  const HOSTS_IMAGEM = ["http2.mlstatic.com"];
  function imagemDe(prod) {
    if (!prod || typeof prod.img !== "string") return null;
    if (/^img\/[\w\-./]+\.(webp|png|jpe?g|svg)$/i.test(prod.img) && !prod.img.includes("..")) return prod.img;
    try {
      const u = new URL(prod.img);
      return u.protocol === "https:" && HOSTS_IMAGEM.includes(u.hostname) ? u.href : null;
    } catch (e) { return null; }
  }

  // { vaga: [produto...] } — peça digitada à mão entra como "genérica" só para o desenho
  function porVaga() {
    const r = {};
    estado.itens.forEach((x) => {
      const p = x.p ? prodPorId.get(x.p) : { id: "", nome: "", a: {}, manual: true };
      (r[x.v] = r[x.v] || []).push(p);
    });
    return r;
  }

  // ---------- Modo de visualização: 3D (three.js) ou 2D (SVG) ----------
  const CHAVE_VISTA = "meuloadout:vista";
  let modoVista = "3d", pronto3d = false, iniciando3d = false;
  try { if (localStorage.getItem(CHAVE_VISTA) === "2d") modoVista = "2d"; } catch (e) { /* ignora */ }

  function aplicarModoVista() {
    const usa3d = modoVista === "3d" && !!window.Operador3D && window.Operador3D.disponivel !== false;
    $("#personagem").hidden = usa3d && pronto3d;
    $("#personagem3d").hidden = !usa3d;
    $("#carregando3d").hidden = pronto3d;
    document.querySelectorAll(".modo-vista button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === (usa3d ? "3d" : "2d"))));
    if (usa3d && pronto3d && window.Operador3D.redimensionar) window.Operador3D.redimensionar();
  }
  async function ativar3D() {
    aplicarModoVista();
    if (modoVista !== "3d" || pronto3d || iniciando3d || !window.Operador3D) return;
    if (!window.Operador3D.disponivel) { modoVista = "2d"; aplicarModoVista(); return; }
    iniciando3d = true;
    pronto3d = await window.Operador3D.iniciar($("#personagem3d"));
    iniciando3d = false;
    if (!pronto3d) { modoVista = "2d"; mostrarAviso("O 3D não funcionou neste aparelho; mostrando o desenho 2D."); }
    aplicarModoVista();
    renderInventario();
  }
  function trocarVista(m) {
    modoVista = m;
    try { localStorage.setItem(CHAVE_VISTA, m); } catch (e) { /* ignora */ }
    if (m === "3d") ativar3D(); else aplicarModoVista();
  }

  function renderInventario() {
    if (!ARTE) return;
    const pv = porVaga();
    $("#personagem").innerHTML = ARTE.personagem(pv); // SVG estático, sem texto do usuário
    if (pronto3d && window.Operador3D) window.Operador3D.atualizar(pv);

    // Selo de compatibilidade ao lado do título
    const conf = conflitosGerais(), nivel = pior(conf);
    const chip = $("#status-compat");
    chip.className = "status-compat sc-" + nivel;
    chip.textContent = !estado.itens.length ? "" : nivel === "ok" ? "✓ Compatível" : nivel === "erro" ? "✕ Incompatível" : "⚠ Atenção";

    const raiz = $("#slots");
    raiz.innerHTML = "";
    GRUPOS_SLOTS.forEach((g) => {
      const grade = el("div", { class: "slot-grade" });
      g.vagas.forEach((vagaId) => grade.append(cartaoSlot(vagaId, pv)));
      raiz.append(el("section", { class: "slot-grupo" }, el("h3", { text: g.nome }), grade));
    });
  }

  function cartaoSlot(vagaId, pv) {
    const vaga = vagaPorId.get(vagaId);
    const itens = estado.itens.filter((x) => x.v === vagaId);
    const prods = pv[vagaId] || [];
    const prim = itens[0];
    const primProd = prim && prim.p ? prodPorId.get(prim.p) : null;
    const nomePrim = prim ? (primProd ? primProd.nome : prim.m) : "";
    const problemas = prods.filter((p) => !p.manual).flatMap((p) => conflitosDe(p));
    const nivel = pior(problemas);

    const figura = el("span", { class: "slot-figura" });
    const src = imagemDe(primProd);
    if (src) {
      const img = el("img", { src: src, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer" });
      img.addEventListener("error", () => { figura.innerHTML = ARTE.icone(vagaId, prods, pv); }, { once: true });
      figura.append(img);
    } else {
      figura.innerHTML = ARTE.icone(vagaId, prods, pv); // SVG estático
    }

    let extra = "";
    if (itens.length > 1) extra = "+" + (itens.length - 1);
    else if (primProd) { const pr = precoDe(primProd.id); if (pr) extra = moeda.format(pr.valor); }

    const classes = ["slot"];
    if (SLOT_LARGO.has(vagaId)) classes.push("slot-largo");
    if (itens.length) classes.push("cheio");
    if (nivel !== "ok") classes.push("slot-" + nivel);

    const abrir = el("button", {
      type: "button",
      class: "slot-abrir",
      "aria-label": itens.length ? vaga.nome + ": " + nomePrim + (itens.length > 1 ? " e mais " + (itens.length - 1) : "") + ". Trocar ou adicionar" : "Escolher " + vaga.nome.toLowerCase(),
      title: problemas.map((p) => p.texto).join("\n") || null,
      onclick: () => abrirSeletor(vagaId),
    },
      el("span", { class: "slot-rotulo", text: vaga.curto || vaga.nome }),
      figura,
      el("span", { class: "slot-nome", text: itens.length ? nomePrim : "Vazio" }),
      extra ? el("span", { class: "slot-extra", text: extra }) : null,
      nivel !== "ok" ? el("span", { class: "slot-alerta", "aria-hidden": "true", text: nivel === "erro" ? "✕" : "!" }) : null);

    const remover = itens.length ? el("button", {
      type: "button",
      class: "slot-remover",
      "aria-label": "Remover " + (itens.length > 1 ? "todas as peças de " + vaga.nome.toLowerCase() : nomePrim),
      title: "Remover",
      text: "×",
      onclick: () => {
        estado.itens = estado.itens.filter((x) => x.v !== vagaId);
        salvar();
        renderMontagem();
      },
    }) : null;

    return el("div", { class: classes.join(" "), "data-vaga": vagaId }, abrir, remover);
  }

  // ---------- Seletor de produtos ----------
  const seletor = $("#seletor");
  let sel = null; // { vaga, busca, filtros: {campo: Set}, soCompat, ordem: {campo, dir} }
  let focoAnterior = null;

  function abrirSeletor(vagaId) {
    const vaga = vagaPorId.get(vagaId);
    sel = { vaga: vaga, busca: "", filtros: {}, soCompat: !vaga.base, ordem: { campo: "nome", dir: 1 } };
    focoAnterior = document.activeElement;
    $("#seletor-regiao").textContent = regiaoPorId.get(vaga.regiao).nome;
    $("#seletor-titulo").textContent = "Escolher " + vaga.nome.toLowerCase();
    $("#busca").value = "";
    $("#manual-nome").value = "";
    montarFiltros();
    renderTabela();
    seletor.hidden = false;
    document.body.classList.add("sem-rolagem");
    $("#busca").focus();
  }
  function fecharSeletor() {
    seletor.hidden = true;
    document.body.classList.remove("sem-rolagem");
    sel = null;
    if (focoAnterior && document.contains(focoAnterior)) focoAnterior.focus();
  }

  function produtosDaVaga() {
    return DADOS.produtos.filter((p) => p.vaga === sel.vaga.id);
  }

  function montarFiltros() {
    const box = $("#filtros");
    box.innerHTML = "";
    const soCompat = el("input", { type: "checkbox", checked: sel.soCompat, onchange: (e) => { sel.soCompat = e.target.checked; renderTabela(); } });
    box.append(el("label", { class: "filtro-compat" }, soCompat, " Mostrar só compatíveis"));

    const prods = produtosDaVaga();
    sel.vaga.colunas.forEach(([campo, rotulo]) => {
      const valores = [...new Set(prods.map((p) => p.a[campo]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
      if (valores.length < 2) return;
      sel.filtros[campo] = new Set();
      box.append(el("fieldset", null,
        el("legend", { text: rotulo }),
        valores.map((v) => el("label", null,
          el("input", { type: "checkbox", value: v, onchange: (e) => {
            if (e.target.checked) sel.filtros[campo].add(v); else sel.filtros[campo].delete(v);
            renderTabela();
          } }), " " + v))));
    });
    if (prods.some((p) => precoDe(p.id))) {
      sel.precoMax = null;
      box.append(el("fieldset", null,
        el("legend", { text: "Preço até (R$)" }),
        el("input", { type: "number", min: "0", step: "50", inputmode: "numeric", class: "filtro-preco", placeholder: "Sem limite", oninput: (e) => {
          const v = parseFloat(e.target.value);
          sel.precoMax = v > 0 ? v : null;
          renderTabela();
        } })));
    }
    box.append(el("button", { type: "button", class: "btn btn-secundario btn-limpar-filtros", text: "Limpar filtros", onclick: () => { montarFiltros(); $("#busca").value = ""; sel.busca = ""; renderTabela(); } }));
  }

  function renderTabela() {
    const vaga = sel.vaga;
    const cab = $("#tabela-cabecalho");
    const corpo = $("#tabela-corpo");
    cab.innerHTML = "";
    corpo.innerHTML = "";

    // Cabeçalho com ordenação
    const colunas = [["nome", "Produto"]].concat(vaga.colunas, [["preco", "Preço"]]);
    cab.append(el("tr", null,
      colunas.map(([campo, rotulo]) => {
        const ativo = sel.ordem.campo === campo;
        return el("th", { scope: "col", "aria-sort": ativo ? (sel.ordem.dir > 0 ? "ascending" : "descending") : null },
          el("button", { type: "button", class: "ordenar", onclick: () => {
            sel.ordem = { campo: campo, dir: ativo ? -sel.ordem.dir : 1 };
            renderTabela();
          } }, rotulo, ativo ? (sel.ordem.dir > 0 ? " ▲" : " ▼") : ""));
      }),
      el("th", { scope: "col", text: "Compatibilidade" }),
      el("th", { scope: "col" }, el("span", { class: "sr", text: "Ação" }))));

    // Filtra
    const termo = sel.busca.toLowerCase();
    let lista = produtosDaVaga().filter((p) => {
      if (termo && !(p.nome + " " + Object.values(p.a).join(" ")).toLowerCase().includes(termo)) return false;
      if (sel.precoMax) { const pr = precoDe(p.id); if (!pr || pr.valor > sel.precoMax) return false; }
      return Object.entries(sel.filtros).every(([campo, set]) => !set.size || set.has(p.a[campo]));
    });
    let ocultos = 0;
    const comConflitos = lista.map((p) => ({ p: p, c: conflitosDe(p, vaga.multiplo ? null : vaga.id) }));
    const visiveis = comConflitos.filter((x) => {
      if (sel.soCompat && pior(x.c) === "erro") { ocultos++; return false; }
      return true;
    });

    // Ordena
    const { campo, dir } = sel.ordem;
    visiveis.sort((x, y) => {
      if (campo === "preco") {
        const pa = precoDe(x.p.id), pb = precoDe(y.p.id);
        if (!pa || !pb) return (pa ? -1 : 0) + (pb ? 1 : 0);
        return (pa.valor - pb.valor) * dir;
      }
      const a = campo === "nome" ? x.p.nome : x.p.a[campo] || "";
      const b = campo === "nome" ? y.p.nome : y.p.a[campo] || "";
      return a.localeCompare(b, "pt-BR", { numeric: true }) * dir;
    });

    visiveis.forEach(({ p, c }) => {
      const nivel = pior(c);
      const jaTem = estado.itens.some((x) => x.p === p.id);
      let statusTxt = nivel === "ok" ? "✓ Compatível" : nivel === "aviso" ? "⚠ Atenção" : "✕ Incompatível";
      if (vaga.base && nivel === "erro") statusTxt = "✕ Conflita com peças escolhidas";
      corpo.append(el("tr", { class: "linha-" + nivel },
        el("td", { class: "col-produto", "data-rotulo": "Produto" }, el("strong", { text: p.nome })),
        vaga.colunas.map(([cp, rot]) => el("td", { "data-rotulo": rot, text: p.a[cp] || "—" })),
        (() => {
          const pr = precoDe(p.id);
          return el("td", { class: "col-preco", "data-rotulo": "Preço" },
            pr ? [el("strong", { text: moeda.format(pr.valor) }), el("small", { class: pr.antigo ? "preco-antigo" : null, text: (pr.loja ? pr.loja + " · " : "") + dataCurta(pr.data) })] : "—");
        })(),
        el("td", { class: "col-status", "data-rotulo": "Compatibilidade" },
          el("span", { class: "status status-" + nivel, text: statusTxt }),
          c.length ? el("small", { class: "status-motivo", text: c.map((x) => x.texto).join(" ") }) : null),
        el("td", { class: "col-acao" },
          el("button", {
            type: "button",
            class: "btn btn-adicionar",
            disabled: jaTem,
            text: jaTem ? "No loadout" : "Escolher",
            onclick: () => {
              escolher(vaga.id, { p: p.id });
              fecharSeletor();
              mostrarAviso(p.nome + " adicionado" + (nivel !== "ok" ? " — confira o aviso de compatibilidade." : "."));
            },
          }))));
    });

    if (!visiveis.length) {
      corpo.append(el("tr", null, el("td", { colspan: colunas.length + 2, class: "vazio", text: "Nenhum produto com esses filtros." })));
    }
    $("#resultados-total").textContent = visiveis.length + (visiveis.length === 1 ? " produto" : " produtos");
    const ocultosEl = $("#ocultos");
    ocultosEl.innerHTML = "";
    if (ocultos) {
      ocultosEl.append(
        ocultos + (ocultos > 1 ? " produtos ocultos por não serem compatíveis. " : " produto oculto por não ser compatível. "),
        el("button", { type: "button", class: "link", text: "Mostrar mesmo assim", onclick: () => {
          sel.soCompat = false;
          $(".filtro-compat input").checked = false;
          renderTabela();
        } }));
    }
  }

  // ---------- Avisos rápidos ----------
  let timerAviso;
  function mostrarAviso(msg) {
    const a = $("#aviso");
    a.textContent = msg;
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => (a.textContent = ""), 4000);
  }

  async function copiarLink() {
    if (!estado.itens.length) { mostrarAviso("Escolha pelo menos uma peça antes de copiar o link."); return; }
    const link = location.href;
    let ok = false;
    try { await navigator.clipboard.writeText(link); ok = true; } catch (e) {
      const t = el("textarea");
      t.value = link;
      document.body.append(t);
      t.select();
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      t.remove();
    }
    let msg = ok ? "Link copiado! Cole onde quiser para salvar ou compartilhar." : "Não consegui copiar. Copie o endereço da barra do navegador.";
    if (location.protocol === "file:") msg += " (No seu PC o link só abre aí; depois de publicado funciona para todos.)";
    mostrarAviso(msg);
  }

  // ---------- Início ----------
  function iniciar() {
    if (ARTE) $("#ml-defs").innerHTML = ARTE.DEFS; // padrões de camuflagem (SVG estático)
    document.querySelectorAll(".modo-vista button").forEach((b) => b.addEventListener("click", () => trocarVista(b.dataset.modo)));
    window.addEventListener("operador3d-carregado", () => { if (modoVista === "3d") ativar3D(); });
    if (window.Operador3D && modoVista === "3d") ativar3D();

    const campoNome = $("#nome-loadout");
    campoNome.addEventListener("input", () => { estado.nome = textoLimpo(campoNome.value, 60); salvar(); });
    $("#btn-copiar").addEventListener("click", copiarLink);
    $("#btn-limpar").addEventListener("click", () => {
      if (!estado.itens.length && !estado.nome) return;
      if (!confirmarLimpeza()) return;
      estado = { nome: "", itens: [] };
      campoNome.value = "";
      salvar();
      renderMontagem();
      mostrarAviso("Loadout limpo.");
    });

    $("#busca").addEventListener("input", (e) => { sel.busca = e.target.value; renderTabela(); });
    $("#seletor-fechar").addEventListener("click", fecharSeletor);
    seletor.addEventListener("click", (e) => { if (e.target === seletor) fecharSeletor(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sel) fecharSeletor(); });
    $("#manual").addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = textoLimpo($("#manual-nome").value, 80);
      if (!nome) return;
      const vagaId = sel.vaga.id;
      escolher(vagaId, { m: nome.slice(0, 80) });
      fecharSeletor();
      mostrarAviso(nome + " adicionado.");
    });

    window.addEventListener("hashchange", () => {
      estado = carregar();
      campoNome.value = estado.nome;
      renderMontagem();
    });

    estado = carregar();
    campoNome.value = estado.nome;
    salvar();
    renderMontagem();
  }

  // Botão "Limpar" pede um segundo clique para confirmar (sem janelas do navegador)
  let limparArmado = false, timerLimpar;
  function confirmarLimpeza() {
    const b = $("#btn-limpar");
    if (limparArmado) { limparArmado = false; b.textContent = "Limpar"; return true; }
    limparArmado = true;
    b.textContent = "Clique de novo";
    clearTimeout(timerLimpar);
    timerLimpar = setTimeout(() => { limparArmado = false; b.textContent = "Limpar"; }, 3000);
    return false;
  }

  iniciar();
})();
