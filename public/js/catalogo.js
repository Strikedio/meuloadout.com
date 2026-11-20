/*
 * Catálogo do Meu Loadout (v2)
 * ============================
 * REGIÕES  -> partes da silhueta (cabeça, peito...)
 * VAGAS    -> linhas da tabela de montagem (ex.: "Mira", "Magazines"). Cada vaga pertence a uma região.
 *             multiplo: true  = o operador pode escolher vários produtos (ex.: magazines)
 *             base: true      = peça "principal" (arma): a lista mostra tudo e só sinaliza o que vai conflitar
 *             colunas         = atributos mostrados na lista e usados como filtro
 *             curto           = nome curto mostrado no slot do inventário
 * PRODUTOS -> o que aparece na lista de cada vaga.
 *             id      -> único no catálogo inteiro; vai dentro do link compartilhado (não mude depois de publicado)
 *             a       -> atributos (as chaves precisam bater com as "colunas" da vaga)
 *             busca   -> termo de busca nas lojas (se não tiver, usa o nome)
 *             req     -> regras de compatibilidade (ver abaixo)
 *             img     -> opcional: foto do produto. "img/produtos/arquivo.webp" (arquivo dentro de public/)
 *                        ou endereço https de host liberado (por enquanto só http2.mlstatic.com, do Mercado Livre).
 *                        Use só fotos que você tem permissão de usar. Sem foto, o site mostra o desenho da peça.
 *
 * REGRAS DE COMPATIBILIDADE
 *   req("armaPrincipal", "plataforma", ["M4"])
 *   = "este produto só combina com uma arma principal cuja plataforma seja M4".
 *   Nível "erro" (padrão) = não combina. Nível "aviso" = combina com ressalva (ex.: precisa de adaptador).
 *   A regra só é checada quando a vaga-alvo já tem algo escolhido.
 *
 * Os nomes/atributos são um catálogo inicial: confira as especificações antes de publicar
 * e vá incluindo produtos aos poucos. O operador também pode digitar uma peça que não está na lista.
 */
(function () {
  function req(alvo, campo, aceita, nivel, msg) {
    return { alvo: alvo, campo: campo, aceita: aceita, nivel: nivel || "erro", msg: msg };
  }
  const SEM_TRILHO = "precisa de trilho superior; confira se a arma precisa de base ou side mount.";

  const regioes = [
    { id: "armaPrincipal", nome: "Arma principal" },
    { id: "armaSecundaria", nome: "Arma secundária" },
    { id: "cabeca", nome: "Cabeça" },
    { id: "peito", nome: "Peito" },
    { id: "corpoSuperior", nome: "Corpo superior" },
    { id: "maos", nome: "Mãos" },
    { id: "cinto", nome: "Cinto" },
    { id: "corpoInferior", nome: "Corpo inferior" },
    { id: "pes", nome: "Pés" },
    { id: "costas", nome: "Costas" }
  ];

  const vagas = [
    // Arma principal
    { id: "armaPrincipal", curto: "Arma principal", regiao: "armaPrincipal", nome: "Arma principal", base: true, colunas: [["marca", "Marca"], ["plataforma", "Plataforma"], ["sistema", "Sistema"], ["trilho", "Trilho superior"]] },
    { id: "mira", curto: "Mira", regiao: "armaPrincipal", nome: "Mira", colunas: [["tipo", "Tipo"], ["aumento", "Aumento"]] },
    { id: "magRifle", curto: "Magazines", regiao: "armaPrincipal", nome: "Magazines", multiplo: true, colunas: [["plataforma", "Plataforma"], ["tipo", "Tipo"]] },
    { id: "bateria", curto: "Bateria", regiao: "armaPrincipal", nome: "Bateria e carregador", multiplo: true, colunas: [["tipo", "Tipo"], ["conector", "Conector"]] },
    { id: "upgrades", curto: "Upgrades", regiao: "armaPrincipal", nome: "Upgrades internos", multiplo: true, colunas: [["tipo", "Tipo"], ["para", "Para"]] },
    { id: "acessRifle", curto: "Acessórios", regiao: "armaPrincipal", nome: "Acessórios", multiplo: true, colunas: [["tipo", "Tipo"]] },
    // Arma secundária
    { id: "armaSecundaria", curto: "Pistola", regiao: "armaSecundaria", nome: "Pistola", base: true, colunas: [["marca", "Marca"], ["plataforma", "Plataforma"], ["sistema", "Sistema"], ["trilho", "Trilho"]] },
    { id: "magPistola", curto: "Mags pistola", regiao: "armaSecundaria", nome: "Magazines de pistola", multiplo: true, colunas: [["plataforma", "Plataforma"]] },
    { id: "energiaPistola", curto: "Gás / bateria", regiao: "armaSecundaria", nome: "Gás / bateria da pistola", multiplo: true, colunas: [["tipo", "Tipo"], ["para", "Para"]] },
    { id: "acessPistola", curto: "Acessórios", regiao: "armaSecundaria", nome: "Acessórios de pistola", multiplo: true, colunas: [["tipo", "Tipo"]] },
    // Cabeça
    { id: "oculos", curto: "Óculos", regiao: "cabeca", nome: "Proteção dos olhos", colunas: [["tipo", "Tipo"], ["marca", "Marca"]] },
    { id: "mascara", curto: "Rosto", regiao: "cabeca", nome: "Proteção do rosto", colunas: [["tipo", "Tipo"]] },
    { id: "capacete", curto: "Capacete", regiao: "cabeca", nome: "Capacete / boné", colunas: [["tipo", "Tipo"], ["marca", "Marca"]] },
    { id: "comunicacao", curto: "Rádio / fone", regiao: "cabeca", nome: "Comunicação", multiplo: true, colunas: [["tipo", "Tipo"], ["marca", "Marca"]] },
    // Peito
    { id: "colete", curto: "Colete", regiao: "peito", nome: "Colete", colunas: [["tipo", "Tipo"], ["marca", "Marca"]] },
    { id: "pouchPeito", curto: "Pouches", regiao: "peito", nome: "Pouches do colete", multiplo: true, colunas: [["tipo", "Tipo"], ["para", "Para"]] },
    // Corpo
    { id: "camisa", curto: "Camisa", regiao: "corpoSuperior", nome: "Camisa / jaqueta", colunas: [["tipo", "Tipo"], ["marca", "Marca"]] },
    { id: "luvas", curto: "Luvas", regiao: "maos", nome: "Luvas", colunas: [["tipo", "Tipo"], ["marca", "Marca"]] },
    { id: "cinto", curto: "Cinto", regiao: "cinto", nome: "Cinto", colunas: [["tipo", "Tipo"]] },
    { id: "coldre", curto: "Coldre", regiao: "cinto", nome: "Coldre", colunas: [["tipo", "Tipo"], ["para", "Para"]] },
    { id: "pouchCinto", curto: "Módulos", regiao: "cinto", nome: "Módulos do cinto", multiplo: true, colunas: [["tipo", "Tipo"], ["para", "Para"]] },
    { id: "calca", curto: "Calça", regiao: "corpoInferior", nome: "Calça", colunas: [["tipo", "Tipo"]] },
    { id: "joelheira", curto: "Joelheira", regiao: "corpoInferior", nome: "Joelheira", colunas: [["tipo", "Tipo"]] },
    { id: "calcado", curto: "Calçado", regiao: "pes", nome: "Calçado", colunas: [["tipo", "Tipo"]] },
    { id: "mochila", curto: "Mochila", regiao: "costas", nome: "Mochila", colunas: [["tipo", "Tipo"]] }
  ];

  const P = (vaga, id, nome, a, extra) => Object.assign({ vaga: vaga, id: id, nome: nome, a: a }, extra || {});

  const produtos = [
    // ---------- Arma principal ----------
    P("armaPrincipal", "sa-e05", "Specna Arms SA-E05 EDGE", { marca: "Specna Arms", plataforma: "M4", sistema: "AEG", trilho: "Sim" }),
    P("armaPrincipal", "sa-c01", "Specna Arms SA-C01 CORE", { marca: "Specna Arms", plataforma: "M4", sistema: "AEG", trilho: "Sim" }),
    P("armaPrincipal", "gg-raider", "G&G CM16 Raider 2.0", { marca: "G&G", plataforma: "M4", sistema: "AEG", trilho: "Sim" }),
    P("armaPrincipal", "krytac-trident", "Krytac Trident Mk2 CRB", { marca: "Krytac", plataforma: "M4", sistema: "AEG", trilho: "Sim" }),
    P("armaPrincipal", "tm-mws", "Tokyo Marui M4A1 MWS", { marca: "Tokyo Marui", plataforma: "M4 MWS", sistema: "GBB", trilho: "Sim" }),
    P("armaPrincipal", "cyma-028", "Cyma CM.028 (AK-47)", { marca: "Cyma", plataforma: "AK", sistema: "AEG", trilho: "Não" }),
    P("armaPrincipal", "cyma-041", "Cyma CM.041 (MP5)", { marca: "Cyma", plataforma: "MP5", sistema: "AEG", trilho: "Varia" }),
    P("armaPrincipal", "jg-g36c", "JG G36C", { marca: "JG", plataforma: "G36", sistema: "AEG", trilho: "Sim" }, { busca: "airsoft g36c aeg" }),
    P("armaPrincipal", "gg-gr25", "G&G GR25 (SR-25)", { marca: "G&G", plataforma: "SR-25", sistema: "AEG", trilho: "Sim" }),
    P("armaPrincipal", "tm-vsr10", "Tokyo Marui VSR-10", { marca: "Tokyo Marui", plataforma: "VSR-10", sistema: "Spring", trilho: "Varia" }),
    P("armaPrincipal", "nov-ssg10", "Novritsch SSG10", { marca: "Novritsch", plataforma: "VSR-10", sistema: "Spring", trilho: "Sim" }),
    P("armaPrincipal", "ares-striker", "Ares Striker AS01", { marca: "Ares", plataforma: "Striker", sistema: "Spring", trilho: "Sim" }),
    P("armaPrincipal", "cyma-m870", "Cyma M870 (CM.350)", { marca: "Cyma", plataforma: "Shotgun M870", sistema: "Spring", trilho: "Varia" }),

    // Mira
    P("mira", "reddot-vo", "Red dot Vector Optics", { tipo: "Red dot", aumento: "1x" }, { req: [req("armaPrincipal", "trilho", ["Sim"], "aviso", SEM_TRILHO)] }),
    P("mira", "holo-rep", "Holográfica estilo EOTech (réplica)", { tipo: "Holográfica", aumento: "1x" }, { busca: "mira holográfica airsoft", req: [req("armaPrincipal", "trilho", ["Sim"], "aviso", SEM_TRILHO)] }),
    P("mira", "acog-rep", "ACOG 4x32 (réplica)", { tipo: "Luneta fixa", aumento: "4x" }, { busca: "acog 4x32 airsoft", req: [req("armaPrincipal", "trilho", ["Sim"], "aviso", SEM_TRILHO)] }),
    P("mira", "lpvo-vo", "LPVO 1-6x Vector Optics", { tipo: "LPVO", aumento: "1-6x" }, { req: [req("armaPrincipal", "trilho", ["Sim"], "aviso", SEM_TRILHO)] }),
    P("mira", "luneta-39", "Luneta 3-9x40", { tipo: "Luneta variável", aumento: "3-9x" }, { busca: "luneta 3-9x40 airsoft", req: [req("armaPrincipal", "trilho", ["Sim"], "aviso", SEM_TRILHO)] }),
    P("mira", "mbus", "Mira de ferro rebatível", { tipo: "Mira de ferro", aumento: "—" }, { busca: "mira de ferro rebatível airsoft", req: [req("armaPrincipal", "trilho", ["Sim"], "aviso", SEM_TRILHO)] }),

    // Magazines de rifle
    P("magRifle", "mag-m4-mid", "Magazine M4 mid-cap", { plataforma: "M4", tipo: "Mid-cap" }, { busca: "magazine m4 mid cap airsoft", req: [req("armaPrincipal", "plataforma", ["M4"])] }),
    P("magRifle", "mag-m4-hi", "Magazine M4 hi-cap", { plataforma: "M4", tipo: "Hi-cap" }, { busca: "magazine m4 hi cap airsoft", req: [req("armaPrincipal", "plataforma", ["M4"])] }),
    P("magRifle", "mag-mws", "Magazine GBB Tokyo Marui MWS", { plataforma: "M4 MWS", tipo: "GBB" }, { req: [req("armaPrincipal", "plataforma", ["M4 MWS"])] }),
    P("magRifle", "mag-ak-mid", "Magazine AK mid-cap", { plataforma: "AK", tipo: "Mid-cap" }, { busca: "magazine ak mid cap airsoft", req: [req("armaPrincipal", "plataforma", ["AK"])] }),
    P("magRifle", "mag-ak-hi", "Magazine AK hi-cap", { plataforma: "AK", tipo: "Hi-cap" }, { busca: "magazine ak hi cap airsoft", req: [req("armaPrincipal", "plataforma", ["AK"])] }),
    P("magRifle", "mag-mp5", "Magazine MP5", { plataforma: "MP5", tipo: "Mid-cap" }, { busca: "magazine mp5 airsoft", req: [req("armaPrincipal", "plataforma", ["MP5"])] }),
    P("magRifle", "mag-g36", "Magazine G36", { plataforma: "G36", tipo: "Mid-cap" }, { busca: "magazine g36 airsoft", req: [req("armaPrincipal", "plataforma", ["G36"])] }),
    P("magRifle", "mag-sr25", "Magazine SR-25", { plataforma: "SR-25", tipo: "Mid-cap" }, { busca: "magazine sr25 airsoft", req: [req("armaPrincipal", "plataforma", ["SR-25"])] }),
    P("magRifle", "mag-vsr", "Magazine VSR-10", { plataforma: "VSR-10", tipo: "Sniper" }, { busca: "magazine vsr-10 airsoft", req: [req("armaPrincipal", "plataforma", ["VSR-10"])] }),
    P("magRifle", "mag-striker", "Magazine Ares Striker", { plataforma: "Striker", tipo: "Sniper" }, { req: [req("armaPrincipal", "plataforma", ["Striker"])] }),
    P("magRifle", "shells-m870", "Cartuchos (shells) M870", { plataforma: "Shotgun M870", tipo: "Shell" }, { busca: "shell m870 airsoft", req: [req("armaPrincipal", "plataforma", ["Shotgun M870"])] }),

    // Bateria
    P("bateria", "lipo-74-stick-tam", "LiPo 7.4v stick", { tipo: "Bateria 7.4v", conector: "Tamiya mini" }, { busca: "bateria lipo 7.4v stick tamiya airsoft", req: [req("armaPrincipal", "sistema", ["AEG"])] }),
    P("bateria", "lipo-74-stick-td", "LiPo 7.4v stick", { tipo: "Bateria 7.4v", conector: "T-Dean" }, { busca: "bateria lipo 7.4v stick t-dean airsoft", req: [req("armaPrincipal", "sistema", ["AEG"])] }),
    P("bateria", "lipo-111-stick-td", "LiPo 11.1v stick (ideal com MOSFET)", { tipo: "Bateria 11.1v", conector: "T-Dean" }, { busca: "bateria lipo 11.1v airsoft", req: [req("armaPrincipal", "sistema", ["AEG"])] }),
    P("bateria", "lipo-74-butterfly", "LiPo 7.4v butterfly", { tipo: "Bateria 7.4v", conector: "T-Dean" }, { busca: "bateria lipo 7.4v butterfly airsoft", req: [req("armaPrincipal", "sistema", ["AEG"])] }),
    P("bateria", "carregador-lipo", "Carregador balanceador LiPo", { tipo: "Carregador", conector: "—" }, { busca: "carregador balanceador lipo", req: [req("armaPrincipal", "sistema", ["AEG"])] }),

    // Upgrades internos
    P("upgrades", "hopup-m4", "Câmara de hop-up M4", { tipo: "Hop-up", para: "M4" }, { busca: "câmara hop up m4 airsoft", req: [req("armaPrincipal", "plataforma", ["M4"])] }),
    P("upgrades", "hopup-ak", "Câmara de hop-up AK", { tipo: "Hop-up", para: "AK" }, { busca: "câmara hop up ak airsoft", req: [req("armaPrincipal", "plataforma", ["AK"])] }),
    P("upgrades", "bucking-aeg", "Bucking 60° (AEG)", { tipo: "Bucking", para: "AEG" }, { busca: "bucking airsoft aeg", req: [req("armaPrincipal", "sistema", ["AEG"])] }),
    P("upgrades", "nub-aeg", "Nub de hop-up (AEG)", { tipo: "Nub", para: "AEG" }, { busca: "nub hop up airsoft", req: [req("armaPrincipal", "sistema", ["AEG"])] }),
    P("upgrades", "pistao-aeg", "Pistão reforçado (AEG)", { tipo: "Pistão", para: "AEG" }, { busca: "pistão reforçado airsoft aeg", req: [req("armaPrincipal", "sistema", ["AEG"])] }),
    P("upgrades", "mola-aeg", "Mola M110 / M120 (AEG)", { tipo: "Mola", para: "AEG" }, { busca: "mola m120 airsoft aeg", req: [req("armaPrincipal", "sistema", ["AEG"])] }),
    P("upgrades", "bucking-vsr", "Bucking para VSR-10", { tipo: "Bucking", para: "VSR-10" }, { busca: "bucking vsr-10", req: [req("armaPrincipal", "plataforma", ["VSR-10"])] }),
    P("upgrades", "gatilho-vsr", "Kit de gatilho 90° VSR-10", { tipo: "Gatilho", para: "VSR-10" }, { busca: "trigger set 90 vsr-10", req: [req("armaPrincipal", "plataforma", ["VSR-10"])] }),
    P("upgrades", "mola-vsr", "Mola M150 VSR-10", { tipo: "Mola", para: "VSR-10" }, { busca: "mola m150 vsr-10", req: [req("armaPrincipal", "plataforma", ["VSR-10"])] }),

    // Acessórios de rifle
    P("acessRifle", "bandoleira", "Bandoleira 2 pontos", { tipo: "Bandoleira" }, { busca: "bandoleira tática 2 pontos" }),
    P("acessRifle", "handgrip", "Empunhadura frontal", { tipo: "Empunhadura" }, { busca: "empunhadura frontal airsoft" }),
    P("acessRifle", "lanterna-rifle", "Lanterna tática para trilho", { tipo: "Lanterna" }, { busca: "lanterna tática picatinny airsoft" }),
    P("acessRifle", "bipe", "Bipé", { tipo: "Bipé" }, { busca: "bipé airsoft picatinny" }),

    // ---------- Arma secundária ----------
    P("armaSecundaria", "tm-g17", "Tokyo Marui Glock 17 Gen4", { marca: "Tokyo Marui", plataforma: "Glock TM", sistema: "GBB", trilho: "Sim" }),
    P("armaSecundaria", "we-g17", "WE G17", { marca: "WE", plataforma: "Glock WE", sistema: "GBB", trilho: "Sim" }, { busca: "pistola airsoft we g17 gbb" }),
    P("armaSecundaria", "tm-hicapa", "Tokyo Marui Hi-Capa 5.1", { marca: "Tokyo Marui", plataforma: "Hi-Capa TM", sistema: "GBB", trilho: "Varia" }),
    P("armaSecundaria", "we-1911", "WE 1911", { marca: "WE", plataforma: "1911 WE", sistema: "GBB", trilho: "Não" }, { busca: "pistola airsoft we 1911 gbb" }),
    P("armaSecundaria", "kj-m9", "KJ Works M9", { marca: "KJ Works", plataforma: "M9 KJ", sistema: "GBB", trilho: "Não" }),
    P("armaSecundaria", "cyma-030", "Cyma CM.030 (Glock 18C)", { marca: "Cyma", plataforma: "Glock 18C AEP", sistema: "AEP", trilho: "Sim" }),

    P("magPistola", "mag-g17-tm", "Magazine Glock (Tokyo Marui)", { plataforma: "Glock TM" }, { busca: "magazine glock tokyo marui gbb", req: [req("armaSecundaria", "plataforma", ["Glock TM"])] }),
    P("magPistola", "mag-g17-we", "Magazine Glock (WE)", { plataforma: "Glock WE" }, { busca: "magazine glock we gbb", req: [req("armaSecundaria", "plataforma", ["Glock WE"])] }),
    P("magPistola", "mag-hicapa-tm", "Magazine Hi-Capa (Tokyo Marui)", { plataforma: "Hi-Capa TM" }, { busca: "magazine hi-capa tokyo marui", req: [req("armaSecundaria", "plataforma", ["Hi-Capa TM"])] }),
    P("magPistola", "mag-1911-we", "Magazine 1911 (WE)", { plataforma: "1911 WE" }, { busca: "magazine 1911 we gbb", req: [req("armaSecundaria", "plataforma", ["1911 WE"])] }),
    P("magPistola", "mag-m9-kj", "Magazine M9 (KJ Works)", { plataforma: "M9 KJ" }, { busca: "magazine m9 kj works", req: [req("armaSecundaria", "plataforma", ["M9 KJ"])] }),
    P("magPistola", "mag-cm030", "Magazine Cyma CM.030", { plataforma: "Glock 18C AEP" }, { busca: "magazine cyma cm030", req: [req("armaSecundaria", "plataforma", ["Glock 18C AEP"])] }),

    P("energiaPistola", "green-gas", "Green gas (lata)", { tipo: "Gás", para: "GBB" }, { busca: "green gas airsoft", req: [req("armaSecundaria", "sistema", ["GBB"])] }),
    P("energiaPistola", "oleo-silicone", "Óleo de silicone", { tipo: "Manutenção", para: "GBB" }, { busca: "óleo de silicone airsoft" }),
    P("energiaPistola", "bat-aep", "Bateria 7.2v para AEP + carregador", { tipo: "Bateria", para: "AEP" }, { busca: "bateria 7.2v aep airsoft", req: [req("armaSecundaria", "sistema", ["AEP"])] }),

    P("acessPistola", "lanterna-pistola", "Lanterna para pistola", { tipo: "Lanterna" }, { busca: "lanterna tática pistola trilho", req: [req("armaSecundaria", "trilho", ["Sim"], "aviso", "precisa de trilho embaixo do cano; confira se a sua versão tem.")] }),
    P("acessPistola", "reddot-pistola", "Red dot para pistola", { tipo: "Red dot" }, { busca: "red dot pistola airsoft" }),

    // ---------- Cabeça ----------
    P("oculos", "ess-crossbow", "ESS Crossbow", { tipo: "Óculos balístico", marca: "ESS" }),
    P("oculos", "oakley-mframe", "Oakley SI Ballistic M Frame", { tipo: "Óculos balístico", marca: "Oakley" }),
    P("oculos", "oculos-telado", "Óculos de tela (mesh)", { tipo: "Óculos de tela", marca: "Diversas" }, { busca: "óculos tela airsoft" }),
    P("oculos", "goggle", "Goggle antiembaçante", { tipo: "Goggle", marca: "Diversas" }, { busca: "goggle airsoft antiembaçante" }),
    P("mascara", "meia-face", "Máscara de tela meia face", { tipo: "Meia face" }, { busca: "máscara tela meia face airsoft" }),
    P("mascara", "full-face", "Máscara full face", { tipo: "Full face" }, { busca: "máscara full face airsoft" }),
    P("mascara", "balaclava", "Balaclava", { tipo: "Balaclava" }, { busca: "balaclava tática" }),
    P("capacete", "fast-emerson", "Capacete FAST Emerson Gear", { tipo: "Capacete FAST", marca: "Emerson Gear" }),
    P("capacete", "fast-rep", "Capacete FAST (réplica)", { tipo: "Capacete FAST", marca: "Diversas" }, { busca: "capacete fast airsoft" }),
    P("capacete", "bone", "Boné tático com velcro", { tipo: "Boné", marca: "Diversas" }, { busca: "boné tático velcro" }),
    P("comunicacao", "baofeng-uv5r", "Baofeng UV-5R", { tipo: "Rádio", marca: "Baofeng" }),
    P("comunicacao", "earmor-m32", "Earmor M32", { tipo: "Headset", marca: "Earmor" }),
    P("comunicacao", "zsordin", "Z-Tactical zSordin", { tipo: "Headset", marca: "Z-Tactical" }),
    P("comunicacao", "ptt", "PTT (botão push-to-talk)", { tipo: "PTT", marca: "Diversas" }, { busca: "ptt tático rádio" }),

    // ---------- Peito ----------
    P("colete", "jpc-emerson", "Plate carrier JPC Emerson Gear", { tipo: "Plate carrier", marca: "Emerson Gear" }),
    P("colete", "pc-invictus", "Plate carrier Invictus", { tipo: "Plate carrier", marca: "Invictus" }),
    P("colete", "pc-generico", "Plate carrier", { tipo: "Plate carrier", marca: "Diversas" }, { busca: "plate carrier airsoft" }),
    P("colete", "chestrig", "Chest rig", { tipo: "Chest rig", marca: "Diversas" }, { busca: "chest rig airsoft" }),
    P("colete", "molle", "Colete modular MOLLE", { tipo: "Colete MOLLE", marca: "Diversas" }, { busca: "colete tático modular molle" }),
    P("pouchPeito", "pouch-m4-triplo", "Porta-carregador M4 triplo", { tipo: "Porta-carregador", para: "M4" }, { busca: "porta carregador m4 triplo molle", req: [req("armaPrincipal", "plataforma", ["M4", "M4 MWS", "SR-25"], "aviso", "foi feito para magazines de M4; o magazine da sua arma pode não encaixar.")] }),
    P("pouchPeito", "pouch-ak-duplo", "Porta-carregador AK duplo", { tipo: "Porta-carregador", para: "AK" }, { busca: "porta carregador ak molle", req: [req("armaPrincipal", "plataforma", ["AK"], "aviso", "foi feito para magazines de AK; o magazine da sua arma pode não encaixar.")] }),
    P("pouchPeito", "pouch-universal", "Porta-carregador universal (elástico)", { tipo: "Porta-carregador", para: "Universal" }, { busca: "porta carregador universal elástico molle" }),
    P("pouchPeito", "admin", "Admin pouch", { tipo: "Admin", para: "—" }, { busca: "admin pouch molle" }),
    P("pouchPeito", "pouch-radio", "Porta-rádio", { tipo: "Porta-rádio", para: "—" }, { busca: "porta rádio molle" }),

    // ---------- Corpo superior ----------
    P("camisa", "combat-helikon", "Combat shirt Helikon-Tex", { tipo: "Combat shirt", marca: "Helikon-Tex" }),
    P("camisa", "combat-generica", "Combat shirt", { tipo: "Combat shirt", marca: "Diversas" }, { busca: "combat shirt camuflada" }),
    P("camisa", "gandola", "Gandola camuflada", { tipo: "Gandola", marca: "Diversas" }, { busca: "gandola camuflada" }),
    P("camisa", "softshell", "Jaqueta softshell", { tipo: "Jaqueta", marca: "Diversas" }, { busca: "jaqueta softshell tática" }),

    // ---------- Mãos ----------
    P("luvas", "mechanix-mpact", "Mechanix M-Pact", { tipo: "Dedos inteiros", marca: "Mechanix" }),
    P("luvas", "mechanix-original", "Mechanix Original", { tipo: "Dedos inteiros", marca: "Mechanix" }),
    P("luvas", "luva-meio-dedo", "Luva tática meio-dedo", { tipo: "Meio-dedo", marca: "Diversas" }, { busca: "luva tática meio dedo" }),
    P("luvas", "luva-juntas", "Luva com proteção nas juntas", { tipo: "Dedos inteiros", marca: "Diversas" }, { busca: "luva tática proteção juntas" }),

    // ---------- Cinto ----------
    P("cinto", "battlebelt", "Battle belt", { tipo: "Battle belt" }, { busca: "battle belt cinto tático molle" }),
    P("cinto", "cinto-simples", "Cinto tático simples", { tipo: "Cinto simples" }, { busca: "cinto tático fivela" }),
    P("coldre", "coldre-glock", "Coldre rígido para Glock", { tipo: "Rígido", para: "Glock" }, { busca: "coldre rígido glock airsoft", req: [req("armaSecundaria", "plataforma", ["Glock TM", "Glock WE", "Glock 18C AEP"], "aviso", "este coldre é para Glock.")] }),
    P("coldre", "coldre-1911", "Coldre rígido para 1911", { tipo: "Rígido", para: "1911" }, { busca: "coldre rígido 1911 airsoft", req: [req("armaSecundaria", "plataforma", ["1911 WE"], "aviso", "este coldre é para 1911.")] }),
    P("coldre", "coldre-universal", "Coldre universal de perna", { tipo: "Universal", para: "Universal" }, { busca: "coldre universal perna tático" }),
    P("pouchCinto", "pouch-pistola", "Porta-carregador de pistola duplo", { tipo: "Porta-carregador", para: "Pistola" }, { busca: "porta carregador pistola duplo molle" }),
    P("pouchCinto", "pouch-m4-cinto", "Porta-carregador M4 simples", { tipo: "Porta-carregador", para: "M4" }, { busca: "porta carregador m4 molle", req: [req("armaPrincipal", "plataforma", ["M4", "M4 MWS", "SR-25"], "aviso", "foi feito para magazines de M4; o magazine da sua arma pode não encaixar.")] }),
    P("pouchCinto", "pouch-torniquete", "Porta-torniquete", { tipo: "Porta-torniquete", para: "—" }, { busca: "porta torniquete molle" }),
    P("pouchCinto", "dump-pouch", "Bolsa de despejo (dump pouch)", { tipo: "Dump pouch", para: "—" }, { busca: "dump pouch airsoft" }),

    // ---------- Corpo inferior / pés / costas ----------
    P("calca", "calca-tatica", "Calça tática camuflada", { tipo: "Calça tática" }, { busca: "calça tática camuflada" }),
    P("calca", "combat-pants", "Combat pants com joelheira", { tipo: "Combat pants" }, { busca: "combat pants joelheira" }),
    P("calca", "bermuda", "Bermuda tática", { tipo: "Bermuda" }, { busca: "bermuda tática" }),
    P("joelheira", "joelheira-externa", "Joelheira tática externa", { tipo: "Externa" }, { busca: "joelheira tática airsoft" }),
    P("joelheira", "joelheira-interna", "Joelheira interna (para combat pants)", { tipo: "Interna" }, { busca: "joelheira interna combat pants" }),
    P("calcado", "coturno", "Coturno tático cano alto", { tipo: "Cano alto" }, { busca: "coturno tático" }),
    P("calcado", "bota-media", "Bota tática cano médio", { tipo: "Cano médio" }, { busca: "bota tática cano médio" }),
    P("calcado", "tenis-tatico", "Tênis tático", { tipo: "Tênis" }, { busca: "tênis tático" }),
    P("mochila", "hidratacao", "Mochila de hidratação", { tipo: "Hidratação" }, { busca: "mochila hidratação tática" }),
    P("mochila", "assalto", "Mochila de assalto MOLLE", { tipo: "Assalto" }, { busca: "mochila assalto molle" }),
    P("mochila", "tres-dias", "Mochila tática 3 dias", { tipo: "3 dias" }, { busca: "mochila tática 3 dias" })
  ];

  window.MEULOADOUT = { regioes: regioes, vagas: vagas, produtos: produtos };
})();
