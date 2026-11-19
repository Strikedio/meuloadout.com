/*
 * Meu Loadout — lógica da página
 * O loadout fica guardado no próprio link (depois do #), então dá para
 * salvar nos favoritos ou mandar para outra pessoa sem precisar de login.
 */
(function () {
  "use strict";

  const CATALOGO = window.MEULOADOUT_CATALOGO || [];
  const LOJAS = window.MEULOADOUT_LOJAS || [];
  const CHAVE_LOCAL = "meuloadout:v1";

  // Índices para achar categoria/item rápido
  const categoriaPorId = new Map(CATALOGO.map((c) => [c.id, c]));
  function acharItem(catId, itemId) {
    const cat = categoriaPorId.get(catId);
    return cat ? cat.itens.find((i) => i.id === itemId) : undefined;
  }

  // Estado: { nome: "", itens: [{ c: catId, i: itemId, d: detalhe }] }
  let estado = { nome: "", itens: [] };
  let categoriaAtual = null;

  // ---------- Elementos ----------
  const $ = (sel) => document.querySelector(sel);
  const svg = $("#silhueta");
  const atalhos = $("#atalhos");
  const pecasTitulo = $("#pecas-titulo");
  const pecasDica = $("#pecas-dica");
  const pecasLista = $("#pecas-lista");
  const tplPeca = $("#tpl-peca");
  const loadoutLista = $("#loadout-lista");
  const loadoutVazio = $("#loadout-vazio");
  const contador = $("#contador");
  const campoNome = $("#nome-loadout");
  const aviso = $("#aviso");

  // ---------- Link compartilhável (base64url de JSON) ----------
  function codificar(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodificar(texto) {
    const b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function estadoParaCompacto() {
    return { n: estado.nome, l: estado.itens.map((x) => (x.d ? [x.c, x.i, x.d] : [x.c, x.i])) };
  }
  function compactoParaEstado(obj) {
    const itens = Array.isArray(obj && obj.l) ? obj.l : [];
    return {
      nome: typeof obj.n === "string" ? obj.n.slice(0, 60) : "",
      itens: itens
        .filter((x) => Array.isArray(x) && acharItem(x[0], x[1]))
        .map((x) => ({ c: x[0], i: x[1], d: typeof x[2] === "string" ? x[2].slice(0, 60) : "" })),
    };
  }

  function salvar() {
    const hash = estado.itens.length || estado.nome ? "#l=" + codificar(estadoParaCompacto()) : "";
    history.replaceState(null, "", location.pathname + location.search + hash);
    try {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(estadoParaCompacto()));
    } catch (e) { /* navegador sem armazenamento: o link já guarda tudo */ }
  }

  function carregar() {
    const m = location.hash.match(/^#l=([A-Za-z0-9_-]+)$/);
    if (m) {
      try { return compactoParaEstado(decodificar(m[1])); } catch (e) { /* link inválido */ }
    }
    try {
      const salvo = localStorage.getItem(CHAVE_LOCAL);
      if (salvo) return compactoParaEstado(JSON.parse(salvo));
    } catch (e) { /* ignora */ }
    return { nome: "", itens: [] };
  }

  // ---------- Busca nas lojas ----------
  function termoBusca(entrada) {
    const item = acharItem(entrada.c, entrada.i);
    return entrada.d ? item.busca + " " + entrada.d : item.busca;
  }
  function urlLoja(loja, termo) {
    const t = loja.formato === "hifen"
      ? encodeURIComponent(termo.trim().replace(/\s+/g, "-"))
      : encodeURIComponent(termo.trim());
    return loja.url.replace("{q}", t);
  }

  // ---------- Categorias ----------
  function montarAtalhos() {
    CATALOGO.forEach((cat) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atalho";
      b.dataset.cat = cat.id;
      b.textContent = cat.nome;
      b.addEventListener("click", () => selecionarCategoria(cat.id));
      atalhos.appendChild(b);
    });
  }

  function selecionarCategoria(catId) {
    const cat = categoriaPorId.get(catId);
    if (!cat) return;
    categoriaAtual = catId;

    document.querySelectorAll("[data-cat]").forEach((el) =>
      el.classList.toggle("ativa", el.dataset.cat === catId)
    );

    pecasTitulo.textContent = cat.nome;
    pecasDica.textContent = "Escolha a peça. Se já souber a marca ou o modelo, escreva para refinar a busca.";
    pecasLista.innerHTML = "";

    // Agrupa os itens por "grupo"
    const grupos = new Map();
    cat.itens.forEach((it) => {
      if (!grupos.has(it.grupo)) grupos.set(it.grupo, []);
      grupos.get(it.grupo).push(it);
    });

    grupos.forEach((itens, nomeGrupo) => {
      const h = document.createElement("h4");
      h.className = "grupo-titulo";
      h.textContent = nomeGrupo;
      pecasLista.appendChild(h);

      itens.forEach((it) => {
        const no = tplPeca.content.firstElementChild.cloneNode(true);
        no.querySelector(".peca-grupo").textContent = nomeGrupo;
        no.querySelector(".peca-nome").textContent = it.nome;
        const campo = no.querySelector(".peca-detalhe");
        const botao = no.querySelector(".btn-adicionar");
        const adicionarEste = () => {
          adicionar(cat.id, it.id, campo.value.trim());
          campo.value = "";
        };
        botao.addEventListener("click", adicionarEste);
        campo.addEventListener("keydown", (e) => { if (e.key === "Enter") adicionarEste(); });
        if (estado.itens.some((x) => x.c === cat.id && x.i === it.id)) no.classList.add("no-loadout");
        pecasLista.appendChild(no);
      });
    });

    if (window.matchMedia("(max-width: 900px)").matches) {
      $(".bloco-pecas").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---------- Loadout ----------
  function adicionar(c, i, d) {
    if (estado.itens.some((x) => x.c === c && x.i === i && x.d.toLowerCase() === d.toLowerCase())) {
      mostrarAviso("Essa peça já está no loadout.");
      return;
    }
    estado.itens.push({ c, i, d });
    salvar();
    renderLoadout();
    if (categoriaAtual) selecionarCategoria(categoriaAtual);
    mostrarAviso(acharItem(c, i).nome + " adicionado.");
  }

  function remover(indice) {
    estado.itens.splice(indice, 1);
    salvar();
    renderLoadout();
    if (categoriaAtual) selecionarCategoria(categoriaAtual);
  }

  function renderLoadout() {
    loadoutLista.innerHTML = "";
    contador.textContent = String(estado.itens.length);
    loadoutVazio.hidden = estado.itens.length > 0;

    // Marca na silhueta as regiões que já têm peça
    const comItem = new Set(estado.itens.map((x) => x.c));
    document.querySelectorAll("[data-cat]").forEach((el) =>
      el.classList.toggle("tem-item", comItem.has(el.dataset.cat))
    );

    // Mostra na ordem do catálogo
    const ordem = CATALOGO.map((c) => c.id);
    const indices = estado.itens
      .map((x, idx) => idx)
      .sort((a, b) => ordem.indexOf(estado.itens[a].c) - ordem.indexOf(estado.itens[b].c));

    indices.forEach((idx) => {
      const entrada = estado.itens[idx];
      const cat = categoriaPorId.get(entrada.c);
      const item = acharItem(entrada.c, entrada.i);

      const li = document.createElement("li");
      li.className = "entrada";

      const topo = document.createElement("div");
      topo.className = "entrada-topo";
      const textos = document.createElement("div");
      const rot = document.createElement("span");
      rot.className = "entrada-cat";
      rot.textContent = cat.nome;
      const nome = document.createElement("strong");
      nome.textContent = item.nome + (entrada.d ? " — " + entrada.d : "");
      textos.append(rot, nome);

      const btnRemover = document.createElement("button");
      btnRemover.type = "button";
      btnRemover.className = "btn-remover";
      btnRemover.setAttribute("aria-label", "Remover " + item.nome);
      btnRemover.textContent = "×";
      btnRemover.addEventListener("click", () => remover(idx));
      topo.append(textos, btnRemover);

      const lojas = document.createElement("div");
      lojas.className = "entrada-lojas";
      const termo = termoBusca(entrada);
      LOJAS.forEach((loja) => {
        const a = document.createElement("a");
        a.href = urlLoja(loja, termo);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = loja.nome;
        lojas.appendChild(a);
      });

      li.append(topo, lojas);
      loadoutLista.appendChild(li);
    });
  }

  // ---------- Ações ----------
  let timerAviso;
  function mostrarAviso(msg) {
    aviso.textContent = msg;
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => (aviso.textContent = ""), 3500);
  }

  async function copiarLink() {
    if (!estado.itens.length) {
      mostrarAviso("Adicione pelo menos uma peça antes de copiar o link.");
      return;
    }
    const link = location.href;
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = link;
      document.body.appendChild(t);
      t.select();
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      t.remove();
    }
    let msg = ok ? "Link copiado! Cole onde quiser para salvar ou compartilhar." : "Não consegui copiar. Copie o endereço da barra do navegador.";
    if (location.protocol === "file:") msg += " (Rodando no seu PC, o link só abre aí. Depois de publicado, funciona para todo mundo.)";
    mostrarAviso(msg);
  }

  function limpar() {
    if (!estado.itens.length && !estado.nome) return;
    estado = { nome: "", itens: [] };
    campoNome.value = "";
    salvar();
    renderLoadout();
    if (categoriaAtual) selecionarCategoria(categoriaAtual);
    mostrarAviso("Loadout limpo.");
  }

  // ---------- Início ----------
  function iniciar() {
    montarAtalhos();

    svg.querySelectorAll(".regiao").forEach((el) => {
      el.addEventListener("click", () => selecionarCategoria(el.dataset.cat));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selecionarCategoria(el.dataset.cat);
        }
      });
    });

    campoNome.addEventListener("input", () => {
      estado.nome = campoNome.value.slice(0, 60);
      salvar();
    });
    $("#btn-copiar").addEventListener("click", copiarLink);
    $("#btn-limpar").addEventListener("click", limpar);

    window.addEventListener("hashchange", () => {
      estado = carregar();
      campoNome.value = estado.nome;
      renderLoadout();
    });

    estado = carregar();
    campoNome.value = estado.nome;
    salvar();
    renderLoadout();
    if (estado.nome) document.title = estado.nome + " — Meu Loadout";
  }

  iniciar();
})();
