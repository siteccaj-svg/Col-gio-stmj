```javascript
/* EDITOR UNIVERSAL — COLÉGIO SANTA TERESINHA */

(async function () {
  "use strict";

  const SUPABASE_URL =
    "https://qmqmnbdwrbilrzmqghfk.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_zr1KBIxXRPeMZXiOF81Zaw_Jcj_IS0V";

  const PAGE_ID = location.pathname.endsWith("pagina.html")
    ? "pagina-" +
      (new URLSearchParams(location.search).get("secao") || "colegio")
    : "home";

  if (!window.supabase) {
    console.error("Biblioteca do Supabase não carregada.");
    return;
  }

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  let editando = false;
  let selecionado = null;
  let historico = [];
  let indiceHistorico = -1;

  const estilo = document.createElement("style");

  estilo.textContent = `
    #editorUniversal, #editorUniversal * {
      box-sizing: border-box;
    }

    #editorUniversal button,
    #editorUniversal select,
    #editorUniversal input {
      font: 13px Arial, sans-serif;
    }

    #editorUniversal button {
      cursor: pointer;
    }

    .editorUniversalSelecionado {
      outline: 2px dashed #d6a63b !important;
      outline-offset: 3px;
    }

    .editorUniversalForma {
      min-width: 40px;
      min-height: 40px;
      display: inline-block;
      margin: 8px;
    }
  `;

  document.head.appendChild(estilo);

  function getAreas() {
    return {
      header: document.querySelector("header.top"),
      main:
        document.querySelector("main") ||
        document.querySelector("main, .conteudo, #conteudo"),
      footer: document.querySelector("footer")
    };
  }

  function mensagem(texto) {
    const status = document.getElementById(
      "editorUniversalStatus"
    );

    if (status) status.textContent = texto;
  }

  function limparHTML(elemento) {
    const copia = elemento.cloneNode(true);

    copia.querySelectorAll(
      "#editorUniversal, .editorUniversalSelecionado"
    ).forEach(el => {
      el.classList.remove("editorUniversalSelecionado");
    });

    copia.querySelectorAll("[contenteditable]").forEach(el => {
      el.removeAttribute("contenteditable");
    });

    copia.querySelectorAll("*").forEach(el => {
      el.style.outline = "";
    });

    return copia.innerHTML;
  }

  function registrarHistorico() {
    const areas = getAreas();

    const estado = {};

    Object.entries(areas).forEach(([nome, elemento]) => {
      if (elemento) {
        estado[nome] = elemento.innerHTML;
      }
    });

    historico = historico.slice(0, indiceHistorico + 1);
    historico.push(estado);

    if (historico.length > 30) historico.shift();

    indiceHistorico = historico.length - 1;
  }

  function restaurarHistorico(indice) {
    if (indice < 0 || indice >= historico.length) return;

    const areas = getAreas();
    const estado = historico[indice];

    Object.entries(estado).forEach(([nome, html]) => {
      if (areas[nome]) areas[nome].innerHTML = html;
    });

    indiceHistorico = indice;
    selecionado = null;

    mensagem("Histórico restaurado. Salve para publicar a alteração.");
  }

  function desmarcar() {
    document.querySelectorAll(
      ".editorUniversalSelecionado"
    ).forEach(el => {
      el.classList.remove("editorUniversalSelecionado");
    });

    selecionado = null;
  }

  function selecionar(elemento) {
    if (!elemento || elemento.closest("#editorUniversal")) return;

    desmarcar();

    selecionado = elemento;

    elemento.classList.add("editorUniversalSelecionado");

    const largura = document.getElementById("editorLargura");
    const altura = document.getElementById("editorAltura");
    const cor = document.getElementById("editorCor");
    const fonte = document.getElementById("editorFonte");
    const tamanho = document.getElementById("editorTamanho");

    if (largura) {
      largura.value = parseInt(getComputedStyle(elemento).width) || 100;
    }

    if (altura) {
      altura.value = parseInt(getComputedStyle(elemento).height) || 40;
    }

    if (cor) {
      cor.value = corHex(getComputedStyle(elemento).color);
    }

    if (fonte) {
      fonte.value = getComputedStyle(elemento).fontFamily
        .split(",")[0]
        .replace(/['"]/g, "");
    }

    if (tamanho) {
      tamanho.value =
        parseInt(getComputedStyle(elemento).fontSize) || 16;
    }

    mensagem("Elemento selecionado para edição.");
  }

  function corHex(cor) {
    const numeros = cor.match(/\d+/g);

    if (!numeros || numeros.length < 3) return "#000000";

    return "#" + numeros.slice(0, 3)
      .map(n => Number(n).toString(16).padStart(2, "0"))
      .join("");
  }

  async function carregar() {
    mensagem("Carregando alterações salvas...");

    const { data, error } = await db
      .from("site_edits")
      .select("content, updated_at")
      .eq("id", PAGE_ID)
      .maybeSingle();

    if (error) {
      console.error(error);
      mensagem("Não foi possível carregar as alterações.");
      return;
    }

    if (!data || !data.content) {
      registrarHistorico();
      mensagem("Página pronta para edição.");
      return;
    }

    const areas = getAreas();
    const conteudo = data.content;

    ["header", "main", "footer"].forEach(nome => {
      const elemento = areas[nome];

      if (!elemento) return;

      if (typeof conteudo[nome + "Html"] === "string") {
        elemento.innerHTML = conteudo[nome + "Html"];
      }

      if (typeof conteudo[nome + "Style"] === "string") {
        if (conteudo[nome + "Style"]) {
          elemento.setAttribute("style", conteudo[nome + "Style"]);
        } else {
          elemento.removeAttribute("style");
        }
      }
    });

    registrarHistorico();

    mensagem(
      "Alterações carregadas. Última atualização: " +
      new Date(data.updated_at).toLocaleString("pt-BR")
    );
  }

  async function salvar() {
    const areas = getAreas();
    const conteudo = {};

    ["header", "main", "footer"].forEach(nome => {
      const elemento = areas[nome];

      if (!elemento) return;

      conteudo[nome + "Html"] = limparHTML(elemento);
      conteudo[nome + "Style"] = elemento.getAttribute("style") || "";
    });

    mensagem("Salvando na nuvem...");

    const { error } = await db
      .from("site_edits")
      .upsert({
        id: PAGE_ID,
        content: conteudo,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(error);

      mensagem("Erro ao salvar na nuvem.");

      alert(
        "Não foi possível salvar. Confira as permissões no Supabase."
      );

      return;
    }

    mensagem("Alterações salvas na nuvem!");
    alert("Alterações salvas com sucesso!");
  }

  function adicionarTexto() {
    const areas = getAreas();
    const destino = areas.main || areas.header;

    if (!destino) {
      alert("Não encontrei a área da página para inserir o texto.");
      return;
    }

    const caixa = document.createElement("p");

    caixa.textContent = "Digite seu novo texto aqui.";
    caixa.style.cssText =
      "min-height:30px;padding:8px;margin:10px 0;";

    destino.appendChild(caixa);

    selecionar(caixa);
    caixa.setAttribute("contenteditable", "true");
    caixa.focus();

    registrarHistorico();

    mensagem("Novo texto adicionado.");
  }

  function adicionarImagem() {
    const entrada = document.createElement("input");

    entrada.type = "url";
    entrada.placeholder = "Cole o endereço da imagem";
    entrada.style.cssText =
      "width:100%;padding:8px;margin-top:8px;";

    const painel = document.getElementById("editorUniversal");
    painel.appendChild(entrada);

    entrada.focus();

    entrada.addEventListener("keydown", evento => {
      if (evento.key !== "Enter") return;

      const url = entrada.value.trim();

      if (!/^https?:\/\//i.test(url)) {
        alert("Informe um endereço de imagem que comece com https://");
        return;
      }

      const areas = getAreas();
      const destino = areas.main || areas.header;

      if (!destino) return;

      const imagem = document.createElement("img");

      imagem.src = url;
      imagem.alt = "Imagem adicionada pelo editor";
      imagem.style.cssText =
        "display:block;max-width:100%;width:300px;height:auto;margin:12px 0;";

      imagem.onerror = () => {
        alert("Não foi possível carregar essa imagem. Verifique o endereço.");
        imagem.remove();
      };

      destino.appendChild(imagem);
      selecionar(imagem);

      entrada.remove();
      registrarHistorico();

      mensagem("Imagem adicionada. Salve para publicar.");
    });
  }

  function adicionarForma(tipo) {
    const areas = getAreas();
    const destino = areas.main || areas.header;

    if (!destino) return;

    const forma = document.createElement("div");

    forma.className = "editorUniversalForma";
    forma.style.width = "120px";
    forma.style.height = "70px";
    forma.style.background = "#f5d77e";
    forma.style.border = "2px solid #c9a44c";

    if (tipo === "círculo") {
      forma.style.borderRadius = "50%";
    }

    destino.appendChild(forma);

    selecionar(forma);
    registrarHistorico();

    mensagem("Forma adicionada.");
  }

  function aplicarEstilo(propriedade, valor) {
    if (!selecionado) {
      alert("Primeiro selecione um elemento da página.");
      return;
    }

    selecionado.style[propriedade] = valor;
    registrarHistorico();
  }

  function criarEditor() {
    const painel = document.createElement("div");

    painel.id = "editorUniversal";

    painel.style.cssText = `
      position:fixed;
      right:12px;
      bottom:12px;
      z-index:999999;
      width:290px;
      max-height:85vh;
      overflow:auto;
      padding:14px;
      background:#55351f;
      color:#fff5d7;
      border:2px solid #c9a44c;
      border-radius:12px;
      box-shadow:0 4px 18px #0005;
      font:14px Arial,sans-serif;
    `;

    painel.innerHTML = `
      <strong style="display:block;font-size:17px;margin-bottom:10px">
        ✨ Editor do Colégio
      </strong>

      <button id="editorAtivar">✏️ Ativar edição</button>
      <button id="editorTexto">📝 Adicionar texto</button>
      <button id="editorImagem">🖼️ Adicionar imagem</button>

      <label style="display:block;margin-top:10px">Adicionar forma</label>
      <button id="editorRetangulo">▭ Retângulo</button>
      <button id="editorCirculo">⚪ Círculo</button>

      <hr style="border-color:#c9a44c;margin:12px 0">

      <label>Cor do texto</label>
      <input id="editorCor" type="color" value="#000000">

      <label>Cor de fundo</label>
      <input id="editorFundo" type="color" value="#ffffff">

      <label>Fonte</label>
      <select id="editorFonte">
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
        <option value="Verdana">Verdana</option>
        <option value="Tahoma">Tahoma</option>
        <option value="Times New Roman">Times New Roman</option>
      </select>

      <label>Tamanho da letra (px)</label>
      <input id="editorTamanho" type="number" min="8" max="120" value="16">

      <button id="editorNegrito">B — Negrito</button>
      <button id="editorEsquerda">Alinhar à esquerda</button>
      <button id="editorCentro">Centralizar</button>
      <button id="editorDireita">Alinhar à direita</button>

      <hr style="border-color:#c9a44c;margin:12px 0">

      <label>Largura do elemento (px)</label>
      <input id="editorLargura" type="number" min="10" max="3000" value="300">

      <label>Altura do elemento (px)</label>
      <input id="editorAltura" type="number" min="10" max="3000" value="100">

      <button id="editorAplicarTamanho">Aplicar tamanho ao elemento</button>

      <hr style="border-color:#c9a44c;margin:12px 0">

      <label>Largura da página (px)</label>
      <input id="editorPaginaLargura" type="number" min="320" max="3000" value="1200">

      <label>Altura mínima da página (px)</label>
      <input id="editorPaginaAltura" type="number" min="300" max="10000" value="1000">

      <button id="editorAplicarPagina">Aplicar tamanho da página</button>

      <hr style="border-color:#c9a44c;margin:12px 0">

      <button id="editorMover">↔️ Mover elemento com o mouse</button>
      <button id="editorExcluir">🗑️ Excluir selecionado</button>
      <button id="editorDesfazer">↩️ Desfazer</button>
      <button id="editorRefazer">↪️ Refazer</button>
      <button id="editorSalvar">☁️ Salvar na nuvem</button>
      <button id="editorConcluir">Concluir edição</button>

      <div id="editorUniversalStatus"
        role="status"
        style="margin-top:10px;line-height:1.4">
        Preparando editor...
      </div>
    `;

    document.body.appendChild(painel);

    painel.querySelectorAll("button").forEach(botao => {
      botao.style.cssText = `
        display:block;
        width:100%;
        margin-top:6px;
        padding:8px;
        border:0;
        border-radius:5px;
        background:#f5d77e;
        color:#382719;
        cursor:pointer;
      `;
    });

    painel.querySelectorAll("label").forEach(label => {
      label.style.cssText =
        "display:block;margin-top:8px;font-size:12px;";
    });

    painel.querySelectorAll("input,select").forEach(campo => {
      campo.style.cssText =
        "width:100%;margin-top:4px;padding:6px;border-radius:4px;";
    });

    document.getElementById("editorAtivar").onclick = () => {
      editando = !editando;

      mensagem(
        editando
          ? "Edição ativada. Clique em um elemento da página."
          : "Edição desativada."
      );
    };

    document.getElementById("editorTexto").onclick = adicionarTexto;
    document.getElementById("editorImagem").onclick = adicionarImagem;

    document.getElementById("editorRetangulo").onclick =
      () => adicionarForma("retângulo");

    document.getElementById("editorCirculo").onclick =
      () => adicionarForma("círculo");

    document.getElementById("editorCor").oninput = evento =>
      aplicarEstilo("color", evento.target.value);

    document.getElementById("editorFundo").oninput = evento =>
      aplicarEstilo("backgroundColor", evento.target.value);

    document.getElementById("editorFonte").onchange = evento =>
      aplicarEstilo("fontFamily", evento.target.value);

    document.getElementById("editorTamanho").onchange = evento =>
      aplicarEstilo("fontSize", evento.target.value + "px");

    document.getElementById("editorNegrito").onclick = () => {
      if (!selecionado) {
        alert("Selecione um elemento primeiro.");
        return;
      }

      const atual = getComputedStyle(selecionado).fontWeight;

      aplicarEstilo(
        "fontWeight",
        Number(atual) >= 600 || atual === "bold" ? "normal" : "bold"
      );
    };

    document.getElementById("editorEsquerda").onclick = () =>
      aplicarEstilo("textAlign", "left");

    document.getElementById("editorCentro").onclick = () =>
      aplicarEstilo("textAlign", "center");

    document.getElementById("editorDireita").onclick = () =>
      aplicarEstilo("textAlign", "right");

    document.getElementById("editorAplicarTamanho").onclick = () => {
      if (!selecionado) {
        alert("Selecione um elemento primeiro.");
        return;
      }

      const largura = Number(
        document.getElementById("editorLargura").value
      );

      const altura = Number(
        document.getElementById("editorAltura").value
      );

      if (largura > 0) selecionado.style.width = largura + "px";
      if (altura > 0) selecionado.style.height = altura + "px";

      registrarHistorico();
      mensagem("Tamanho do elemento atualizado.");
    };

    document.getElementById("editorAplicarPagina").onclick = () => {
      const largura = Number(
        document.getElementById("editorPaginaLargura").value
      );

      const altura = Number(
        document.getElementById("editorPaginaAltura").value
      );

      const areas = getAreas();
      const destino = areas.main || document.body;

      if (largura >= 320 && largura <= 3000) {
        destino.style.width = largura + "px";
        destino.style.maxWidth = "100%";
        destino.style.marginLeft = "auto";
        destino.style.marginRight = "auto";
      }

      if (altura >= 300 && altura <= 10000) {
        destino.style.minHeight = altura + "px";
      }

      registrarHistorico();

      mensagem("Tamanho da área principal atualizado.");
    };

    document.getElementById("editorMover").onclick = () => {
      if (!selecionado) {
        alert("Primeiro selecione um elemento.");
        return;
      }

      selecionado.style.position = "relative";
      selecionado.style.left = "0px";
      selecionado.style.top = "0px";

      let arrastando = false;
      let x = 0;
      let y = 0;

      selecionado.style.cursor = "move";

      selecionado.onpointerdown = evento => {
        if (evento.target.closest("#editorUniversal")) return;

        arrastando = true;
        x = evento.clientX;
        y = evento.clientY;

        selecionado.setPointerCapture?.(evento.pointerId);
      };

      selecionado.onpointermove = evento => {
        if (!arrastando) return;

        const esquerda =
          parseFloat(selecionado.style.left || "0") +
          evento.clientX - x;

        const topo =
          parseFloat(selecionado.style.top || "0") +
          evento.clientY - y;

        selecionado.style.left = esquerda + "px";
        selecionado.style.top = topo + "px";

        x = evento.clientX;
        y = evento.clientY;
      };

      selecionado.onpointerup = () => {
        arrastando = false;
        registrarHistorico();
      };

      mensagem("Arraste o elemento com o mouse. Clique nele para terminar.");
    };

    document.getElementById("editorExcluir").onclick = () => {
      if (!selecionado) {
        alert("Selecione um elemento primeiro.");
        return;
      }

      if (!confirm("Deseja excluir o elemento selecionado?")) return;

      selecionado.remove();
      selecionado = null;

      registrarHistorico();
      mensagem("Elemento excluído. Salve para publicar.");
    };

    document.getElementById("editorDesfazer").onclick = () =>
      restaurarHistorico(indiceHistorico - 1);

    document.getElementById("editorRefazer").onclick = () =>
      restaurarHistorico(indiceHistorico + 1);

    document.getElementById("editorSalvar").onclick = salvar;

    document.getElementById("editorConcluir").onclick = () => {
      editando = false;

      document.querySelectorAll("[contenteditable]").forEach(el => {
        el.removeAttribute("contenteditable");
      });

      mensagem("Edição concluída. Clique em Salvar na nuvem.");
    };
  }

  document.addEventListener("click", evento => {
    if (!editando) return;
    if (evento.target.closest("#editorUniversal")) return;

    const area = evento.target.closest(
      "header.top, main, footer, .conteudo, #conteudo"
    );

    if (!area) return;

    evento.preventDefault();
    evento.stopPropagation();

    selecionar(evento.target);
  }, true);

  document.addEventListener("dblclick", evento => {
    if (!editando) return;
    if (evento.target.closest("#editorUniversal")) return;

    const elemento = evento.target;

    if (!elemento.closest("header.top, main, footer, .conteudo, #conteudo")) {
      return;
    }

    elemento.setAttribute("contenteditable", "true");
    elemento.focus();

    mensagem("Edite o texto diretamente. Salve quando terminar.");
  }, true);

  criarEditor();
  await carregar();

})();
```
