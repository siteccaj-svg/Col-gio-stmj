```javascript
/* EDITOR UNIVERSAL — COLÉGIO SANTA TERESINHA */
(async function () {
  "use strict";

  if (window.__editorColegioIniciado) return;
  window.__editorColegioIniciado = true;

  const SUPABASE_URL = "https://qmqmnbdwrbilrzmqghfk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_zr1KBIxXRPeMZXiOF81Zaw_Jcj_IS0V";

  const PARAMETROS = new URLSearchParams(location.search);
  const EH_SUBPAGINA = location.pathname.endsWith("pagina.html");
  const PAGE_ID = EH_SUBPAGINA
    ? "pagina-" + (PARAMETROS.get("secao") || "colegio")
    : "home";

  const SHARED_ID = "site-compartilhado";

  const $ = (s, raiz = document) => raiz.querySelector(s);

  const areas = () => ({
    header: $("header.top"),
    main: $("main"),
    footer: $("footer")
  });

  let db = null;
  let selecionado = null;
  let modoSelecao = "";
  let aguardandoSelecao = false;
  let historico = [];
  let indiceHistorico = -1;
  let estadoSalvo = "";
  let timerHistorico = null;
  let arquivoImagem = null;
  let carregando = false;

  function aviso(mensagem) {
    const el = $("#editorUniversalStatus");
    if (el) el.textContent = mensagem;
  }

  function botao(texto, acao) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = texto;
    b.addEventListener("click", acao);
    return b;
  }

  function campo(rotulo, tipo, valor = "") {
    const label = document.createElement("label");
    label.className = "editorGrupo";

    const span = document.createElement("span");
    span.textContent = rotulo;

    const input = document.createElement("input");
    input.type = tipo;
    input.value = valor;

    label.append(span, input);
    return { grupo: label, entrada: input };
  }

  async function prepararSupabase() {
    if (!window.supabase) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    if (!db) {
      db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
    }
  }

  function criarEstilos() {
    if ($("#editorEstilosUniversais")) return;

    const style = document.createElement("style");
    style.id = "editorEstilosUniversais";

    style.textContent = `
      #editorUniversal {
        position:fixed;
        z-index:999999;
        right:12px;
        bottom:12px;
        width:320px;
        max-width:calc(100vw - 24px);
        max-height:82vh;
        overflow:auto;
        background:#fffaf0;
        color:#49301f;
        border:2px solid #c9a44c;
        border-radius:12px;
        box-shadow:0 5px 25px #0004;
        font:14px Arial,sans-serif;
      }

      #editorUniversal * { box-sizing:border-box; }

      #editorUniversal .editorTopo {
        position:sticky;
        top:0;
        z-index:2;
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
        padding:12px;
        background:#55351f;
        color:#f5d77e;
        font-weight:bold;
      }

      #editorUniversal .editorCorpo { padding:10px; }

      #editorUniversal .editorAbas {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:5px;
        margin-bottom:10px;
      }

      #editorUniversal button,
      #editorUniversal input,
      #editorUniversal select {
        font:inherit;
        max-width:100%;
      }

      #editorUniversal button {
        width:100%;
        padding:9px;
        margin:3px 0;
        border:1px solid #d7bd7a;
        border-radius:6px;
        background:#f5d77e;
        color:#382719;
        cursor:pointer;
        overflow-wrap:anywhere;
      }

      #editorUniversal button:disabled {
        opacity:.45;
        cursor:not-allowed;
      }

      #editorUniversal button.editorAbaAtiva {
        background:#55351f;
        color:#fff5d7;
      }

      #editorUniversal .editorGrupo {
        display:block;
        margin:10px 0;
      }

      #editorUniversal .editorGrupo span {
        display:block;
        margin-bottom:4px;
        font-weight:bold;
      }

      #editorUniversal input,
      #editorUniversal select {
        width:100%;
        min-width:0;
        padding:8px;
        border:1px solid #c9b68c;
        border-radius:5px;
        background:white;
        color:#222;
      }

      #editorUniversal input[type=color] {
        height:40px;
        padding:3px;
      }

      #editorUniversal .editorSecao {
        border-top:1px solid #ddcba7;
        padding-top:8px;
        margin-top:10px;
      }

      #editorUniversalStatus {
        margin-top:8px;
        line-height:1.5;
        overflow-wrap:anywhere;
      }

      #editorAbrir {
        position:fixed;
        z-index:999998;
        right:12px;
        bottom:12px;
        width:auto;
        padding:12px 16px;
        background:#55351f;
        color:#f5d77e;
        border:2px solid #c9a44c;
        border-radius:10px;
        font-weight:bold;
        cursor:pointer;
      }

      .editorSelecionado {
        outline:3px dashed #d5a62c !important;
        outline-offset:2px;
      }

      @media(max-width:480px) {
        #editorUniversal {
          right:6px;
          bottom:6px;
          max-width:calc(100vw - 12px);
          max-height:78vh;
        }

        #editorAbrir {
          right:6px;
          bottom:6px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function criarPainel() {
    // Evita menus duplicados.
    $("#editorUniversal")?.remove();
    $("#editorAbrir")?.remove();

    criarEstilos();

    const abrir = document.createElement("button");
    abrir.id = "editorAbrir";
    abrir.type = "button";
    abrir.textContent = "⚙ Editar site";

    const painel = document.createElement("aside");
    painel.id = "editorUniversal";
    painel.style.display = "none";

    painel.innerHTML = `
      <div class="editorTopo">
        <span>⚙ Editor do Colégio</span>
        <button id="editorFechar"
          type="button"
          style="width:auto;margin:0;padding:5px 9px">
          ✕
        </button>
      </div>

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
          <button id="editorCancelar">
            ✖ Cancelar alterações não salvas
          </button>
          <button id="editorSalvar">☁️ Salvar na nuvem</button>
          <button id="editorBaixar">📥 Baixar cópia HTML</button>
          <button id="editorConcluir">Concluir edição</button>
          <div id="editorUniversalStatus" role="status">
            Preparando editor...
          </div>
        </div>
      </div>
    `;

    document.body.append(abrir, painel);

    abrir.addEventListener("click", () => {
      painel.style.display = "block";
      abrir.style.display = "none";
    });

    $("#editorFechar").addEventListener("click", () => {
      painel.style.display = "none";
      abrir.style.display = "block";
      concluirSelecao();
    });

    painel.querySelectorAll("[data-aba]").forEach(b => {
      b.addEventListener("click", () => abrirAba(b.dataset.aba));
    });

    $("#editorDesfazer").addEventListener("click", desfazer);
    $("#editorRefazer").addEventListener("click", refazer);
    $("#editorCancelar").addEventListener("click", cancelar);
    $("#editorSalvar").addEventListener("click", salvar);
    $("#editorBaixar").addEventListener("click", baixarHTML);
    $("#editorConcluir").addEventListener("click", concluir);

    abrirAba("textos");
  }

  function limparHTML(elemento) {
    const copia = elemento.cloneNode(true);

    copia.querySelectorAll(
      "#editorUniversal,#editorAbrir,#editorPainel," +
      "#editorAcoesNuvem,#editorUniversalStatus"
    ).forEach(el => el.remove());

    copia.querySelectorAll(".editorSelecionado").forEach(el => {
      el.classList.remove("editorSelecionado");
    });

    copia.querySelectorAll("[contenteditable]").forEach(el => {
      el.removeAttribute("contenteditable");
    });

    return copia.innerHTML;
  }

  function capturarEstado() {
    const resultado = {};

    for (const [nome, el] of Object.entries(areas())) {
      if (!el) continue;

      resultado[nome] = {
        html: limparHTML(el),
        style: el.getAttribute("style")
      };
    }

    return JSON.stringify(resultado);
  }

  function aplicarEstado(serializado) {
    const dados = JSON.parse(serializado);

    for (const [nome, dado] of Object.entries(dados)) {
      const el = areas()[nome];
      if (!el) continue;

      el.innerHTML = dado.html;

      if (dado.style === null) {
        el.removeAttribute("style");
      } else if (typeof dado.style === "string") {
        el.setAttribute("style", dado.style);
      }
    }

    selecionado = null;
    limparSelecaoVisual();
  }

  function registrarHistorico() {
    if (carregando) return;

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
    timerHistorico = setTimeout(registrarHistorico, 300);
  }

  function atualizarBotoesHistorico() {
    const d = $("#editorDesfazer");
    const r = $("#editorRefazer");

    if (d) d.disabled = indiceHistorico <= 0;
    if (r) r.disabled = indiceHistorico >= historico.length - 1;
  }

  function desfazer() {
    clearTimeout(timerHistorico);

    if (indiceHistorico <= 0) {
      aviso("Não há mais alterações para desfazer.");
      return;
    }

    indiceHistorico--;
    aplicarEstado(historico[indiceHistorico]);
    atualizarBotoesHistorico();
    aviso("Alteração desfeita. Ainda não foi publicada.");
  }

  function refazer() {
    clearTimeout(timerHistorico);

    if (indiceHistorico >= historico.length - 1) {
      aviso("Não há alterações para refazer.");
      return;
    }

    indiceHistorico++;
    aplicarEstado(historico[indiceHistorico]);
    atualizarBotoesHistorico();
    aviso("Alteração refeita. Ainda não foi publicada.");
  }

  function cancelar() {
    if (!estadoSalvo) {
      aviso("Ainda não existe uma versão salva carregada.");
      return;
    }

    if (!confirm("Descartar as alterações que ainda não foram salvas?")) {
      return;
    }

    aplicarEstado(estadoSalvo);
    historico = [estadoSalvo];
    indiceHistorico = 0;
    atualizarBotoesHistorico();

    aviso("Alterações não salvas canceladas.");
  }

  function limparSelecaoVisual() {
    document.querySelectorAll(".editorSelecionado").forEach(el => {
      el.classList.remove("editorSelecionado");
    });
  }

  function escolherElemento(el) {
    if (!el || el.closest("#editorUniversal,#editorAbrir")) return;

    limparSelecaoVisual();
    selecionado = el;
    selecionado.classList.add("editorSelecionado");

    const texto = (el.innerText || el.alt || "")
      .trim().replace(/\s+/g, " ").slice(0, 40);

    aviso(
      "Selecionado: <" + el.tagName.toLowerCase() + ">" +
      (texto ? " — " + texto : "")
    );
  }

  function ativarSelecao(modo = "geral") {
    concluirSelecao();

    aguardandoSelecao = true;
    modoSelecao = modo;

    document.addEventListener("click", selecionarClique, true);
    aviso("Clique no elemento que deseja selecionar na página.");
  }

  function selecionarClique(evento) {
    if (!aguardandoSelecao) return;

    const alvo = evento.target;

    if (alvo.closest("#editorUniversal,#editorAbrir")) return;

    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();

    let el = alvo;

    if (modoSelecao === "texto") {
      el = alvo.closest("h1,h2,h3,h4,h5,p,li,a,span") || alvo;
    } else if (modoSelecao === "imagem") {
      el = alvo.closest("img") || alvo;
    } else if (modoSelecao === "cor") {
      el = alvo.closest(
        "h1,h2,h3,h4,p,li,a,button,section,article,div,nav,header,footer"
      ) || alvo;
    }

    concluirSelecao();
    escolherElemento(el);

    if (modoSelecao === "texto") {
      editarDireto();
    } else if (modoSelecao === "imagem") {
      aviso(el.tagName === "IMG"
        ? "Imagem selecionada. Escolha um arquivo e clique em Aplicar imagem."
        : "Não foi selecionada uma imagem. Tente clicar diretamente nela.");
    } else if (modoSelecao === "cor") {
      preencherAparencia();
      aviso("Elemento selecionado. Ajuste as opções de aparência.");
    }

    modoSelecao = "";
  }

  function concluirSelecao() {
    aguardandoSelecao = false;
    document.removeEventListener("click", selecionarClique, true);
  }

  function concluir() {
    concluirSelecao();

    document.querySelectorAll("[contenteditable]").forEach(el => {
      el.removeAttribute("contenteditable");
    });

    limparSelecaoVisual();
    selecionado = null;

    registrarHistorico();
    aviso("Edição concluída. Clique em Salvar na nuvem para publicar.");
  }

  function editarDireto() {
    if (!selecionado) {
      aviso("Primeiro selecione um elemento.");
      return;
    }

    if (selecionado.matches(
      "img,input,textarea,select,button,svg,video,iframe"
    )) {
      aviso("Escolha um título ou parágrafo para editar o texto.");
      return;
    }

    selecionado.contentEditable = "true";
    selecionado.focus();

    aviso("Edite o texto diretamente na página e depois clique em Concluir edição.");
  }

  function adicionarConteudo(tipo, texto) {
    const principal = $("main");
    if (!principal) return aviso("Não encontrei a área principal.");

    const el = document.createElement(tipo);
    el.textContent = texto;
    principal.appendChild(el);

    escolherElemento(el);
    el.contentEditable = "true";
    el.focus();

    registrarHistorico();
    aviso("Conteúdo adicionado. Edite o texto diretamente.");
  }

  function adicionarLista() {
    const principal = $("main");
    if (!principal) return aviso("Não encontrei a área principal.");

    const lista = document.createElement("ul");

    ["Primeiro item", "Segundo item", "Terceiro item"].forEach(t => {
      const li = document.createElement("li");
      li.textContent = t;
      lista.appendChild(li);
    });

    principal.appendChild(lista);
    escolherElemento(lista);
    lista.contentEditable = "true";

    registrarHistorico();
    aviso("Lista adicionada. Edite os itens diretamente.");
  }

  function removerSelecionado() {
    if (!selecionado || !document.body.contains(selecionado)) {
      aviso("Primeiro selecione um elemento da página.");
      return;
    }

    if (selecionado.matches("header,main,footer,body")) {
      aviso("Por segurança, não é permitido remover uma área inteira.");
      return;
    }

    if (!confirm("Tem certeza de que deseja remover este elemento?")) {
      return;
    }

    selecionado.remove();
    selecionado = null;

    registrarHistorico();
    aviso("Elemento removido. Salve na nuvem para publicar.");
  }

  function escolherArquivoImagem() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.addEventListener("change", () => {
      const arquivo = input.files?.[0];
      if (!arquivo) return;

      if (!arquivo.type.startsWith("image/")) {
        aviso("Escolha um arquivo de imagem válido.");
        return;
      }

      if (arquivo.size > 1024 * 1024) {
        aviso("A imagem deve ter menos de 1 MB.");
        return;
      }

      arquivoImagem = arquivo;
      aviso("Imagem escolhida: " + arquivo.name + ". Clique em Aplicar imagem.");
    });

    input.click();
  }

  function aplicarImagem() {
    if (!arquivoImagem) {
      aviso("Primeiro escolha uma imagem do computador.");
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const src = leitor.result;

      if (selecionado?.tagName === "IMG") {
        selecionado.src = src;

        const alt = $("#editorAltImagem");
        const largura = $("#editorLarguraImagem");

        if (alt?.value.trim()) selecionado.alt = alt.value.trim();
        if (largura?.value.trim()) selecionado.style.width = largura.value.trim();
      } else {
        const principal = $("main");

        if (!principal) {
          aviso("Não encontrei a área principal.");
          return;
        }

        const img = document.createElement("img");
        img.src = src;
        img.alt = $("#editorAltImagem")?.value.trim() || arquivoImagem.name;
        img.style.maxWidth = "100%";
        img.style.height = "auto";

        const largura = $("#editorLarguraImagem");
        if (largura?.value.trim()) img.style.width = largura.value.trim();

        principal.appendChild(img);
        escolherElemento(img);
      }

      arquivoImagem = null;
      registrarHistorico();
      aviso("Imagem alterada. Salve na nuvem para publicar.");
    };

    leitor.onerror = () => aviso("Não foi possível ler a imagem.");
    leitor.readAsDataURL(arquivoImagem);
  }

  function preencherAparencia() {
    if (!selecionado) return;

    const estilo = getComputedStyle(selecionado);
    const fundo = $("#editorCorFundo");
    const texto = $("#editorCorTexto");
    const tamanho = $("#editorTamanhoTexto");
    const fonte = $("#editorFonte");

    if (fundo) fundo.value = corHex(estilo.backgroundColor) || "#ffffff";
    if (texto) texto.value = corHex(estilo.color) || "#222222";
    if (tamanho) tamanho.value = parseInt(estilo.fontSize, 10) || 18;
    if (fonte) fonte.value = estilo.fontFamily;
  }

  function corHex(cor) {
    const m = cor.match(/\d+/g);
    if (!m || m.length < 3) return null;

    return "#" + m.slice(0, 3)
      .map(n => Number(n).toString(16).padStart(2, "0"))
      .join("");
  }

  function aplicarAparencia() {
    if (!selecionado) {
      aviso("Primeiro selecione um elemento.");
      return;
    }

    const fundo = $("#editorCorFundo");
    const texto = $("#editorCorTexto");
    const tamanho = $("#editorTamanhoTexto");
    const fonte = $("#editorFonte");

    if (fundo) selecionado.style.backgroundColor = fundo.value;
    if (texto) selecionado.style.color = texto.value;

    if (tamanho?.value) {
      selecionado.style.fontSize =
        Math.max(8, Math.min(100, Number(tamanho.value))) + "px";
    }

    if (fonte) selecionado.style.fontFamily = fonte.value;

    registrarHistorico();
    aviso("Aparência alterada. Salve na nuvem para publicar.");
  }

  function ajustarTexto(delta) {
    if (!selecionado || !document.body.contains(selecionado)) {
      aviso("Selecione um elemento primeiro.");
      return;
    }

    const atual = parseFloat(getComputedStyle(selecionado).fontSize) || 18;
    const novo = Math.max(8, Math.min(100, atual + delta));

    selecionado.style.fontSize = novo + "px";

    const campoTamanho = $("#editorTamanhoTexto");
    if (campoTamanho) campoTamanho.value = String(novo);

    registrarHistorico();
    aviso("Tamanho do texto: " + novo + " px.");
  }

  function mudarFundoPagina() {
    const cor = $("#editorCorFundo");
    if (!cor) return;

    document.body.style.backgroundColor = cor.value;
    registrarHistorico();

    aviso("Fundo alterado. Salve na nuvem para publicar.");
  }

  function adicionarLinkMenu() {
    const texto = $("#editorTextoLink")?.value.trim();
    const destino = $("#editorDestinoLink")?.value.trim();

    if (!texto || !destino) {
      aviso("Preencha o texto e o destino do link.");
      return;
    }

    const menu =
      document.querySelector("header nav ul") ||
      document.querySelector("nav ul") ||
      document.querySelector("header nav") ||
      document.querySelector("nav");

    if (!menu) {
      aviso("Não encontrei o menu da página.");
      return;
    }

    const link = document.createElement("a");
    link.href = destino;
    link.textContent = texto;

    if (menu.tagName === "UL") {
      const li = document.createElement("li");
      li.appendChild(link);
      menu.appendChild(li);
    } else {
      menu.appendChild(link);
    }

    registrarHistorico();
    aviso("Link adicionado. Salve na nuvem para publicar.");
  }

  function abrirAba(aba) {
    const ferramentas = $("#editorFerramentas");
    if (!ferramentas) return;

    ferramentas.replaceChildren();

    document.querySelectorAll("#editorUniversal [data-aba]").forEach(b => {
      b.classList.toggle("editorAbaAtiva", b.dataset.aba === aba);
    });

    if (aba === "textos") {
      ferramentas.append(
        botao("✏️ Selecionar texto para editar", () => ativarSelecao("texto")),
        botao("Concluir seleção", concluirSelecao)
      );

      const info = document.createElement("p");
      info.textContent = "Clique no botão e depois no texto da página.";
      ferramentas.appendChild(info);
    }

    if (aba === "conteudo") {
      ferramentas.append(
        botao("🎯 Selecionar elemento", () => ativarSelecao("geral")),
        botao("➕ Adicionar título", () => adicionarConteudo("h2", "Novo título")),
        botao("➕ Adicionar parágrafo", () => adicionarConteudo("p", "Escreva seu texto aqui.")),
        botao("➕ Adicionar lista", adicionarLista),
        botao("🗑️ Remover elemento selecionado", removerSelecionado)
      );
    }

    if (aba === "imagens") {
      ferramentas.append(
        botao("🖼️ Selecionar imagem existente", () => ativarSelecao("imagem")),
        botao("📁 Escolher imagem do computador", escolherArquivoImagem),
        botao("Aplicar imagem escolhida", aplicarImagem)
      );

      const largura = campo("Largura (ex.: 300px ou 100%)", "text", "100%");
      largura.entrada.id = "editorLarguraImagem";
      ferramentas.appendChild(largura.grupo);

      const alt = campo("Descrição da imagem", "text", "");
      alt.entrada.id = "editorAltImagem";
      ferramentas.appendChild(alt.grupo);

      ferramentas.append(
        botao("➕ Adicionar nova imagem", escolherArquivoImagem)
      );
    }

    if (aba === "aparencia") {
      ferramentas.append(
        botao("🎨 Selecionar elemento", () => ativarSelecao("cor"))
      );

      const fundo = campo("Cor de fundo", "color", "#ffffff");
      fundo.entrada.id = "editorCorFundo";
      ferramentas.appendChild(fundo.grupo);

      const texto = campo("Cor do texto", "color", "#222222");
      texto.entrada.id = "editorCorTexto";
      ferramentas.appendChild(texto.grupo);

      const tamanho = campo("Tamanho da letra (px)", "number", "18");
      tamanho.entrada.id = "editorTamanhoTexto";
      tamanho.entrada.min = "8";
      tamanho.entrada.max = "100";
      ferramentas.appendChild(tamanho.grupo);

      const labelFonte = document.createElement("label");
      labelFonte.className = "editorGrupo";
      labelFonte.innerHTML = "<span>Fonte</span>";

      const fonte = document.createElement("select");
      fonte.id = "editorFonte";

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
        fonte.appendChild(op);
      });

      labelFonte.appendChild(fonte);
      ferramentas.appendChild(labelFonte);

      ferramentas.append(
        botao("Aplicar aparência", aplicarAparencia),
        botao("A− Diminuir texto", () => ajustarTexto(-2)),
        botao("A+ Aumentar texto", () => ajustarTexto(2)),
        botao("Mudar fundo da página", mudarFundoPagina)
      );
    }

    if (aba === "menu") {
      ferramentas.append(
        botao("🧭 Selecionar elemento do menu", () => ativarSelecao("geral")),
        botao("➕ Adicionar link ao menu", adicionarLinkMenu),
        botao("🗑️ Remover elemento selecionado", removerSelecionado)
      );

      const texto = campo("Texto do novo link", "text", "Nova página");
      texto.entrada.id = "editorTextoLink";
      ferramentas.appendChild(texto.grupo);

      const destino = campo("Destino do link", "text", "pagina.html");
      destino.entrada.id = "editorDestinoLink";
      ferramentas.appendChild(destino.grupo);
    }

    if (aba === "pagina") {
      const info = document.createElement("p");
      info.textContent =
        "O conteúdo principal de cada página é salvo separadamente. " +
        "O cabeçalho e o rodapé são compartilhados entre as páginas.";

      ferramentas.append(
        botao("🗑️ Remover elemento selecionado", removerSelecionado),
        botao("↻ Recarregar página", () => {
          if (confirm("Recarregar? As alterações não salvas serão perdidas.")) {
            location.reload();
          }
        })
      );

      ferramentas.appendChild(info);
    }
  }

  async function buscarRegistro(id) {
    const { data, error } = await db
      .from("site_edits")
      .select("content")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data?.content || null;
  }

  async function carregar() {
    carregando = true;

    try {
      await prepararSupabase();

      // O cabeçalho e o rodapé ficam num registro compartilhado.
      const compartilhado = await buscarRegistro(SHARED_ID);

      if (compartilhado) {
        const a = areas();

        if (a.header && typeof compartilhado.headerHtml === "string") {
          a.header.innerHTML = compartilhado.headerHtml;
        }

        if (a.footer && typeof compartilhado.footerHtml === "string") {
          a.footer.innerHTML = compartilhado.footerHtml;
        }

        if (a.header && typeof compartilhado.headerStyle === "string") {
          a.header.setAttribute("style", compartilhado.headerStyle);
        }

        if (a.footer && typeof compartilhado.footerStyle === "string") {
          a.footer.setAttribute("style", compartilhado.footerStyle);
        }
      }

      // O conteúdo principal continua separado por página.
      const conteudo = await buscarRegistro(PAGE_ID);
      const a = areas();

      if (conteudo) {
        const html = conteudo.mainHtml ?? conteudo.main?.html;
        const estilo = conteudo.mainStyle ?? conteudo.main?.style;

        if (a.main && typeof html === "string") {
          a.main.innerHTML = html;
        }

        if (a.main && typeof estilo === "string") {
          a.main.setAttribute("style", estilo);
        }

        // Compatibilidade com os registros antigos.
        if (!compartilhado) {
          if (a.header && typeof conteudo.headerHtml === "string") {
            a.header.innerHTML = conteudo.headerHtml;
          }

          if (a.footer && typeof conteudo.footerHtml === "string") {
            a.footer.innerHTML = conteudo.footerHtml;
          }
        }
      }

      estadoSalvo = capturarEstado();
      historico = [estadoSalvo];
      indiceHistorico = 0;
      atualizarBotoesHistorico();

      aviso("Editor pronto. Alterações carregadas da nuvem, quando disponíveis.");
    } catch (erro) {
      console.error("Erro ao carregar o Supabase:", erro);

      estadoSalvo = capturarEstado();
      historico = [estadoSalvo];
      indiceHistorico = 0;
      atualizarBotoesHistorico();

      aviso("Não foi possível carregar a nuvem. Confira as permissões da tabela site_edits.");
    } finally {
      carregando = false;
    }
  }

  async function salvar() {
    try {
      clearTimeout(timerHistorico);
      registrarHistorico();

      await prepararSupabase();
      limparSelecaoVisual();

      const a = areas();

      // Salva cabeçalho e rodapé no registro compartilhado.
      const compartilhado = {};

      if (a.header) {
        compartilhado.headerHtml = limparHTML(a.header);
        compartilhado.headerStyle = a.header.getAttribute("style");
      }

      if (a.footer) {
        compartilhado.footerHtml = limparHTML(a.footer);
        compartilhado.footerStyle = a.footer.getAttribute("style");
      }

      const { error: erroCompartilhado } = await db
        .from("site_edits")
        .upsert(
          {
            id: SHARED_ID,
            content: compartilhado,
            updated_at: new Date().toISOString()
          },
          { onConflict: "id" }
        );

      if (erroCompartilhado) throw erroCompartilhado;

      // Salva o conteúdo principal somente na página atual.
      const especifico = {};

      if (a.main) {
        especifico.mainHtml = limparHTML(a.main);
        especifico.mainStyle = a.main.getAttribute("style");
      }

      const { error: erroPagina } = await db
        .from("site_edits")
        .upsert(
          {
            id: PAGE_ID,
            content: especifico,
            updated_at: new Date().toISOString()
          },
          { onConflict: "id" }
        );

      if (erroPagina) throw erroPagina;

      estadoSalvo = capturarEstado();
      historico = [estadoSalvo];
      indiceHistorico = 0;
      atualizarBotoesHistorico();

      aviso("Alterações salvas na nuvem! Atualize a página para conferir.");
    } catch (erro) {
      console.error("Erro ao salvar na nuvem:", erro);

      aviso(
        "Falha ao salvar na nuvem. Confira as permissões de leitura e gravação da tabela site_edits no Supabase."
      );
    }
  }

  function baixarHTML() {
    try {
      const copia = document.documentElement.cloneNode(true);

      copia.querySelectorAll(
        "#editorUniversal,#editorAbrir,#editorPainel,#editorAcoesNuvem"
      ).forEach(el => el.remove());

      copia.querySelectorAll("[contenteditable]").forEach(el => {
        el.removeAttribute("contenteditable");
      });

      copia.querySelectorAll(".editorSelecionado").forEach(el => {
        el.classList.remove("editorSelecionado");
      });

      const arquivo = new Blob(
        ["<!doctype html>\n" + copia.outerHTML],
        { type: "text/html;charset=utf-8" }
      );

      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");

      link.href = url;
      link.download = PAGE_ID === "home" ? "index.html" : "pagina.html";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
      aviso("Download da cópia HTML iniciado.");
    } catch (erro) {
      console.error(erro);
      aviso("Não foi possível gerar a cópia HTML.");
    }
  }

  // Registra alterações feitas diretamente nos textos.
  document.addEventListener("input", evento => {
    if (
      evento.target.isContentEditable &&
      !evento.target.closest("#editorUniversal")
    ) {
      agendarHistorico();
    }
  });

  criarPainel();
  await carregar();
})();
```
