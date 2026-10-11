/* EDITOR UNIVERSAL — COLÉGIO SANTA TERESINHA
   Mantém o painel atual e acrescenta edição direta, imagens locais,
   desfazer/refazer, cancelar, baixar HTML e salvamento no Supabase. */
(async function () {
  "use strict";
  if (window.__editorColegioIniciado) return;
  window.__editorColegioIniciado = true;

  const SUPABASE_URL = "https://qmqmnbdwrbilrzmqghfk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_zr1KBIxXRPeMZXiOF81Zaw_Jcj_IS0V";
  const PAGE_ID = location.pathname.endsWith("pagina.html")
    ? "pagina-" + (new URLSearchParams(location.search).get("secao") || "colegio")
    : "home";

  const $ = (s, root = document) => root.querySelector(s);
  const areas = () => ({ header: $("header.top"), main: $("main"), footer: $("footer") });
  let db = null, editando = false, selecionado = null, modoSelecao = "";
  let historico = [], indiceHistorico = -1, estadoSalvo = "";
  let timerHistorico = null, menuOriginal = [];

  function aviso(texto) {
    const el = $("#editorUniversalStatus");
    if (el) el.textContent = texto;
  }

  function botao(texto, acao) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = texto;
    b.addEventListener("click", acao);
    return b;
  }

  function campo(rotulo, tipo, valor = "") {
    const grupo = document.createElement("label");
    grupo.className = "editorGrupo";
    const titulo = document.createElement("span");
    titulo.textContent = rotulo;
    const entrada = document.createElement("input");
    entrada.type = tipo;
    entrada.value = valor;
    grupo.append(titulo, entrada);
    return { grupo, entrada };
  }

  async function prepararSupabase() {
    if (!window.supabase) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  function criarPainel() {
    if ($("#editorUniversal")) return;

    const estilo = document.createElement("style");
    estilo.textContent = `
      #editorUniversal{position:fixed;right:16px;bottom:16px;width:320px;max-width:calc(100vw - 32px);max-height:82vh;overflow:auto;z-index:999999;background:#fffaf0;color:#49301f;border:2px solid #c9a44c;border-radius:14px;box-shadow:0 5px 25px #0005;font:14px Arial,sans-serif}
      #editorUniversal *{box-sizing:border-box}
      #editorUniversal .editorTopo{padding:14px;background:#55351f;color:#f5d77e;font-weight:bold;font-size:16px;display:flex;justify-content:space-between;align-items:center;gap:8px}
      #editorUniversal .editorCorpo{padding:12px}
      #editorUniversal .editorAbas{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px}
      #editorUniversal button,#editorUniversal input,#editorUniversal select{font:inherit}
      #editorUniversal button{width:100%;padding:10px;margin:4px 0;border:1px solid #d7bd7a;border-radius:7px;background:#f5d77e;color:#382719;cursor:pointer}
      #editorUniversal button:hover{filter:brightness(.96)}
      #editorUniversal .editorAbaAtiva{background:#55351f;color:#fff5d7}
      #editorUniversal .editorGrupo{display:block;margin:12px 0}
      #editorUniversal .editorGrupo span{display:block;margin-bottom:5px;font-weight:bold}
      #editorUniversal input,#editorUniversal select{width:100%;min-width:0;padding:9px;border:1px solid #c9b68c;border-radius:6px;background:white}
      #editorUniversal input[type=color]{height:42px;padding:3px}
      #editorUniversal .editorSecao{border-top:1px solid #ddcba7;padding-top:10px;margin-top:10px}
      #editorUniversalStatus{line-height:1.5;margin-top:10px;overflow-wrap:anywhere}
      .editorSelecionado{outline:3px dashed #d5a62c!important;outline-offset:2px}
      #editorAbrir{position:fixed;right:16px;bottom:16px;z-index:999998;background:#55351f;color:#f5d77e;border:2px solid #c9a44c;border-radius:12px;padding:13px 17px;font-weight:bold;cursor:pointer}
      @media(max-width:480px){#editorUniversal{right:8px;bottom:8px;max-width:calc(100vw - 16px)}#editorAbrir{right:8px;bottom:8px}}
    `;
    document.head.appendChild(estilo);

    const abrir = document.createElement("button");
    abrir.id = "editorAbrir";
    abrir.type = "button";
    abrir.textContent = "⚙ Editar site";
    abrir.addEventListener("click", () => {
      const p = $("#editorUniversal");
      p.style.display = p.style.display === "block" ? "none" : "block";
      abrir.style.display = p.style.display === "block" ? "none" : "block";
    });
    document.body.appendChild(abrir);

    const painel = document.createElement("div");
    painel.id = "editorUniversal";
    painel.style.display = "none";
    painel.innerHTML = `
      <div class="editorTopo"><span>⚙ Editor do Colégio</span><button type="button" id="editorFechar" style="width:auto;margin:0;padding:5px 9px">✕</button></div>
      <div class="editorCorpo">
        <div class="editorAbas">
          <button data-aba="textos">✏️ Textos</button>
          <button data-aba="conteudo">➕ Conteúdo</button>
          <button data-aba="imagens">🖼️ Imagens</button>
          <button data-aba="aparencia">🎨 Aparência</button>
          <button data-aba="menu">🧭 Menu</button>
          <button data-aba="pagina">📄 Página</button>
        </div>
        <div id="editorFerramentas"></div>
        <div class="editorSecao">
          <button id="editorDesfazer">↶ Desfazer</button>
          <button id="editorRefazer">↷ Refazer</button>
          <button id="editorCancelar">✖ Cancelar alterações não salvas</button>
          <button id="editorSalvar">☁️ Salvar na nuvem</button>
          <button id="editorBaixar">📥 Baixar cópia HTML</button>
          <button id="editorConcluir">Concluir edição</button>
          <div id="editorUniversalStatus" role="status">Preparando editor…</div>
        </div>
      </div>`;

    document.body.appendChild(painel);

    $("#editorFechar").addEventListener("click", () => {
      painel.style.display = "none";
      abrir.style.display = "block";
    });

    painel.querySelectorAll("[data-aba]").forEach(b =>
      b.addEventListener("click", () => abrirAba(b.dataset.aba))
    );

    $("#editorDesfazer").addEventListener("click", desfazer);
    $("#editorRefazer").addEventListener("click", refazer);
    $("#editorCancelar").addEventListener("click", cancelar);
    $("#editorSalvar").addEventListener("click", salvar);
    $("#editorBaixar").addEventListener("click", baixarHTML);
    $("#editorConcluir").addEventListener("click", concluir);

    abrirAba("textos");
  }

  function capturarEstado() {
    const resultado = {};
    for (const [nome, el] of Object.entries(areas())) {
      if (el) resultado[nome] = { html: limparHTML(el), style: el.getAttribute("style") };
    }
    return JSON.stringify(resultado);
  }

  function aplicarEstado(serializado) {
    const dados = JSON.parse(serializado);
    for (const [nome, dado] of Object.entries(dados)) {
      const el = areas()[nome];
      if (!el) continue;
      el.innerHTML = dado.html;
      if (dado.style === null) el.removeAttribute("style");
      else if (typeof dado.style === "string") el.setAttribute("style", dado.style);
    }
    selecionado = null;
    limparSelecaoVisual();
  }

  function registrarHistorico() {
    clearTimeout(timerHistorico);
    const atual = capturarEstado();
    if (historico[indiceHistorico] === atual) return;
    historico = historico.slice(0, indiceHistorico + 1);
    historico.push(atual);
    if (historico.length > 80) historico.shift();
    indiceHistorico = historico.length - 1;
    atualizarBotoesHistorico();
  }

  function agendarHistorico() {
    clearTimeout(timerHistorico);
    timerHistorico = setTimeout(registrarHistorico, 250);
  }

  function atualizarBotoesHistorico() {
    const u = $("#editorDesfazer"), r = $("#editorRefazer");
    if (u) u.disabled = indiceHistorico <= 0;
    if (r) r.disabled = indiceHistorico >= historico.length - 1;
  }

  function desfazer() {
    clearTimeout(timerHistorico);
    if (indiceHistorico <= 0) return aviso("Não há mais alterações para desfazer.");
    indiceHistorico--;
    aplicarEstado(historico[indiceHistorico]);
    atualizarBotoesHistorico();
    aviso("Alteração desfeita. Ainda não foi publicada.");
  }

  function refazer() {
    clearTimeout(timerHistorico);
    if (indiceHistorico >= historico.length - 1) return aviso("Não há alterações para refazer.");
    indiceHistorico++;
    aplicarEstado(historico[indiceHistorico]);
    atualizarBotoesHistorico();
    aviso("Alteração refeita. Ainda não foi publicada.");
  }

  function cancelar() {
    if (!estadoSalvo) return aviso("Ainda não existe uma versão salva carregada.");
    if (!confirm("Descartar todas as alterações desde o último salvamento?")) return;
    aplicarEstado(estadoSalvo);
    historico = [estadoSalvo];
    indiceHistorico = 0;
    atualizarBotoesHistorico();
    aviso("Alterações não salvas canceladas.");
  }

  function limparHTML(elemento) {
    const copia = elemento.cloneNode(true);
    copia.querySelectorAll("#editorUniversal,#editorAbrir,.editorSelecionado").forEach(el => el.remove());
    copia.querySelectorAll("[contenteditable]").forEach(el => el.removeAttribute("contenteditable"));
    copia.querySelectorAll("[class]").forEach(el => {
      el.classList.remove("editorSelecionado");
      if (!el.className.trim()) el.removeAttribute("class");
    });
    return copia.innerHTML;
  }

  function escolherElemento(elemento) {
    if (!elemento || elemento.closest("#editorUniversal") || elemento.id === "editorAbrir") return;
    limparSelecaoVisual();
    selecionado = elemento;
    selecionado.classList.add("editorSelecionado");
    aviso("Elemento selecionado. Agora use a ferramenta desejada.");
  }

  function limparSelecaoVisual() {
    document.querySelectorAll(".editorSelecionado").forEach(el => el.classList.remove("editorSelecionado"));
  }

  function ativarSelecao(modo = "geral") {
    concluirSelecao();
    editando = true;
    modoSelecao = modo;
    document.addEventListener("click", selecionarClique, true);
    aviso("Clique no elemento que deseja selecionar na página.");
  }

  function selecionarClique(evento) {
    const elemento = evento.target;
    if (!editando || elemento.closest("#editorUniversal") || elemento.id === "editorAbrir") return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();
    escolherElemento(elemento);
    document.removeEventListener("click", selecionarClique, true);
    editando = false;

    if (modoSelecao === "texto") editarDireto();
    else if (modoSelecao === "imagem" && selecionado?.tagName !== "IMG") aviso("Área selecionada. Você pode aplicar uma imagem como fundo.");
    else if (modoSelecao === "imagem") aviso("Imagem selecionada. Escolha um arquivo e clique em Aplicar imagem.");
    else if (modoSelecao === "cor") aviso("Elemento selecionado. Escolha as cores na aba Aparência.");
    modoSelecao = "";
  }

  function concluirSelecao() {
    editando = false;
    modoSelecao = "";
    document.removeEventListener("click", selecionarClique, true);
    limparSelecaoVisual();
  }

  function concluir() {
    concluirSelecao();
    document.querySelectorAll("[contenteditable]").forEach(el => el.removeAttribute("contenteditable"));
    selecionado = null;
    aviso("Edição concluída. Clique em salvar na nuvem para publicar.");
  }

  function editarDireto() {
    if (!selecionado) return aviso("Primeiro selecione um elemento.");
    if (selecionado.matches("img,input,textarea,select,button,svg,video,iframe")) return aviso("Esse elemento não é um texto editável. Escolha um título, parágrafo ou texto.");
    selecionado.contentEditable = "true";
    selecionado.focus();
    aviso("Agora edite o texto diretamente na página. Clique em Concluir edição quando terminar.");
    selecionado.addEventListener("input", agendarHistorico);
  }
    function abrirAba(aba) {
    const ferramentas = $("#editorFerramentas");
    if (!ferramentas) return;
    ferramentas.innerHTML = "";

    document.querySelectorAll("#editorUniversal [data-aba]").forEach(b => {
      b.classList.toggle("editorAbaAtiva", b.dataset.aba === aba);
    });

    if (aba === "textos") {
      ferramentas.append(
        botao("✏️ Selecionar texto para editar diretamente", () => ativarSelecao("texto")),
        botao("🖱️ Selecionar elemento da página", () => ativarSelecao("geral")),
        botao("Concluir seleção", concluirSelecao)
      );
      const info = document.createElement("p");
      info.textContent = "Clique no botão e depois no texto da página para editá-lo diretamente.";
      ferramentas.append(info);
    }

    if (aba === "conteudo") {
      ferramentas.append(
        botao("➕ Adicionar título", () => adicionarConteudo("h2", "Novo título")),
        botao("➕ Adicionar parágrafo", () => adicionarConteudo("p", "Escreva seu texto aqui.")),
        botao("➕ Adicionar lista", () => adicionarLista()),
        botao("🗑️ Remover elemento selecionado", removerSelecionado)
      );
    }

    if (aba === "imagens") {
      const info = document.createElement("p");
      info.textContent = "Selecione uma imagem da página ou adicione uma nova do seu computador.";
      ferramentas.append(info);

      ferramentas.append(
        botao("🖼️ Selecionar imagem existente", () => ativarSelecao("imagem")),
        botao("📁 Escolher imagem do computador", escolherArquivoImagem),
        botao("Aplicar imagem escolhida", aplicarImagem),
        botao("➕ Adicionar nova imagem", adicionarImagem)
      );

      const largura = campo("Largura da imagem (ex.: 300px ou 100%)", "text", "100%");
      largura.entrada.id = "editorLarguraImagem";
      ferramentas.append(largura.grupo);

      const alt = campo("Descrição da imagem", "text", "");
      alt.entrada.id = "editorAltImagem";
      ferramentas.append(alt.grupo);
    }

    if (aba === "aparencia") {
      ferramentas.append(
        botao("🎨 Selecionar elemento para mudar aparência", () => ativarSelecao("cor"))
      );

      const fundo = campo("Cor de fundo", "color", "#ffffff");
      fundo.entrada.id = "editorCorFundo";
      ferramentas.append(fundo.grupo);

      const texto = campo("Cor do texto", "color", "#222222");
      texto.entrada.id = "editorCorTexto";
      ferramentas.append(texto.grupo);

      const tamanho = campo("Tamanho da letra (px)", "number", "18");
      tamanho.entrada.id = "editorTamanhoTexto";
      tamanho.entrada.min = "8";
      tamanho.entrada.max = "100";
      ferramentas.append(tamanho.grupo);

      const fonte = document.createElement("label");
      fonte.className = "editorGrupo";
      fonte.innerHTML = "<span>Fonte</span>";
      const selectFonte = document.createElement("select");
      selectFonte.id = "editorFonte";
      [
        ["Arial, sans-serif", "Arial"],
        ["Georgia, serif", "Georgia"],
        ["Verdana, sans-serif", "Verdana"],
        ["'Times New Roman', serif", "Times New Roman"],
        ["'Trebuchet MS', sans-serif", "Trebuchet MS"]
      ].forEach(([valor, nome]) => {
        const op = document.createElement("option");
        op.value = valor;
        op.textContent = nome;
        selectFonte.append(op);
      });
      fonte.append(selectFonte);
      ferramentas.append(fonte);

      ferramentas.append(
        botao("Aplicar aparência", aplicarAparencia),
        botao("Mudar cor do fundo da página", mudarFundoPagina)
      );
    }

    if (aba === "menu") {
      ferramentas.append(
        botao("🧭 Selecionar menu para editar", () => ativarSelecao("geral")),
        botao("➕ Adicionar link ao menu", adicionarLinkMenu),
        botao("🗑️ Remover link selecionado", removerSelecionado)
      );

      const texto = campo("Texto do novo link", "text", "Nova página");
      texto.entrada.id = "editorTextoLink";
      ferramentas.append(texto.grupo);

      const destino = campo("Destino do link (ex.: pagina.html?secao=contato)", "text", "pagina.html");
      destino.entrada.id = "editorDestinoLink";
      ferramentas.append(destino.grupo);

      const info = document.createElement("p");
      info.textContent = "Você também pode selecionar um link existente e alterar seu texto diretamente na página.";
      ferramentas.append(info);
    }

    if (aba === "pagina") {
      ferramentas.append(
        botao("📄 Selecionar conteúdo principal", () => ativarSelecao("geral")),
        botao("🗑️ Remover elemento selecionado", removerSelecionado),
        botao("↻ Recarregar a página", () => {
          if (confirm("Recarregar a página? Alterações não salvas podem ser perdidas.")) location.reload();
        })
      );

      const info = document.createElement("p");
      info.textContent = "Use Salvar na nuvem para publicar as alterações. O botão Baixar cópia HTML gera uma cópia local da página.";
      ferramentas.append(info);
    }
  }

  function adicionarConteudo(tipo, texto) {
    const principal = $("main");
    if (!principal) return aviso("Não encontrei a área principal da página.");

    const elemento = document.createElement(tipo);
    elemento.textContent = texto;
    elemento.contentEditable = "true";
    principal.append(elemento);
    escolherElemento(elemento);
    elemento.focus();
    registrarHistorico();
    aviso("Conteúdo adicionado. Edite o texto diretamente na página.");
  }

  function adicionarLista() {
    const principal = $("main");
    if (!principal) return aviso("Não encontrei a área principal da página.");

    const lista = document.createElement("ul");
    ["Primeiro item", "Segundo item", "Terceiro item"].forEach(texto => {
      const item = document.createElement("li");
      item.textContent = texto;
      lista.append(item);
    });
    lista.contentEditable = "true";
    principal.append(lista);
    escolherElemento(lista);
    registrarHistorico();
    aviso("Lista adicionada. Você pode editar os itens diretamente.");
  }

  function removerSelecionado() {
    if (!selecionado) return aviso("Primeiro selecione um elemento da página.");
    if (selecionado.matches("header, main, footer, body")) {
      return aviso("Por segurança, não é permitido remover toda uma área da página.");
    }
    if (!confirm("Tem certeza de que deseja remover o elemento selecionado?")) return;

    selecionado.remove();
    selecionado = null;
    registrarHistorico();
    aviso("Elemento removido. Salve na nuvem para publicar.");
  }

  let arquivoImagemEscolhido = null;

  function escolherArquivoImagem() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.addEventListener("change", () => {
      const arquivo = input.files && input.files[0];
      if (!arquivo) return;

      if (!arquivo.type.startsWith("image/")) {
        return aviso("Escolha um arquivo de imagem.");
      }

      if (arquivo.size > 1024 * 1024) {
        return aviso("A imagem deve ter menos de 1 MB.");
      }

      arquivoImagemEscolhido = arquivo;
      aviso("Imagem escolhida: " + arquivo.name + ". Agora clique em Aplicar imagem.");
    });

    input.click();
  }

  function aplicarImagem() {
    if (!arquivoImagemEscolhido) {
      return aviso("Primeiro clique em Escolher imagem do computador.");
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const dadosImagem = leitor.result;

      if (selecionado && selecionado.tagName === "IMG") {
        selecionado.src = dadosImagem;
        const alt = $("#editorAltImagem");
        if (alt && alt.value.trim()) selecionado.alt = alt.value.trim();

        const largura = $("#editorLarguraImagem");
        if (largura && largura.value.trim()) selecionado.style.width = largura.value.trim();

        registrarHistorico();
        aviso("Imagem alterada. Salve na nuvem para publicar.");
      } else {
        adicionarImagemComDados(dadosImagem, arquivoImagemEscolhido.name);
      }

      arquivoImagemEscolhido = null;
    };

    leitor.onerror = () => aviso("Não foi possível ler essa imagem.");
    leitor.readAsDataURL(arquivoImagemEscolhido);
  }

  function adicionarImagem() {
    escolherArquivoImagem();
    aviso("Escolha uma imagem no computador. Depois ela será adicionada à página.");
  }

  function adicionarImagemComDados(dadosImagem, nome) {
    const principal = $("main");
    if (!principal) return aviso("Não encontrei a área principal da página.");

    const img = document.createElement("img");
    img.src = dadosImagem;
    img.alt = nome || "Imagem do site";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.margin = "12px auto";

    principal.append(img);
    escolherElemento(img);
    registrarHistorico();
    aviso("Imagem adicionada. Salve na nuvem para publicar.");
  }

  function aplicarAparencia() {
    if (!selecionado) return aviso("Primeiro selecione um elemento na página.");

    const fundo = $("#editorCorFundo");
    const texto = $("#editorCorTexto");
    const tamanho = $("#editorTamanhoTexto");
    const fonte = $("#editorFonte");

    if (fundo && fundo.value) selecionado.style.backgroundColor = fundo.value;
    if (texto && texto.value) selecionado.style.color = texto.value;
    if (tamanho && tamanho.value) selecionado.style.fontSize = tamanho.value + "px";
    if (fonte && fonte.value) selecionado.style.fontFamily = fonte.value;

    registrarHistorico();
    aviso("Aparência aplicada. Salve na nuvem para publicar.");
  }

  function mudarFundoPagina() {
    const fundo = $("#editorCorFundo");
    if (!fundo) return;

    document.body.style.backgroundColor = fundo.value;
    registrarHistorico();
    aviso("Cor de fundo alterada. Salve na nuvem para publicar.");
  }

  function adicionarLinkMenu() {
    const menu = $("header nav") || $("nav");
    if (!menu) return aviso("Não encontrei o menu da página.");

    const texto = $("#editorTextoLink")?.value.trim() || "Nova página";
    const destino = $("#editorDestinoLink")?.value.trim() || "pagina.html";

    const link = document.createElement("a");
    link.href = destino;
    link.textContent = texto;
    link.style.margin = "4px";
    menu.append(link);

    escolherElemento(link);
    registrarHistorico();
    aviso("Link adicionado. Salve na nuvem para publicar.");
  }
    async function carregar() {
    try {
      await prepararSupabase();

      const { data, error } = await db
        .from("site_edits")
        .select("content")
        .eq("id", PAGE_ID)
        .maybeSingle();

      if (error) throw error;

      if (data && data.content) {
        const conteudo = data.content;

        // Compatibilidade com versões anteriores do editor.
        const pares = [
          ["header", conteudo.headerHtml ?? conteudo.header?.html],
          ["main", conteudo.mainHtml ?? conteudo.main?.html],
          ["footer", conteudo.footerHtml ?? conteudo.footer?.html]
        ];

        for (const [nome, html] of pares) {
          const elemento = areas()[nome];
          if (elemento && typeof html === "string") {
            elemento.innerHTML = html;
          }
        }

        const estilos = [
          ["header", conteudo.headerStyle ?? conteudo.header?.style],
          ["main", conteudo.mainStyle ?? conteudo.main?.style],
          ["footer", conteudo.footerStyle ?? conteudo.footer?.style]
        ];

        for (const [nome, estilo] of estilos) {
          const elemento = areas()[nome];
          if (!elemento) continue;

          if (typeof estilo === "string" && estilo) {
            elemento.setAttribute("style", estilo);
          }
        }
      }

      estadoSalvo = capturarEstado();
      historico = [estadoSalvo];
      indiceHistorico = 0;
      atualizarBotoesHistorico();
      aviso("Editor pronto. As alterações podem ser salvas na nuvem.");
    } catch (erro) {
      console.error("Erro ao carregar o editor:", erro);
      estadoSalvo = capturarEstado();
      historico = [estadoSalvo];
      indiceHistorico = 0;
      atualizarBotoesHistorico();
      aviso("Editor aberto, mas não foi possível carregar a nuvem. Verifique a conexão e as permissões do Supabase.");
    }
  }

  async function salvar() {
    try {
      if (!db) await prepararSupabase();

      const dados = {};

      for (const [nome, elemento] of Object.entries(areas())) {
        if (!elemento) continue;
        dados[nome + "Html"] = limparHTML(elemento);
        dados[nome + "Style"] = elemento.getAttribute("style");
      }

      const { error } = await db
        .from("site_edits")
        .upsert({
          id: PAGE_ID,
          content: dados,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });

      if (error) throw error;

      estadoSalvo = capturarEstado();
      historico = [estadoSalvo];
      indiceHistorico = 0;
      atualizarBotoesHistorico();

      aviso("Alterações salvas na nuvem! Recarregue a página para conferir.");
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      aviso("Não foi possível salvar. Verifique as permissões de leitura e gravação da tabela site_edits no Supabase.");
    }
  }

  function baixarHTML() {
    try {
      const copia = document.documentElement.cloneNode(true);

      copia.querySelectorAll("#editorUniversal, #editorAbrir").forEach(el => el.remove());

      copia.querySelectorAll("[contenteditable]").forEach(el => {
        el.removeAttribute("contenteditable");
      });

      copia.querySelectorAll(".editorSelecionado").forEach(el => {
        el.classList.remove("editorSelecionado");
      });

      const html = "<!doctype html>\n" + copia.outerHTML;
      const arquivo = new Blob([html], { type: "text/html;charset=utf-8" });
      const endereco = URL.createObjectURL(arquivo);
      const link = document.createElement("a");

      link.href = endereco;
      link.download = PAGE_ID === "home" ? "index.html" : "pagina.html";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(endereco), 1000);
      aviso("Download da cópia HTML iniciado.");
    } catch (erro) {
      console.error("Erro ao baixar HTML:", erro);
      aviso("Não foi possível gerar o arquivo HTML.");
    }
  }

  // Registra alterações feitas diretamente nos textos da página.
  document.addEventListener("input", evento => {
    if (
      evento.target.isContentEditable &&
      !evento.target.closest("#editorUniversal")
    ) {
      agendarHistorico();
    }
  });

  // Inicia o painel e carrega os dados salvos.
  criarPainel();
  await carregar();
})();
