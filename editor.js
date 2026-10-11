/* EDITOR UNIVERSAL — COLÉGIO SANTA TERESINHA */

(async function () {
  "use strict";

  if (window.__editorColegioIniciado) return;
  window.__editorColegioIniciado = true;

  const SUPABASE_URL =
    "https://qmqmnbdwrbilrzmqghfk.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_zr1KBIxXRPeMZXiOF81Zaw_Jcj_IS0V";

  const PAGE_ID = location.pathname.endsWith("pagina.html")
    ? "pagina-" +
      (new URLSearchParams(location.search).get("secao") || "colegio")
    : "home";

  if (!window.supabase) {
    console.error("Biblioteca Supabase não carregada.");
    window.__editorColegioIniciado = false;
    return;
  }

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  let editando = false;
  let selecionado = null;
  let menuOriginal = [];
  let alteracoesMenu = false;

  const $ = (seletor, raiz = document) =>
    raiz.querySelector(seletor);

  const areas = () => ({
    header: $("header.top"),
    main: $("main"),
    footer: $("footer")
  });

  function aviso(texto) {
    const elemento = $("#editorStatus");
    if (elemento) elemento.textContent = texto;
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

  function criarPainel() {
    if ($("#editorUniversal")) return;

    const estilo = document.createElement("style");

    estilo.textContent = `
      #editorUniversal {
        position:fixed;
        right:16px;
        bottom:16px;
        width:320px;
        max-width:calc(100vw - 32px);
        max-height:82vh;
        overflow:auto;
        z-index:999999;
        background:#fffaf0;
        color:#49301f;
        border:2px solid #c9a44c;
        border-radius:14px;
        box-shadow:0 5px 25px #0005;
        font:14px Arial,sans-serif;
      }

      #editorUniversal * { box-sizing:border-box; }

      #editorUniversal .editorTopo {
        padding:14px;
        background:#55351f;
        color:#f5d77e;
        font-weight:bold;
        font-size:16px;
      }

      #editorUniversal .editorCorpo { padding:12px; }

      #editorUniversal .editorAbas {
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:6px;
        margin-bottom:12px;
      }

      #editorUniversal button,
      #editorUniversal input,
      #editorUniversal select {
        font:inherit;
      }

      #editorUniversal button {
        width:100%;
        padding:10px;
        margin:4px 0;
        border:1px solid #d7bd7a;
        border-radius:7px;
        background:#f5d77e;
        color:#382719;
        cursor:pointer;
      }

      #editorUniversal button:hover {
        filter:brightness(.96);
      }

      #editorUniversal .editorAbaAtiva {
        background:#55351f;
        color:#fff5d7;
      }

      #editorUniversal .editorGrupo {
        display:block;
        margin:12px 0;
      }

      #editorUniversal .editorGrupo span {
        display:block;
        margin-bottom:5px;
        font-weight:bold;
      }

      #editorUniversal input,
      #editorUniversal select {
        width:100%;
        min-width:0;
        padding:9px;
        border:1px solid #c9b68c;
        border-radius:6px;
        background:white;
      }

      #editorUniversal input[type=color] {
        height:42px;
        padding:3px;
      }

      #editorUniversal .editorSecao {
        border-top:1px solid #ddcba7;
        padding-top:10px;
        margin-top:10px;
      }

      #editorUniversalStatus {
        line-height:1.5;
        margin-top:10px;
        overflow-wrap:anywhere;
      }

      .editorSelecionado {
        outline:3px dashed #d5a62c !important;
        outline-offset:2px;
      }

      @media(max-width:480px) {
        #editorUniversal {
          right:8px;
          bottom:8px;
          max-width:calc(100vw - 16px);
        }
      }
    `;

    document.head.appendChild(estilo);

    const painel = document.createElement("div");
    painel.id = "editorUniversal";

    painel.innerHTML = `
      <div class="editorTopo">
        ⚙ Editor do Colégio
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
          <button id="editorSalvar">☁️ Salvar na nuvem</button>
          <button id="editorConcluir">Concluir edição</button>
          <div id="editorStatus" role="status">
            Preparando editor...
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(painel);

    painel.querySelectorAll("[data-aba]").forEach(b => {
      b.addEventListener("click", () => abrirAba(b.dataset.aba));
    });

    $("#editorSalvar").addEventListener("click", salvar);
    $("#editorConcluir").addEventListener("click", concluir);

    abrirAba("textos");
  }

  function escolherElemento(elemento) {
    if (!editando || !elemento) return;

    if (elemento.closest("#editorUniversal")) return;

    if (selecionado) {
      selecionado.classList.remove("editorSelecionado");
    }

    selecionado = elemento;
    selecionado.classList.add("editorSelecionado");

    aviso("Elemento selecionado. Agora escolha uma ferramenta.");
  }

  function ativarSelecao() {
    editando = true;

    document.body.classList.add("modoEditor");

    document.addEventListener("click", selecionarClique, true);

    aviso("Edição ativada. Clique no elemento que deseja alterar.");
  }

  function selecionarClique(evento) {
    if (!editando) return;

    const elemento = evento.target;

    if (elemento.closest("#editorUniversal")) return;

    evento.preventDefault();
    evento.stopPropagation();

    escolherElemento(elemento);
  }

  function concluir() {
    editando = false;

    document.removeEventListener("click", selecionarClique, true);

    document.body.classList.remove("modoEditor");

    document.querySelectorAll(".editorSelecionado").forEach(el => {
      el.classList.remove("editorSelecionado");
    });

    document.querySelectorAll("[contenteditable]").forEach(el => {
      el.removeAttribute("contenteditable");
    });

    selecionado = null;

    aviso("Edição concluída. Clique em salvar para publicar as alterações.");
  }

  function abrirAba(nome) {
    const ferramentas = $("#editorFerramentas");
    ferramentas.replaceChildren();

    document.querySelectorAll("#editorUniversal [data-aba]").forEach(b => {
      b.classList.toggle("editorAbaAtiva", b.dataset.aba === nome);
    });

    if (nome === "textos") abaTextos(ferramentas);
    if (nome === "conteudo") abaConteudo(ferramentas);
    if (nome === "imagens") abaImagens(ferramentas);
    if (nome === "aparencia") abaAparencia(ferramentas);
    if (nome === "menu") abaMenu(ferramentas);
    if (nome === "pagina") abaPagina(ferramentas);
  }

  // 1. EDIÇÃO DE TEXTOS

  function abaTextos(painel) {
    painel.append(
      botao("✏️ Ativar seleção de textos e elementos", ativarSelecao),
      botao("Editar texto do elemento selecionado", editarSelecionado)
    );

    const dica = document.createElement("p");
    dica.textContent =
      "Ative a seleção, clique no texto da página e depois escolha editar.";
    painel.appendChild(dica);
  }

  function editarSelecionado() {
    if (!selecionado) {
      aviso("Primeiro ative a seleção e clique em um elemento.");
      return;
    }

    if (selecionado.matches("img, input, textarea, select")) {
      aviso("Este elemento não é um texto editável.");
      return;
    }

    const novoTexto = prompt(
      "Digite o novo texto:",
      selecionado.innerText
    );

    if (novoTexto !== null) {
      selecionado.textContent = novoTexto;
      aviso("Texto alterado. Clique em salvar na nuvem.");
    }
  }

  // 2. ADICIONAR CONTEÚDO

  function abaConteudo(painel) {
    painel.append(
      botao("➕ Adicionar título", () => adicionarBloco("h2")),
      botao("➕ Adicionar subtítulo", () => adicionarBloco("h3")),
      botao("➕ Adicionar parágrafo", () => adicionarBloco("p")),
      botao("➕ Adicionar seção completa", adicionarSecao)
    );

    const dica = document.createElement("p");
    dica.textContent =
      "O novo conteúdo será acrescentado ao final da área principal da página.";
    painel.appendChild(dica);
  }

  function adicionarBloco(tipo) {
    const texto = prompt("Digite o conteúdo:");

    if (texto === null || !texto.trim()) return;

    const principal = $("main");
    if (!principal) return;

    const elemento = document.createElement(tipo);
    elemento.textContent = texto;

    principal.appendChild(elemento);

    aviso("Conteúdo adicionado. Salve na nuvem.");
  }

  function adicionarSecao() {
    const titulo = prompt("Título da nova seção:");
    if (titulo === null || !titulo.trim()) return;

    const texto = prompt("Texto da seção:");
    if (texto === null) return;

    const secao = document.createElement("section");
    secao.style.cssText =
      "padding:35px 20px;max-width:1100px;margin:auto;";

    const h2 = document.createElement("h2");
    h2.textContent = titulo;

    const p = document.createElement("p");
    p.textContent = texto;

    secao.append(h2, p);

    const principal = $("main");
    if (!principal) return;

    principal.appendChild(secao);

    aviso("Nova seção adicionada. Salve na nuvem.");
  }

  // 3. IMAGENS

  function abaImagens(painel) {
    painel.append(
      botao("🖼️ Selecionar imagem da página", ativarSelecao)
    );

    const url = campo("Endereço da nova imagem", "url");
    url.entrada.placeholder = "https://...";

    painel.appendChild(url.grupo);

    painel.appendChild(
      botao("Aplicar imagem ao elemento selecionado", () => {
        if (!selecionado) {
          aviso("Selecione uma imagem primeiro.");
          return;
        }

        if (!selecionado.matches("img")) {
          aviso("O elemento selecionado não é uma imagem.");
          return;
        }

        if (!url.entrada.value.trim()) {
          aviso("Digite o endereço da imagem.");
          return;
        }

        selecionado.src = url.entrada.value.trim();
        aviso("Imagem alterada. Salve na nuvem.");
      })
    );

    painel.appendChild(
      botao("Adicionar imagem à página", () => {
        const endereco = prompt("Cole o endereço da imagem:");
        if (!endereco) return;

        const img = document.createElement("img");
        img.src = endereco;
        img.alt = prompt("Descrição da imagem:") || "";
        img.loading = "lazy";
        img.style.cssText =
          "display:block;max-width:100%;height:auto;margin:20px auto;";

        const principal = $("main");
        if (!principal) return;

        principal.appendChild(img);
        aviso("Imagem adicionada. Salve na nuvem.");
      })
    );
  }

  // 4. APARÊNCIA

  function abaAparencia(painel) {
    painel.appendChild(
      botao("Selecionar elemento para personalizar", ativarSelecao)
    );

    const corFundo = campo("Cor de fundo", "color", "#ffffff");
    const corTexto = campo("Cor do texto", "color", "#49301f");

    painel.append(corFundo.grupo, corTexto.grupo);

    painel.appendChild(
      botao("Aplicar cores ao elemento selecionado", () => {
        if (!selecionado) {
          aviso("Selecione um elemento primeiro.");
          return;
        }

        selecionado.style.backgroundColor = corFundo.entrada.value;
        selecionado.style.color = corTexto.entrada.value;

        aviso("Cores aplicadas. Salve na nuvem.");
      })
    );

    const fonte = document.createElement("label");
    fonte.className = "editorGrupo";

    const tituloFonte = document.createElement("span");
    tituloFonte.textContent = "Tipo de letra";

    const lista = document.createElement("select");

    [
      ["Arial", "Arial"],
      ["Georgia", "Georgia"],
      ["Times New Roman", "Times New Roman"],
      ["Verdana", "Verdana"],
      ["Trebuchet MS", "Trebuchet MS"]
    ].forEach(([valor, nome]) => {
      const opcao = document.createElement("option");
      opcao.value = valor;
      opcao.textContent = nome;
      lista.appendChild(opcao);
    });

    fonte.append(tituloFonte, lista);
    painel.appendChild(fonte);

    const tamanho = campo("Tamanho da letra (px)", "number", "18");
    tamanho.entrada.min = "8";
    tamanho.entrada.max = "100";

    painel.appendChild(tamanho.grupo);

    painel.appendChild(
      botao("Aplicar fonte e tamanho", () => {
        if (!selecionado) {
          aviso("Selecione um elemento primeiro.");
          return;
        }

        const px = Number(tamanho.entrada.value);

        if (px < 8 || px > 100) {
          aviso("Escolha um tamanho entre 8 e 100.");
          return;
        }

        selecionado.style.fontFamily = lista.value;
        selecionado.style.fontSize = px + "px";

        aviso("Aparência alterada. Salve na nuvem.");
      })
    );
  }

  // 5. MENU DE NAVEGAÇÃO

  function abaMenu(painel) {
    painel.appendChild(
      botao("Ativar seleção do menu", ativarSelecao)
    );

    const nav = $("header.top nav");

    if (!nav) {
      painel.append("Não encontrei o menu superior nesta página.");
      return;
    }

    const links = [...nav.querySelectorAll("a")];

    painel.appendChild(document.createElement("hr"));

    links.forEach((link, indice) => {
      const grupo = document.createElement("div");
      grupo.className = "editorSecao";

      const nome = campo(
        "Nome da opção " + (indice + 1),
        "text",
        link.textContent.trim()
      );

      const destino = campo(
        "Endereço da opção " + (indice + 1),
        "text",
        link.getAttribute("href") || ""
      );

      grupo.append(nome.grupo, destino.grupo);

      grupo.appendChild(
        botao("Aplicar esta opção", () => {
          if (!nome.entrada.value.trim() || !destino.entrada.value.trim()) {
            aviso("Preencha o nome e o destino.");
            return;
          }

          link.textContent = nome.entrada.value.trim();
          link.setAttribute("href", destino.entrada.value.trim());

          alteracoesMenu = true;
          aviso("Opção alterada. Salve na nuvem.");
        })
      );

      grupo.appendChild(
        botao("↑ Mover para cima", () => {
          if (link.previousElementSibling) {
            nav.insertBefore(link, link.previousElementSibling);
            alteracoesMenu = true;
            aviso("Ordem alterada. Salve na nuvem.");
            abrirAba("menu");
          }
        })
      );

      grupo.appendChild(
        botao("↓ Mover para baixo", () => {
          if (link.nextElementSibling) {
            nav.insertBefore(link.nextElementSibling, link);
            alteracoesMenu = true;
            aviso("Ordem alterada. Salve na nuvem.");
            abrirAba("menu");
          }
        })
      );

      grupo.appendChild(
        botao("Excluir opção", () => {
          if (!confirm("Deseja excluir esta opção do menu?")) return;

          link.remove();
          alteracoesMenu = true;
          aviso("Opção removida. Salve na nuvem.");
          abrirAba("menu");
        })
      );

      painel.appendChild(grupo);
    });

    painel.appendChild(
      botao("➕ Adicionar opção ao menu", () => {
        const nome = prompt("Nome da nova opção:");
        if (!nome || !nome.trim()) return;

        const destino = prompt(
          "Destino da opção, por exemplo: pagina.html?secao=colegio"
        );

        if (!destino || !destino.trim()) return;

        const link = document.createElement("a");
        link.textContent = nome.trim();
        link.href = destino.trim();

        nav.appendChild(link);

        alteracoesMenu = true;
        aviso("Opção adicionada. Salve na nuvem.");
        abrirAba("menu");
      })
    );

    painel.appendChild(
      botao("Restaurar menu padrão", restaurarMenu)
    );

    painel.appendChild(
      botao("Adicionar submenu simples", () => {
        const nome = prompt("Nome da opção principal:");
        if (!nome || !nome.trim()) return;

        const nomeSub = prompt("Nome da subopção:");
        if (!nomeSub || !nomeSub.trim()) return;

        const destino = prompt("Destino da subopção:");
        if (!destino || !destino.trim()) return;

        const grupo = document.createElement("details");
        grupo.style.cssText =
          "display:inline-block;position:relative;padding:8px;";

        const resumo = document.createElement("summary");
        resumo.textContent = nome.trim();
        resumo.style.cursor = "pointer";

        const sub = document.createElement("a");
        sub.textContent = nomeSub.trim();
        sub.href = destino.trim();
        sub.style.cssText =
          "display:block;padding:10px;background:#fffaf0;";

        grupo.append(resumo, sub);
        nav.appendChild(grupo);

        alteracoesMenu = true;
        aviso("Submenu adicionado. Salve na nuvem.");
        abrirAba("menu");
      })
    );
  }

  function restaurarMenu() {
    if (!confirm("Restaurar os links padrão desta página?")) return;

    const nav = $("header.top nav");
    if (!nav) return;

    const padrao = [
      ["O Colégio", "pagina.html?secao=colegio"],
      ["Etapas de Ensino", "pagina.html?secao=ensino"],
      ["Proposta Pedagógica", "pagina.html?secao=proposta"],
      ["Notícias", "pagina.html?secao=noticias"],
      ["Matrículas", "pagina.html?secao=matriculas"],
      ["Fale Conosco", "pagina.html?secao=contato"]
    ];

    nav.replaceChildren();

    padrao.forEach(([nome, destino]) => {
      const a = document.createElement("a");
      a.textContent = nome;
      a.href = destino;
      nav.appendChild(a);
    });

    alteracoesMenu = true;
    aviso("Menu padrão restaurado. Salve na nuvem.");
    abrirAba("menu");
  }

  // 6. PÁGINA

  function abaPagina(painel) {
    painel.appendChild(
      botao("➕ Adicionar seção", adicionarSecao)
    );

    painel.appendChild(
      botao("➕ Adicionar parágrafo", () => adicionarBloco("p"))
    );

    const altura = campo(
      "Altura mínima do conteúdo (px)",
      "number",
      String($("main")?.offsetHeight || 600)
    );

    altura.entrada.min = "200";
    altura.entrada.max = "10000";

    painel.appendChild(altura.grupo);

    painel.appendChild(
      botao("Aplicar altura mínima", () => {
        const px = Number(altura.entrada.value);
        const principal = $("main");

        if (!principal || px < 200 || px > 10000) {
          aviso("Escolha uma altura entre 200 e 10000 pixels.");
          return;
        }

        principal.style.minHeight = px + "px";
        aviso("Altura alterada. Salve na nuvem.");
      })
    );

    painel.appendChild(
      botao("Criar página nova", () => {
        alert(
          "Para publicar uma nova página permanente, também será necessário " +
          "configurar o conteúdo da página e sua rota. Este botão não cria " +
          "arquivos novos no GitHub automaticamente."
        );
      })
    );

    const dica = document.createElement("p");
    dica.textContent =
      "Você pode aumentar o conteúdo adicionando seções. A altura cresce automaticamente quando o conteúdo aumenta.";
    painel.appendChild(dica);
  }

  // LIMPEZA DO HTML ANTES DE SALVAR

  function limparHTML(elemento) {
    const copia = elemento.cloneNode(true);

    copia.querySelectorAll(
      "#editorUniversal, .editorSelecionado"
    ).forEach(el => el.remove());

    copia.querySelectorAll("[contenteditable]").forEach(el => {
      el.removeAttribute("contenteditable");
    });

    copia.querySelectorAll("[style]").forEach(el => {
      if (el.style.outline) el.style.removeProperty("outline");
      if (!el.getAttribute("style")?.trim()) {
        el.removeAttribute("style");
      }
    });

    return copia.innerHTML;
  }

  // SALVAR NA NUVEM

  async function salvar() {
    const atuais = areas();
    const conteudo = {};

    for (const nome of ["header", "main", "footer"]) {
      const elemento = atuais[nome];
      if (!elemento) continue;

      conteudo[nome + "Html"] = limparHTML(elemento);
      conteudo[nome + "Style"] = elemento.getAttribute("style") || "";
    }

    aviso("Salvando alterações na nuvem...");

    const { error } = await db
      .from("site_edits")
      .upsert({
        id: PAGE_ID,
        content: conteudo,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Erro ao salvar:", error);

      aviso("Não foi possível salvar. Verifique as permissões do Supabase.");

      alert(
        "Erro ao salvar as alterações. Verifique se a tabela site_edits " +
        "permite gravações para este site."
      );

      return;
    }

    alteracoesMenu = false;

    aviso(
      "Alterações salvas na nuvem. Atualize a página para conferir."
    );

    alert(
      "Alterações salvas! Elas estarão disponíveis para os visitantes " +
      "quando a página carregar os dados atualizados."
    );
  }

  // CARREGAR AS ALTERAÇÕES SALVAS

  async function carregar() {
    aviso("Carregando alterações salvas...");

    const { data, error } = await db
      .from("site_edits")
      .select("content, updated_at")
      .eq("id", PAGE_ID)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar:", error);
      aviso("Não foi possível carregar os dados salvos.");
      return;
    }

    if (!data?.content) {
      aviso("Editor pronto. Nenhuma alteração anterior encontrada.");
      return;
    }

    const conteudo = data.content;
    const atuais = areas();

    for (const nome of ["header", "main", "footer"]) {
      const elemento = atuais[nome];

      if (!elemento) continue;

      const html = conteudo[nome + "Html"];
      const estilo = conteudo[nome + "Style"];

      if (typeof html === "string") {
        elemento.innerHTML = html;
      }

      if (typeof estilo === "string") {
        if (estilo) elemento.setAttribute("style", estilo);
        else elemento.removeAttribute("style");
      }
    }

    aviso(
      "Alterações carregadas. Última atualização: " +
      new Date(data.updated_at).toLocaleString("pt-BR")
    );
  }

  criarPainel();
  await carregar();

})();
