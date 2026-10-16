/* EDITOR UNIVERSAL — COLÉGIO SANTA TERESINHA
   Integra o menu antigo com as funções do editor novo.
   Prioriza o menu antigo quando ele já existe na página.
*/
(async function () {
  "use strict";

  if (window.__editorColegioIniciado) return;
  window.__editorColegioIniciado = true;

  const SUPABASE_URL = "https://qmqmnbdwrbilrzmqghfk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_zr1KBIxXRPeMZXiOF81Zaw_Jcj_IS0V";

  // Cada página física possui um registro próprio no Supabase.
  // A página inicial mantém o ID "home" para preservar o conteúdo já salvo.
  // As páginas geradas por pagina.html usam um ID separado por seção.
  const arquivoAtual = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const secaoPagina = new URLSearchParams(location.search).get("secao");
  const PAGE_ID = arquivoAtual === "pagina.html"
    ? "pagina-" + (secaoPagina || "colegio")
    : arquivoAtual === "" || arquivoAtual === "index.html"
      ? "home"
      : arquivoAtual.replace(/\.html?$/i, "").replace(/[^a-z0-9_-]/g, "-");

  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

  const areas = () => ({
    header: $("header.top"),
    main: $("main"),
    footer: $("footer")
  });

  let db = null;
  let editando = false;
  let selecionado = null;
  let modoSelecao = "";
  let historico = [];
  let indiceHistorico = -1;
  let estadoSalvo = "";
  let timerHistorico = null;
  let arquivoImagemEscolhido = null;

  function aviso(texto) {
    const elemento = $("#editorUniversalStatus");
    if (elemento) elemento.textContent = texto;
  }

  function botao(texto, acao) {
    const elemento = document.createElement("button");
    elemento.type = "button";
    elemento.textContent = texto;
    elemento.addEventListener("click", acao);
    return elemento;
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

    return {
      grupo,
      entrada
    };
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

    db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }

  /*
   * INTEGRAÇÃO COM O MENU ANTIGO
   *
   * Se o menu antigo existir no HTML, não criaremos outro.
   * Retiramos o botão de salvamento local e acrescentamos
   * as funções de nuvem e de edição.
   */
  function integrarMenuAntigo(painel) {
    painel
      .querySelectorAll(
        "button, input[type=button], input[type=submit], a"
      )
      .forEach(elemento => {
        const texto = (
          elemento.innerText ||
          elemento.value ||
          elemento.textContent ||
          ""
        ).trim().toLowerCase();

        // O editor antigo salva apenas no localStorage e pode dar a
        // impressão de que publicou as mudanças. O salvamento oficial
        // agora é feito pelo botão "Salvar na nuvem" integrado abaixo.
        if (
          elemento.id === "edSalvar" ||
          texto.includes("salvar neste navegador") ||
          texto.includes("salvar no navegador") ||
          texto.includes("salvar localmente")
        ) {
          elemento.remove();
        }
      });

    let area = painel.querySelector(
      ".editorAcoesNuvem, #editorAcoesNuvem"
    );

    if (!area) {
      area = document.createElement("div");

      area.id = "editorAcoesNuvem";
      area.className = "editorAcoesNuvem";

      area.style.cssText = `
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid #d7bd7a;
        display: grid;
        gap: 5px;
      `;

      painel.appendChild(area);
    }

    function adicionarAcao(id, texto, acao) {
      if (painel.querySelector("#" + id)) return;

      const elemento = document.createElement("button");

      elemento.id = id;
      elemento.type = "button";
      elemento.textContent = texto;

      elemento.style.cssText = `
        width: 100%;
        padding: 9px;
        margin: 2px 0;
        cursor: pointer;
      `;

      elemento.addEventListener("click", acao);

      area.appendChild(elemento);
    }

    adicionarAcao(
      "editorDesfazer",
      "↶ Desfazer",
      desfazer
    );

    adicionarAcao(
      "editorRefazer",
      "↷ Refazer",
      refazer
    );

    adicionarAcao(
      "editorCancelar",
      "✖ Cancelar alterações não salvas",
      cancelar
    );

    adicionarAcao(
      "editorSalvar",
      "☁️ Salvar na nuvem",
      salvar
    );

    adicionarAcao(
      "editorBaixar",
      "📥 Baixar cópia HTML",
      baixarHTML
    );

    adicionarAcao(
      "editorConcluir",
      "Concluir edição",
      concluir
    );

    let status = painel.querySelector(
      "#editorUniversalStatus"
    );

    if (!status) {
      status = document.createElement("div");

      status.id = "editorUniversalStatus";
      status.setAttribute("role", "status");

      status.style.cssText = `
        margin-top: 8px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      `;

      area.appendChild(status);
    }

    document.addEventListener("input", evento => {
      if (
        evento.target.isContentEditable &&
        !evento.target.closest("#editorPainel")
      ) {
        agendarHistorico();
      }
    });
  }

  /*
   * CRIA O PAINEL NOVO SOMENTE SE O ANTIGO NÃO EXISTIR.
   * Isso evita dois menus sobrepostos.
   */
  function criarPainel() {
    if ($("#editorUniversal")) return;

    const painelAntigo = $("#editorPainel");

    if (painelAntigo) {
      integrarMenuAntigo(painelAntigo);
      return;
    }

    const estilo = document.createElement("style");

    estilo.textContent = `
      #editorUniversal {
        position: fixed;
        right: 16px;
        bottom: 16px;
        width: 320px;
        max-width: calc(100vw - 32px);
        max-height: 82vh;
        overflow: auto;
        z-index: 999999;
        background: #fffaf0;
        color: #49301f;
        border: 2px solid #c9a44c;
        border-radius: 14px;
        box-shadow: 0 5px 25px #0005;
        font: 14px Arial, sans-serif;
      }

      #editorUniversal * {
        box-sizing: border-box;
      }

      #editorUniversal .editorTopo {
        padding: 14px;
        background: #55351f;
        color: #f5d77e;
        font-weight: bold;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      #editorUniversal .editorCorpo {
        padding: 12px;
      }

      #editorUniversal .editorAbas {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-bottom: 12px;
      }

      #editorUniversal button,
      #editorUniversal input,
      #editorUniversal select {
        font: inherit;
      }

      #editorUniversal button {
        width: 100%;
        padding: 10px;
        margin: 4px 0;
        border: 1px solid #d7bd7a;
        border-radius: 7px;
        background: #f5d77e;
        color: #382719;
        cursor: pointer;
      }

      #editorUniversal button:hover {
        filter: brightness(.96);
      }

      #editorUniversal .editorAbaAtiva {
        background: #55351f;
        color: #fff5d7;
      }

      #editorUniversal .editorGrupo {
        display: block;
        margin: 12px 0;
      }

      #editorUniversal .editorGrupo span {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }

      #editorUniversal input,
      #editorUniversal select {
        width: 100%;
        min-width: 0;
        padding: 9px;
        border: 1px solid #c9b68c;
        border-radius: 6px;
        background: white;
      }

      #editorUniversal input[type=color] {
        height: 42px;
        padding: 3px;
      }

      #editorUniversal .editorSecao {
        border-top: 1px solid #ddcba7;
        padding-top: 10px;
        margin-top: 10px;
      }

      #editorUniversalStatus {
        line-height: 1.5;
        margin-top: 10px;
        overflow-wrap: anywhere;
      }

      /* Contorno temporário enquanto o editor está selecionando um elemento. */
      .editorSelecionado {
        outline: 3px dashed #d5a62c !important;
        outline-offset: 2px;
      }

      #editorAbrir {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 999998;
        background: #55351f;
        color: #f5d77e;
        border: 2px solid #c9a44c;
        border-radius: 12px;
        padding: 13px 17px;
        font-weight: bold;
        cursor: pointer;
      }

      @media (max-width: 480px) {
        #editorUniversal {
          right: 8px;
          bottom: 8px;
          max-width: calc(100vw - 16px);
        }

        #editorAbrir {
          right: 8px;
          bottom: 8px;
        }
      }
    `;

    document.head.appendChild(estilo);

    const abrir = document.createElement("button");

    abrir.id = "editorAbrir";
    abrir.type = "button";
    abrir.textContent = "⚙ Editar site";

    abrir.addEventListener("click", () => {
      const painel = $("#editorUniversal");

      painel.style.display =
        painel.style.display === "block" ? "none" : "block";

      abrir.style.display =
        painel.style.display === "block" ? "none" : "block";
    });

    document.body.appendChild(abrir);

    const painel = document.createElement("div");

    painel.id = "editorUniversal";
    painel.style.display = "none";

    painel.innerHTML = `
      <div class="editorTopo">
        <span>⚙ Editor do Colégio</span>
        <button
          type="button"
          id="editorFechar"
          style="width:auto;margin:0;padding:5px 9px"
        >✕</button>
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
            Preparando editor…
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(painel);

    $("#editorFechar").addEventListener("click", () => {
      painel.style.display = "none";
      abrir.style.display = "block";
    });

    painel.querySelectorAll("[data-aba]").forEach(botaoAba => {
      botaoAba.addEventListener("click", () => {
        abrirAba(botaoAba.dataset.aba);
      });
    });

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
      if (el) {
        resultado[nome] = {
          html: limparHTML(el),
          style: el.getAttribute("style")
        };
      }
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
    clearTimeout(timerHistorico);

    const atual = capturarEstado();

    if (historico[indiceHistorico] === atual) return;

    historico = historico.slice(0, indiceHistorico + 1);
    historico.push(atual);

    if (historico.length > 80) {
      historico.shift();
    }

    indiceHistorico = historico.length - 1;
    atualizarBotoesHistorico();
  }

  function agendarHistorico() {
    clearTimeout(timerHistorico);
    timerHistorico = setTimeout(registrarHistorico, 250);
  }

  function atualizarBotoesHistorico() {
    const desfazerBotao = $("#editorDesfazer");
    const refazerBotao = $("#editorRefazer");

    if (desfazerBotao) {
      desfazerBotao.disabled = indiceHistorico <= 0;
    }

    if (refazerBotao) {
      refazerBotao.disabled =
        indiceHistorico >= historico.length - 1;
    }
  }

  function desfazer() {
    clearTimeout(timerHistorico);

    if (indiceHistorico <= 0) {
      return aviso("Não há mais alterações para desfazer.");
    }

    indiceHistorico--;
    aplicarEstado(historico[indiceHistorico]);
    atualizarBotoesHistorico();

    aviso("Alteração desfeita. Ainda não foi publicada.");
  }

  function refazer() {
    clearTimeout(timerHistorico);

    if (indiceHistorico >= historico.length - 1) {
      return aviso("Não há alterações para refazer.");
    }

    indiceHistorico++;
    aplicarEstado(historico[indiceHistorico]);
    atualizarBotoesHistorico();

    aviso("Alteração refeita. Ainda não foi publicada.");
  }

  function cancelar() {
    if (!estadoSalvo) {
      return aviso("Ainda não existe uma versão salva carregada.");
    }

    if (
      !confirm(
        "Descartar todas as alterações desde o último salvamento?"
      )
    ) {
      return;
    }

    aplicarEstado(estadoSalvo);

    historico = [estadoSalvo];
    indiceHistorico = 0;

    atualizarBotoesHistorico();

    aviso("Alterações não salvas canceladas.");
  }

  function limparHTML(elemento) {
    const copia = elemento.cloneNode(true);

    // Remove somente os controles do editor, nunca o título selecionado.
    copia.querySelectorAll(
      "#editorUniversal, #editorAbrir, #editorAcoesNuvem, #editorPainel, #editorUniversalStatus"
    ).forEach(el => el.remove());

    // Remove os sinais visuais de edição sem apagar o conteúdo selecionado.
    copia.querySelectorAll(".editorSelecionado").forEach(el => {
      el.classList.remove("editorSelecionado");
    });

    copia.querySelectorAll("[contenteditable]").forEach(el => {
      el.removeAttribute("contenteditable");
    });

    copia.querySelectorAll("[class]").forEach(el => {
      if (!el.getAttribute("class")?.trim()) {
        el.removeAttribute("class");
      }
    });

    return copia.innerHTML;
  }

  function escolherElemento(elemento) {
    if (
      !elemento ||
      elemento.closest(
        "#editorUniversal, #editorPainel, #editorAcoesNuvem"
      ) ||
      elemento.id === "editorAbrir"
    ) {
      return;
    }

    limparSelecaoVisual();

    selecionado = elemento;
    selecionado.classList.add("editorSelecionado");

    const rotulo = selecionado.tagName.toLowerCase();
    const textoVisivel = (selecionado.innerText || selecionado.alt || "").trim().replace(/\s+/g, " ").slice(0, 45);
    aviso("Selecionado: <" + rotulo + ">" + (textoVisivel ? " — “" + textoVisivel + (textoVisivel.length >= 45 ? "…" : "") + "”" : "") + ". A borda mostra o elemento selecionado.");
  }

  function limparSelecaoVisual() {
    document.querySelectorAll(".editorSelecionado").forEach(el => {
      el.classList.remove("editorSelecionado");
    });
  }

  function ativarSelecao(modo = "geral") {
    concluirSelecao();

    editando = true;
    modoSelecao = modo;

    document.addEventListener("click", selecionarClique, true);

    aviso("Clique no elemento que deseja selecionar na página.");
  }

  function selecionarClique(evento) {
    let elemento = evento.target;

    if (
      !editando ||
      elemento.closest(
        "#editorUniversal, #editorPainel, #editorAcoesNuvem"
      ) ||
      elemento.id === "editorAbrir"
    ) {
      return;
    }

    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();

    // Escolhe o bloco útil mais próximo, evitando selecionar só uma palavra/span.
    if (modoSelecao === "texto") {
      elemento = elemento.closest("h1, h2, h3, h4, p, li, a, button, label") || elemento;
    } else if (modoSelecao === "imagem") {
      elemento = elemento.closest("img") || elemento;
    } else if (modoSelecao === "cor") {
      elemento = elemento.closest("h1, h2, h3, h4, p, li, a, button, section, article, div, nav, header, footer") || elemento;
    }

    escolherElemento(elemento);

    document.removeEventListener(
      "click",
      selecionarClique,
      true
    );

    editando = false;

    if (modoSelecao === "texto") {
      editarDireto();
    } else if (
      modoSelecao === "imagem" &&
      selecionado?.tagName !== "IMG"
    ) {
      aviso(
        "Área selecionada. Você pode aplicar uma imagem como fundo."
      );
    } else if (modoSelecao === "imagem") {
      aviso(
        "Imagem selecionada. Escolha um arquivo e clique em Aplicar imagem."
      );
    } else if (modoSelecao === "cor") {
      aviso(
        "Elemento selecionado. Escolha as cores na aba Aparência."
      );
    }

    modoSelecao = "";
  }

  function concluirSelecao() {
    editando = false;
    modoSelecao = "";

    document.removeEventListener(
      "click",
      selecionarClique,
      true
    );

    limparSelecaoVisual();
  }

  function concluir() {
    concluirSelecao();

    document.querySelectorAll("[contenteditable]").forEach(el => {
      el.removeAttribute("contenteditable");
    });

    selecionado = null;

    aviso(
      "Edição concluída. Clique em Salvar na nuvem para publicar."
    );
  }

  function editarDireto() {
    if (!selecionado) {
      return aviso("Primeiro selecione um elemento.");
    }

    if (
      selecionado.matches(
        "img, input, textarea, select, button, svg, video, iframe"
      )
    ) {
      return aviso(
        "Esse elemento não é um texto editável. Escolha um título, parágrafo ou texto."
      );
    }

    selecionado.contentEditable = "true";
    selecionado.focus();

    aviso(
      "Agora edite o texto diretamente na página. Clique em Concluir edição quando terminar."
    );

    selecionado.addEventListener("input", agendarHistorico);
  }

  function abrirAba(aba) {
    const ferramentas = $("#editorFerramentas");

    if (!ferramentas) return;

    ferramentas.innerHTML = "";

    document
      .querySelectorAll("#editorUniversal [data-aba]")
      .forEach(botaoAba => {
        botaoAba.classList.toggle(
          "editorAbaAtiva",
          botaoAba.dataset.aba === aba
        );
      });

    if (aba === "textos") {
      ferramentas.append(
        botao(
          "✏️ Selecionar texto para editar diretamente",
          () => ativarSelecao("texto")
        ),
        botao("Concluir seleção", concluirSelecao)
      );

      const info = document.createElement("p");

      info.textContent =
        "Clique no botão e depois no texto da página para editá-lo diretamente.";

      ferramentas.append(info);
    }

    if (aba === "conteudo") {
      ferramentas.append(
        botao(
          "🎯 Selecionar elemento para remover ou editar",
          () => ativarSelecao("geral")
        ),
        botao(
          "➕ Adicionar título",
          () => adicionarConteudo("h2", "Novo título")
        ),
        botao(
          "➕ Adicionar parágrafo",
          () => adicionarConteudo(
            "p",
            "Escreva seu texto aqui."
          )
        ),
        botao(
          "➕ Adicionar lista",
          adicionarLista
        ),
        botao(
          "🗑️ Remover elemento selecionado",
          removerSelecionado
        )
      );
    }

    if (aba === "imagens") {
      const info = document.createElement("p");

      info.textContent =
        "Selecione uma imagem da página ou adicione uma nova do seu computador.";

      ferramentas.append(info);

      ferramentas.append(
        botao(
          "🖼️ Selecionar imagem existente",
          () => ativarSelecao("imagem")
        ),
        botao(
          "📁 Escolher imagem do computador",
          escolherArquivoImagem
        ),
        botao(
          "Aplicar imagem escolhida",
          aplicarImagem
        ),
        botao(
          "➕ Adicionar nova imagem",
          adicionarImagem
        )
      );

      const largura = campo(
        "Largura da imagem (ex.: 300px ou 100%)",
        "text",
        "100%"
      );

      largura.entrada.id = "editorLarguraImagem";

      ferramentas.append(largura.grupo);

      const alt = campo(
        "Descrição da imagem",
        "text",
        ""
      );

      alt.entrada.id = "editorAltImagem";

      ferramentas.append(alt.grupo);
    }

    if (aba === "aparencia") {
      ferramentas.append(
        botao(
          "🎨 Selecionar elemento para mudar aparência",
          () => ativarSelecao("cor")
        )
      );

      const fundo = campo(
        "Cor de fundo",
        "color",
        "#ffffff"
      );

      fundo.entrada.id = "editorCorFundo";

      ferramentas.append(fundo.grupo);

      const texto = campo(
        "Cor do texto",
        "color",
        "#222222"
      );

      texto.entrada.id = "editorCorTexto";

      ferramentas.append(texto.grupo);

      const tamanho = campo(
        "Tamanho da letra (px)",
        "number",
        "18"
      );

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
        botao("A− Diminuir texto selecionado", () => ajustarTextoSelecionado(-2)),
        botao("A+ Aumentar texto selecionado", () => ajustarTextoSelecionado(2)),
        botao("－ Diminuir zoom da página", () => ajustarZoomPagina(-0.1)),
        botao("＋ Aumentar zoom da página", () => ajustarZoomPagina(0.1)),
        botao("↺ Restaurar zoom da página", () => restaurarZoomPagina()),
        botao("Mudar cor do fundo da página", mudarFundoPagina)
      );
    }

    if (aba === "menu") {
      ferramentas.append(
        botao(
          "🧭 Selecionar menu para editar",
          () => ativarSelecao("geral")
        ),
        botao(
          "➕ Adicionar link ao menu",
          adicionarLinkMenu
        ),
        botao(
          "🗑️ Remover link selecionado",
          removerSelecionado
        )
      );

      const texto = campo(
        "Texto do novo link",
        "text",
        "Nova página"
      );

      texto.entrada.id = "editorTextoLink";
      ferramentas.append(texto.grupo);

      const destino = campo(
        "Destino do link",
        "text",
        "pagina.html"
      );

      destino.entrada.id = "editorDestinoLink";
      ferramentas.append(destino.grupo);

      const info = document.createElement("p");

      info.textContent =
        "Você também pode selecionar um link existente e alterar seu texto diretamente na página.";

      ferramentas.append(info);
    }

    if (aba === "pagina") {
      ferramentas.append(
        botao(
          "🗑️ Remover elemento selecionado",
          removerSelecionado
        ),
        botao("↻ Recarregar a página", () => {
          if (
            confirm(
              "Recarregar a página? Alterações não salvas podem ser perdidas."
            )
          ) {
            location.reload();
          }
        })
      );

      const info = document.createElement("p");

      info.textContent =
        "Use Salvar na nuvem para publicar as alterações. O botão Baixar cópia HTML gera uma cópia local da página.";

      ferramentas.append(info);
    }
  }

  function adicionarConteudo(tipo, texto) {
    const principal = $("main");

    if (!principal) {
      return aviso("Não encontrei a área principal da página.");
    }

    const elemento = document.createElement(tipo);
    elemento.textContent = texto;
    elemento.contentEditable = "true";

    principal.append(elemento);

    escolherElemento(elemento);
    elemento.focus();

    registrarHistorico();

    aviso(
      "Conteúdo adicionado. Edite o texto diretamente na página."
    );
  }

  function adicionarLista() {
    const principal = $("main");

    if (!principal) {
      return aviso("Não encontrei a área principal da página.");
    }

    const lista = document.createElement("ul");

    [
      "Primeiro item",
      "Segundo item",
      "Terceiro item"
    ].forEach(texto => {
      const item = document.createElement("li");
      item.textContent = texto;
      lista.append(item);
    });

    lista.contentEditable = "true";
    principal.append(lista);

    escolherElemento(lista);

    registrarHistorico();

    aviso(
      "Lista adicionada. Você pode editar os itens diretamente."
    );
  }

  function removerSelecionado() {
    if (!selecionado) {
      return aviso("Primeiro selecione um elemento da página.");
    }

    if (
      selecionado.matches("header, main, footer, body")
    ) {
      return aviso(
        "Por segurança, não é permitido remover toda uma área da página."
      );
    }

    if (
      !confirm(
        "Tem certeza de que deseja remover o elemento selecionado?"
      )
    ) {
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
      const arquivo = input.files && input.files[0];

      if (!arquivo) return;

      if (!arquivo.type.startsWith("image/")) {
        return aviso("Escolha um arquivo de imagem.");
      }

      if (arquivo.size > 1024 * 1024) {
        return aviso(
          "A imagem deve ter menos de 1 MB."
        );
      }

      arquivoImagemEscolhido = arquivo;

      aviso(
        "Imagem escolhida: " +
        arquivo.name +
        ". Agora clique em Aplicar imagem."
      );
    });

    input.click();
  }

  function aplicarImagem() {
    if (!arquivoImagemEscolhido) {
      return aviso(
        "Primeiro clique em Escolher imagem do computador."
      );
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const dadosImagem = leitor.result;

      if (
        selecionado &&
        selecionado.tagName === "IMG"
      ) {
        selecionado.src = dadosImagem;

        const alt = $("#editorAltImagem");

        if (alt && alt.value.trim()) {
          selecionado.alt = alt.value.trim();
        }

        const largura = $("#editorLarguraImagem");

        if (largura && largura.value.trim()) {
          selecionado.style.width =
            largura.value.trim();
        }

        registrarHistorico();

        aviso(
          "Imagem alterada. Salve na nuvem para publicar."
        );
      } else {
        adicionarImagemComDados(
          dadosImagem,
          arquivoImagemEscolhido.name
        );
      }

      arquivoImagemEscolhido = null;
    };

    leitor.onerror = () => {
      aviso("Não foi possível ler essa imagem.");
    };

    leitor.readAsDataURL(arquivoImagemEscolhido);
  }

  function adicionarImagem() {
    escolherArquivoImagem();
  }

  function adicionarImagemComDados(dadosImagem, nome) {
    const principal = $("main");

    if (!principal) {
      return aviso("Não encontrei a área principal da página.");
    }

    const imagem = document.createElement("img");

    imagem.src = dadosImagem;
    imagem.alt = nome || "Imagem do site";
    imagem.style.maxWidth = "100%";
    imagem.style.height = "auto";

    const largura = $("#editorLarguraImagem");

    if (largura && largura.value.trim()) {
      imagem.style.width = largura.value.trim();
    }

    principal.append(imagem);

    escolherElemento(imagem);
    registrarHistorico();

    aviso(
      "Imagem adicionada. Salve na nuvem para publicar."
    );
  }

  function aplicarAparencia() {
    if (!selecionado) {
      return aviso(
        "Primeiro selecione um elemento da página."
      );
    }

    const fundo = $("#editorCorFundo");
    const texto = $("#editorCorTexto");
    const tamanho = $("#editorTamanhoTexto");
    const fonte = $("#editorFonte");

    if (fundo) {
      selecionado.style.backgroundColor = fundo.value;
    }

    if (texto) {
      selecionado.style.color = texto.value;
    }

    if (tamanho && tamanho.value) {
      selecionado.style.fontSize =
        tamanho.value + "px";
    }

    if (fonte) {
      selecionado.style.fontFamily = fonte.value;
    }

    registrarHistorico();

    aviso(
      "Aparência alterada. Salve na nuvem para publicar."
    );
  }

  function ajustarTextoSelecionado(delta) {
    if (!selecionado || !document.body.contains(selecionado)) {
      return aviso("Primeiro use Selecionar nesta aba e escolha um elemento.");
    }

    const atual = parseFloat(getComputedStyle(selecionado).fontSize) || 18;
    const novo = Math.max(8, Math.min(100, atual + delta));
    selecionado.style.fontSize = novo + "px";

    const campoTamanho = $("#editorTamanhoTexto");
    if (campoTamanho) campoTamanho.value = String(novo);

    registrarHistorico();
    aviso("Tamanho do texto ajustado para " + novo + " px.");
  }

  function ajustarZoomPagina(delta) {
    const atual = parseFloat(document.documentElement.dataset.editorZoom || "1");
    const novo = Math.max(0.6, Math.min(1.5, Math.round((atual + delta) * 10) / 10));
    document.documentElement.dataset.editorZoom = String(novo);
    document.body.style.zoom = String(novo);
    aviso("Zoom de visualização: " + Math.round(novo * 100) + "%. Isso altera a visualização deste navegador, não o conteúdo publicado.");
  }

  function restaurarZoomPagina() {
    document.documentElement.dataset.editorZoom = "1";
    document.body.style.zoom = "1";
    aviso("Zoom restaurado para 100%.");
  }

  function mudarFundoPagina() {
    const cor = $("#editorCorFundo");

    if (!cor) return;

    document.body.style.backgroundColor = cor.value;

    registrarHistorico();

    aviso(
      "Fundo alterado. Salve na nuvem para publicar."
    );
  }

  function adicionarLinkMenu() {
    const texto = $("#editorTextoLink");
    const destino = $("#editorDestinoLink");

    if (!texto || !destino) return;

    if (!texto.value.trim() || !destino.value.trim()) {
      return aviso(
        "Preencha o texto e o destino do novo link."
      );
    }

    const menu = selecionado?.matches("nav, ul")
      ? selecionado
      : document.querySelector("header nav ul") ||
        document.querySelector("nav ul") ||
        document.querySelector("header nav") ||
        document.querySelector("nav");

    if (!menu) {
      return aviso(
        "Não encontrei o menu. Selecione o menu da página primeiro."
      );
    }

    const link = document.createElement("a");

    link.href = destino.value.trim();
    link.textContent = texto.value.trim();

    const item = document.createElement("li");
    item.append(link);

    if (menu.tagName === "UL") {
      menu.append(item);
    } else {
      menu.append(link);
    }

    registrarHistorico();

    aviso(
      "Link adicionado. Salve na nuvem para publicar."
    );
  }
  // Corrige links antigos carregados do conteúdo salvo na nuvem,
  // sem apagar os textos ou as demais alterações da página.
  function corrigirLinksAntigos() {
    const normalizar = texto => (texto || "")
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase()
      .replace(/[→←]/g, "")
      .replace(/\\s+/g, " ")
      .trim();

    const destinos = {
      "o colegio": "colegio.html",
      "etapas de ensino": "ensino.html",
      "proposta pedagogica": "proposta.html",
      "noticias": "noticias.html",
      "matriculas": "matriculas.html",
      "matriculas abertas": "matriculas.html",
      "fale conosco": "contato.html",
      "educacao infantil": "educacao-infantil.html",
      "ensino fundamental": "ensino-fundamental.html",
      "ensino medio": "ensino-medio.html",
      "formacao integral": "formacao-integral.html",
      "ver todas": "todas-noticias.html",
      "ver todas as noticias": "todas-noticias.html",
      "estrutura": "estrutura.html",
      "projetos": "projetos.html",
      "eventos": "eventos.html",
      "vida escolar": "vida-escolar.html",
      "vida escolar mais que aulas experiencias para a vida": "vida-escolar.html"
    };

    // Corrige o menu compartilhado e links de todas as áreas, mesmo
    // quando o editor carrega uma versão antiga do HTML a partir da nuvem.
    document.querySelectorAll("a").forEach(link => {
      const texto = normalizar(link.innerText || link.textContent);
      const item = Object.entries(destinos).find(([rotulo]) =>
        texto === rotulo || texto.startsWith(rotulo + " ")
      );
      if (item) link.setAttribute("href", item[1]);
    });

    // Dois botões têm o mesmo rótulo, mas destinos diferentes.
    document.querySelectorAll(".hero .actions a.outline").forEach(link =>
      link.setAttribute("href", "historia.html")
    );
    document.querySelectorAll(".intro a.btn").forEach(link =>
      link.setAttribute("href", "comunidade-escolar.html")
    );

    // Na página "Etapas de Ensino", cada etapa precisa abrir sua própria página.
    if ((location.pathname.split("/").pop() || "").toLowerCase() === "ensino.html") {
      const paginasEtapas = {
        "educacao infantil": "educacao-infantil.html",
        "ensino fundamental": "ensino-fundamental.html",
        "ensino medio": "ensino-medio.html"
      };

      document.querySelectorAll("main .inner-panel").forEach(painel => {
        const titulo = normalizar(painel.querySelector("h3")?.textContent);
        const destino = paginasEtapas[titulo];
        if (!destino) return;

        if (painel.tagName.toLowerCase() !== "a") {
          const link = document.createElement("a");
          link.className = painel.className + " etapa-link";
          link.href = destino;
          link.innerHTML = painel.innerHTML;
          link.style.display = "block";
          link.style.color = "inherit";
          link.style.textDecoration = "none";
          link.setAttribute("aria-label", "Conheça " + titulo);
          painel.replaceWith(link);
        } else {
          painel.href = destino;
        }
      });
    }

    // Corrige links antigos que ainda apontam para a página compartilhada.
    const destinoPorSecao = {
      colegio: "colegio.html",
      ensino: "ensino.html",
      proposta: "proposta.html",
      noticias: "noticias.html",
      matriculas: "matriculas.html",
      contato: "contato.html"
    };
    document.querySelectorAll("a[href*='pagina.html?secao=']").forEach(link => {
      try {
        const url = new URL(link.getAttribute("href"), location.href);
        const secao = (url.searchParams.get("secao") || "colegio").toLowerCase();
        if (destinoPorSecao[secao]) link.setAttribute("href", destinoPorSecao[secao]);
      } catch (_) {}
    });

    document.querySelectorAll(".section-heading > a").forEach(link =>
      link.setAttribute("href", "todas-noticias.html")
    );
    document.querySelectorAll(".gold-band a.btn").forEach(link =>
      link.setAttribute("href", "matriculas.html")
    );
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

      corrigirLinksAntigos();

      estadoSalvo = capturarEstado();
      historico = [estadoSalvo];
      indiceHistorico = 0;

      atualizarBotoesHistorico();

      aviso(
        "Editor pronto! Você pode editar e salvar as alterações na nuvem."
      );

    } catch (erro) {
      console.error("Erro ao carregar o editor:", erro);

      corrigirLinksAntigos();

      estadoSalvo = capturarEstado();
      historico = [estadoSalvo];
      indiceHistorico = 0;

      atualizarBotoesHistorico();

      aviso(
        "Editor aberto, mas não foi possível carregar a nuvem. Verifique a conexão e as permissões do Supabase."
      );
    }
  }

  async function salvar() {
    try {
      // A marcação de seleção é temporária e nunca deve ser publicada.
      limparSelecaoVisual();

      if (!db) {
        await prepararSupabase();
      }

      const dados = {};

      for (const [nome, elemento] of Object.entries(areas())) {
        if (!elemento) continue;

        dados[nome + "Html"] = limparHTML(elemento);
        dados[nome + "Style"] = elemento.getAttribute("style");
      }

      const { error } = await db
        .from("site_edits")
        .upsert(
          {
            id: PAGE_ID,
            content: dados,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "id"
          }
        );

      if (error) {
        throw error;
      }

      corrigirLinksAntigos();

      estadoSalvo = capturarEstado();
      historico = [estadoSalvo];
      indiceHistorico = 0;

      atualizarBotoesHistorico();

      aviso(
        "Alterações salvas na nuvem! Recarregue a página para conferir."
      );

    } catch (erro) {
      console.error("Erro ao salvar:", erro);

      aviso(
        "Não foi possível salvar. Verifique as permissões de leitura e gravação da tabela site_edits no Supabase."
      );
    }
  }

  function baixarHTML() {
    try {
      const copia = document.documentElement.cloneNode(true);

      copia.querySelectorAll(
        "#editorUniversal, #editorAbrir, #editorAcoesNuvem"
      ).forEach(el => el.remove());

      copia.querySelectorAll("[contenteditable]").forEach(el => {
        el.removeAttribute("contenteditable");
      });

      copia.querySelectorAll(".editorSelecionado").forEach(el => {
        el.classList.remove("editorSelecionado");
      });

      const html = "<!doctype html>\n" + copia.outerHTML;

      const arquivo = new Blob(
        [html],
        {
          type: "text/html;charset=utf-8"
        }
      );

      const endereco = URL.createObjectURL(arquivo);
      const link = document.createElement("a");

      link.href = endereco;
      link.download = PAGE_ID === "home"
        ? "index.html"
        : PAGE_ID.startsWith("pagina-")
          ? "pagina.html"
          : PAGE_ID + ".html";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(endereco);
      }, 1000);

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
      !evento.target.closest(
        "#editorUniversal, #editorPainel"
      )
    ) {
      agendarHistorico();
    }
  });

  // Inicia o editor e carrega os dados salvos na nuvem.
  criarPainel();
  await carregar();

})();
   
