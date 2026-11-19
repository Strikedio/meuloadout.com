/*
 * Catálogo do Meu Loadout
 * -----------------------
 * Cada categoria é uma região da silhueta.
 * Cada item tem:
 *   id     -> identificador curto e único dentro da categoria (vai no link compartilhado, NÃO mude depois de publicado)
 *   nome   -> o que aparece para o operador
 *   grupo  -> agrupa os itens na lista (ex.: "Arma", "Acessório")
 *   busca  -> termo usado para pesquisar nas lojas
 *
 * "atributos" vem dos arquivos .txt da versão antiga e servirá para filtros no futuro.
 * Para incluir uma peça nova, basta copiar uma linha de item e alterar os valores.
 */
window.MEULOADOUT_CATALOGO = [
  {
    id: "cabeca",
    nome: "Cabeça",
    atributos: ["marca", "modelo", "tamanho"],
    itens: [
      { id: "oculos", grupo: "Proteção", nome: "Óculos de proteção balística", busca: "óculos proteção airsoft balístico" },
      { id: "mascara", grupo: "Proteção", nome: "Máscara de tela (meia face)", busca: "máscara tela airsoft meia face" },
      { id: "capacete", grupo: "Proteção", nome: "Capacete FAST", busca: "capacete fast airsoft" },
      { id: "balaclava", grupo: "Vestuário", nome: "Balaclava", busca: "balaclava tática airsoft" },
      { id: "bone", grupo: "Vestuário", nome: "Boné tático", busca: "boné tático velcro" },
      { id: "headset", grupo: "Comunicação", nome: "Headset tático", busca: "headset tático airsoft" },
      { id: "radio", grupo: "Comunicação", nome: "Rádio comunicador", busca: "rádio comunicador baofeng" }
    ]
  },
  {
    id: "corpoSuperior",
    nome: "Corpo superior",
    atributos: ["modelo", "marca", "estampa", "tamanho"],
    itens: [
      { id: "combatshirt", grupo: "Vestuário", nome: "Combat shirt", busca: "combat shirt camuflada" },
      { id: "gandola", grupo: "Vestuário", nome: "Gandola camuflada", busca: "gandola camuflada" },
      { id: "softshell", grupo: "Vestuário", nome: "Jaqueta softshell tática", busca: "jaqueta softshell tática" },
      { id: "camiseta", grupo: "Vestuário", nome: "Camiseta tática dry-fit", busca: "camiseta tática dry fit" },
      { id: "cotoveleira", grupo: "Proteção", nome: "Cotoveleira tática", busca: "cotoveleira tática airsoft" }
    ]
  },
  {
    id: "peito",
    nome: "Peito",
    atributos: ["marca", "modelo", "estampa", "tamanho"],
    itens: [
      { id: "platecarrier", grupo: "Colete", nome: "Plate carrier", busca: "plate carrier airsoft" },
      { id: "chestrig", grupo: "Colete", nome: "Chest rig", busca: "chest rig airsoft" },
      { id: "molle", grupo: "Colete", nome: "Colete modular MOLLE", busca: "colete tático modular molle" },
      { id: "portamag", grupo: "Acessório", nome: "Porta-carregador para colete", busca: "porta carregador molle rifle" },
      { id: "admin", grupo: "Acessório", nome: "Painel admin / porta-objetos", busca: "admin pouch molle" },
      { id: "patch", grupo: "Acessório", nome: "Patch de velcro", busca: "patch velcro airsoft" }
    ]
  },
  {
    id: "maos",
    nome: "Mãos",
    atributos: ["marca", "modelo", "tamanho"],
    itens: [
      { id: "meiodedo", grupo: "Luvas", nome: "Luva tática meio-dedo", busca: "luva tática meio dedo" },
      { id: "dedosinteiros", grupo: "Luvas", nome: "Luva tática dedos inteiros", busca: "luva tática dedos inteiros" },
      { id: "juntas", grupo: "Luvas", nome: "Luva com proteção nas juntas", busca: "luva tática proteção juntas" }
    ]
  },
  {
    id: "cinto",
    nome: "Cinto",
    atributos: ["marca", "modelo", "quantidadeModulos", "portLanterna", "portMag", "portTorniket", "coldre"],
    itens: [
      { id: "battlebelt", grupo: "Cinto", nome: "Battle belt (cinto tático)", busca: "battle belt cinto tático molle" },
      { id: "cintosimples", grupo: "Cinto", nome: "Cinto tático simples", busca: "cinto tático fivela" },
      { id: "coldre", grupo: "Módulo", nome: "Coldre para pistola", busca: "coldre pistola airsoft" },
      { id: "portamagrifle", grupo: "Módulo", nome: "Porta-carregador de rifle", busca: "porta carregador rifle cinto" },
      { id: "portamagpistola", grupo: "Módulo", nome: "Porta-carregador de pistola", busca: "porta carregador pistola cinto" },
      { id: "portatorniquete", grupo: "Módulo", nome: "Porta-torniquete", busca: "porta torniquete molle" },
      { id: "portalanterna", grupo: "Módulo", nome: "Porta-lanterna", busca: "porta lanterna tática molle" },
      { id: "dumppouch", grupo: "Módulo", nome: "Bolsa de despejo (dump pouch)", busca: "dump pouch airsoft" }
    ]
  },
  {
    id: "corpoInferior",
    nome: "Corpo inferior",
    atributos: ["modelo", "marca", "estampa", "tamanho"],
    itens: [
      { id: "calcatatica", grupo: "Vestuário", nome: "Calça tática camuflada", busca: "calça tática camuflada" },
      { id: "combatpants", grupo: "Vestuário", nome: "Combat pants com joelheira", busca: "combat pants joelheira" },
      { id: "bermuda", grupo: "Vestuário", nome: "Bermuda tática", busca: "bermuda tática" },
      { id: "joelheira", grupo: "Proteção", nome: "Joelheira tática", busca: "joelheira tática airsoft" }
    ]
  },
  {
    id: "pes",
    nome: "Pés",
    atributos: ["marca", "modelo", "tamanho"],
    itens: [
      { id: "coturno", grupo: "Calçado", nome: "Coturno (cano alto)", busca: "coturno tático" },
      { id: "botamedia", grupo: "Calçado", nome: "Bota tática cano médio", busca: "bota tática cano médio" },
      { id: "tenistatico", grupo: "Calçado", nome: "Tênis tático", busca: "tênis tático" },
      { id: "polaina", grupo: "Acessório", nome: "Polaina", busca: "polaina tática" }
    ]
  },
  {
    id: "costas",
    nome: "Costas",
    atributos: ["marca", "modelo", "capacidade"],
    itens: [
      { id: "hidratacao", grupo: "Mochila", nome: "Mochila de hidratação", busca: "mochila hidratação tática" },
      { id: "assalto", grupo: "Mochila", nome: "Mochila de assalto MOLLE", busca: "mochila assalto molle" },
      { id: "tresdias", grupo: "Mochila", nome: "Mochila tática 3 dias", busca: "mochila tática 3 dias" }
    ]
  },
  {
    id: "armaPrincipal",
    nome: "Arma principal",
    atributos: ["modelo", "marca", "comprimentoCano", "coronha", "redDot", "acog", "lpvo", "miraFerro", "handGuard", "handGrip", "pistolGrip", "hopup", "nuzzler", "bucking", "pistao"],
    itens: [
      { id: "m4", grupo: "Arma", nome: "Rifle AEG M4 / M16", busca: "rifle airsoft m4 aeg" },
      { id: "ak", grupo: "Arma", nome: "Rifle AEG AK-47 / AK-74", busca: "rifle airsoft ak47 aeg" },
      { id: "g36", grupo: "Arma", nome: "Rifle AEG G36", busca: "rifle airsoft g36" },
      { id: "mp5", grupo: "Arma", nome: "Submetralhadora MP5", busca: "airsoft mp5 aeg" },
      { id: "sniper", grupo: "Arma", nome: "Sniper bolt-action", busca: "sniper airsoft bolt action" },
      { id: "dmr", grupo: "Arma", nome: "DMR", busca: "dmr airsoft" },
      { id: "shotgun", grupo: "Arma", nome: "Shotgun", busca: "shotgun airsoft" },
      { id: "reddot", grupo: "Mira", nome: "Red dot", busca: "red dot airsoft" },
      { id: "acog", grupo: "Mira", nome: "ACOG", busca: "luneta acog airsoft" },
      { id: "lpvo", grupo: "Mira", nome: "LPVO (luneta 1-4x / 1-6x)", busca: "luneta lpvo 1-4x" },
      { id: "miraferro", grupo: "Mira", nome: "Mira de ferro rebatível", busca: "mira de ferro rebatível airsoft" },
      { id: "handguard", grupo: "Acessório", nome: "Handguard", busca: "handguard airsoft m4" },
      { id: "handgrip", grupo: "Acessório", nome: "Handgrip / empunhadura frontal", busca: "empunhadura frontal airsoft" },
      { id: "pistolgrip", grupo: "Acessório", nome: "Pistol grip", busca: "pistol grip airsoft m4" },
      { id: "coronha", grupo: "Acessório", nome: "Coronha", busca: "coronha airsoft m4" },
      { id: "bandoleira", grupo: "Acessório", nome: "Bandoleira", busca: "bandoleira tática 2 pontos" },
      { id: "magazine", grupo: "Acessório", nome: "Magazine extra", busca: "magazine airsoft m4 mid cap" },
      { id: "bateria", grupo: "Acessório", nome: "Bateria LiPo + carregador", busca: "bateria lipo airsoft 11.1v" },
      { id: "hopup", grupo: "Upgrade interno", nome: "Hop-up", busca: "hop up airsoft aeg" },
      { id: "bucking", grupo: "Upgrade interno", nome: "Bucking", busca: "bucking airsoft" },
      { id: "nub", grupo: "Upgrade interno", nome: "Nub / nozzle", busca: "nub hop up airsoft" },
      { id: "pistao", grupo: "Upgrade interno", nome: "Pistão", busca: "pistão airsoft aeg" }
    ]
  },
  {
    id: "armaSecundaria",
    nome: "Arma secundária",
    atributos: ["marca", "modelo", "cano", "boca", "redDot", "miraFerro", "magazine"],
    itens: [
      { id: "glock", grupo: "Arma", nome: "Pistola GBB Glock", busca: "pistola airsoft glock gbb" },
      { id: "m1911", grupo: "Arma", nome: "Pistola GBB 1911", busca: "pistola airsoft 1911 gbb" },
      { id: "m92", grupo: "Arma", nome: "Pistola GBB M9 / 92", busca: "pistola airsoft m92 gbb" },
      { id: "aep", grupo: "Arma", nome: "Pistola elétrica (AEP)", busca: "pistola airsoft elétrica aep" },
      { id: "reddotpistola", grupo: "Acessório", nome: "Red dot para pistola", busca: "red dot pistola airsoft" },
      { id: "lanternapistola", grupo: "Acessório", nome: "Lanterna para pistola", busca: "lanterna tática pistola trilho" },
      { id: "magpistola", grupo: "Acessório", nome: "Magazine extra de pistola", busca: "magazine pistola airsoft gbb" },
      { id: "gas", grupo: "Acessório", nome: "Green gas", busca: "green gas airsoft" }
    ]
  }
];
