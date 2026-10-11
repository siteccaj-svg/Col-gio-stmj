/* EDITOR UNIVERSAL — COLÉGIO SANTA TERESINHA */

(async function () {
  "use strict";

  const SUPABASE_URL =
    "https://qmqmnbdwrbilrzmqghfk.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_zr1KBIxXRPeMZXiOF81Zaw_Jcj_IS0V";

  const PAGE_ID = location.pathname.endsWith("pagina.html")
    ? "pagina-" + (new URLSearchParams(location.search).get("secao") || "colegio")
    : "home";

  // Aguarda a biblioteca do Supabase
  if (!window.supabase) {
    console.error("Biblioteca do Supabase não foi carregada.");
    return;
  }

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  // Elementos que poderão ter seu conteúdo compartilhado
  function getAreas() {
    return {
      header: document.querySelector("header.top"),
      main: document.querySelector("main"),
      footer: document.querySelector("footer")
    };
  }

  // Evita salvar o próprio painel de edição
  function limparHTML(elemento) {
    const copia = elemento.cloneNode(true);

    copia.querySelectorAll(
      "#editorUniversal, .editorUniversalSelecionado"
    ).forEach(el => el.remove());

    copia.querySelectorAll("[contenteditable]").forEach(el => {
      el.removeAttribute("contenteditable");
    });

    return copia.innerHTML;
  }

  function mensagem(texto) {
    const status = document.getElementById("editorUniversalStatus");
    if (status) status.textContent = texto;
  }

  // Carrega as alterações que já foram salvas na nuvem
  async function carregar() {
    mensagem("Carregando alterações salvas...");

    const { data, error } = await db
      .from("site_edits")
      .select("content, updated_at")
      .eq("id", PAGE_ID)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar:", error);
      mensagem("Não foi possível carregar as alterações.");
      return;
    }

    if (!data || !data.content) {
      mensagem("Página pronta. Ainda não há alterações salvas.");
      return;
    }

    const areas = getAreas();
    const conteudo = data.content;

    if (areas.header && typeof conteudo.headerHtml === "string") {
      areas.header.innerHTML = conteudo.headerHtml;
    }

    if (areas.main && typeof conteudo.mainHtml === "string") {
      areas.main.innerHTML = conteudo.mainHtml;
    }

    if (areas.footer && typeof conteudo.footerHtml === "string") {
      areas.footer.innerHTML = conteudo.footerHtml;
    }

    for (const nome of ["header", "main", "footer"]) {
      const elemento = areas[nome];
      const estilo = conteudo[nome + "Style"];

      if (elemento && typeof estilo === "string") {
        if (estilo) {
          elemento.setAttribute("style", estilo);
        } else {
          elemento.removeAttribute("style");
        }
      }
    }

    mensagem(
      "Alterações carregadas da nuvem. Última atualização: " +
      new Date(data.updated_at).toLocaleString("pt-BR")
    );
  }

  // Salva o conteúdo da página na nuvem
  async function salvar() {
    const areas = getAreas();

    const conteudo = {};

    for (const nome of ["header", "main", "footer"]) {
      const elemento = areas[nome];

      if (!elemento) continue;

      conteudo[nome + "Html"] = limparHTML(elemento);
      conteudo[nome + "Style"] = elemento.getAttribute("style") || "";
    }

    mensagem("Salvando na nuvem...");

    const { error } = await db
      .from("site_edits")
      .upsert({
        id: PAGE_ID,
        content: conteudo,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Erro ao salvar:", error);
      mensagem(
        "Erro ao salvar. Verifique as permissões da tabela no Supabase."
      );
      alert(
        "Não foi possível salvar na nuvem. " +
        "A tabela pode estar exigindo autorização para gravar."
      );
      return;
    }

    mensagem("Salvo na nuvem! Todos os visitantes verão a alteração.");
    alert("Alterações salvas na nuvem!");
  }

  // Cria um painel simples para editar textos e salvar
  function criarEditor() {
    if (document.getElementById("editorUniversal")) return;

    const painel = document.createElement("div");
    painel.id = "editorUniversal";

    painel.style.cssText = `
      position:fixed;
      right:16px;
      bottom:16px;
      z-index:999999;
      background:#55351f;
      color:#fff5d7;
      padding:14px;
      border:2px solid #c9a44c;
      border-radius:10px;
      box-shadow:0 4px 18px #0004;
      font:14px Arial,sans-serif;
      max-width:280px;
    `;

    painel.innerHTML = `
      <strong style="display:block;margin-bottom:8px">
        Editor do Colégio
      </strong>

      <button id="editorUniversalAtivar" type="button">
        ✏️ Ativar edição de textos
      </button>

      <button id="editorUniversalSalvar" type="button">
        ☁️ Salvar na nuvem
      </button>

      <button id="editorUniversalDesativar" type="button">
        Concluir edição
      </button>

      <div id="editorUniversalStatus"
        role="status"
        style="margin-top:9px;line-height:1.4">
        Preparando editor...
      </div>
    `;

    document.body.appendChild(painel);

    const estiloBotoes = painel.querySelectorAll("button");

    estiloBotoes.forEach(botao => {
      botao.style.cssText = `
        display:block;
        width:100%;
        margin-top:7px;
        padding:9px;
        border:0;
        border-radius:5px;
        cursor:pointer;
        background:#f5d77e;
        color:#382719;
      `;
    });

    let editando = false;

    document.getElementById("editorUniversalAtivar")
      .addEventListener("click", function () {
        editando = true;

        const areas = getAreas();

        Object.values(areas).forEach(area => {
          if (!area) return;

          area.querySelectorAll(
            "h1,h2,h3,h4,p,a,b,strong,small,li,blockquote"
          ).forEach(elemento => {
            if (elemento.closest("#editorUniversal")) return;

            elemento.setAttribute("contenteditable", "true");
            elemento.style.outline = "1px dashed #c9a44c";
          });
        });

        mensagem(
          "Edição ativada. Clique em um texto para modificá-lo."
        );
      });

    document.getElementById("editorUniversalSalvar")
      .addEventListener("click", salvar);

    document.getElementById("editorUniversalDesativar")
      .addEventListener("click", function () {
        editando = false;

        document.querySelectorAll("[contenteditable]").forEach(el => {
          el.removeAttribute("contenteditable");
          el.style.outline = "";
        });

        mensagem("Edição concluída. Lembre-se de salvar na nuvem.");
      });
  }

  criarEditor();
  await carregar();

})();
