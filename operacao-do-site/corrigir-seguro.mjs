import fs from "node:fs";

const cssPath = "style.css";
const htmlPath = "index.html";
const cssMarker = "/* CAIXAS INFORMATIVAS QUE SURGEM AO ROLAR — PÁGINA INICIAL */";
const scriptMarker = "  <!-- PASSO 3 — ANIMAÇÃO DAS CAIXAS INFORMATIVAS -->";
const canonicalCss = "/* CAIXAS INFORMATIVAS QUE SURGEM AO ROLAR — PÁGINA INICIAL */\nbody.home .destaques-revelados {\n  position: relative;\n  overflow: hidden;\n  padding: 84px 8% 92px;\n  color: #39271c;\n  background: linear-gradient(180deg, #fbf8f1 0%, #f6efdf 100%);\n}\nbody.home .destaques-cabecalho {\n  max-width: 760px;\n  margin: 0 auto 58px;\n  text-align: center;\n}\nbody.home .destaques-cabecalho h2 {\n  margin: 0 0 16px;\n  color: #4b2918;\n  font: 500 clamp(30px, 3.4vw, 43px)/1.18 'Playfair Display', serif;\n}\nbody.home .destaques-cabecalho h2 em {\n  color: #a77a35;\n  font-style: normal;\n}\nbody.home .destaques-cabecalho > p:last-child {\n  margin: 0;\n  color: #79634c;\n  font-size: 14px;\n  line-height: 1.8;\n}\nbody.home .destaques-lista {\n  position: relative;\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 46px minmax(0, 1fr);\n  align-items: stretch;\n  gap: 22px 18px;\n  max-width: 1080px;\n  margin: 0 auto;\n}\nbody.home .destaques-lista::before {\n  content: \"\";\n  position: absolute;\n  z-index: 0;\n  top: 12px;\n  bottom: 12px;\n  left: calc(50% - 1px);\n  width: 2px;\n  background: linear-gradient(180deg, rgba(199,156,84,.12), #c79c54 18%, #c79c54 82%, rgba(199,156,84,.12));\n}\nbody.home .destaque {\n  position: relative;\n  z-index: 1;\n  display: flex;\n  align-items: flex-start;\n  gap: 17px;\n  min-width: 0;\n  padding: 25px 24px;\n  border: 1px solid rgba(167,122,53,.22);\n  border-radius: 8px;\n  background: rgba(255,253,248,.96);\n  box-shadow: 0 8px 24px rgba(57,39,28,.055);\n  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;\n}\nbody.home .destaque:hover {\n  transform: translateY(-3px);\n  border-color: rgba(167,122,53,.55);\n  box-shadow: 0 12px 28px rgba(57,39,28,.09);\n}\nbody.home .destaque.lado-esquerdo { grid-column: 1; }\nbody.home .destaque.lado-direito { grid-column: 3; }\nbody.home .destaque-numero {\n  display: grid;\n  flex: 0 0 42px;\n  width: 42px;\n  height: 42px;\n  place-items: center;\n  border: 1px solid rgba(199,156,84,.55);\n  border-radius: 50%;\n  color: #8b6227;\n  background: #f8efdc;\n  font-size: 12px;\n  font-weight: 700;\n  letter-spacing: .04em;\n}\nbody.home .destaque h3 {\n  margin: 1px 0 8px;\n  color: #4b2918;\n  font: 600 20px/1.3 'Playfair Display', serif;\n}\nbody.home .destaque p {\n  margin: 0;\n  color: #79634c;\n  font-size: 13px;\n  line-height: 1.8;\n}\n@media (max-width: 760px) {\n  body.home .destaques-revelados {\n    padding: 58px 6% 64px;\n  }\n  body.home .destaques-cabecalho {\n    margin-bottom: 34px;\n  }\n  body.home .destaques-cabecalho h2 {\n    font-size: 31px;\n  }\n  body.home .destaques-lista {\n    grid-template-columns: 1fr;\n    gap: 14px;\n  }\n  body.home .destaques-lista::before {\n    display: none;\n  }\n  body.home .destaque.lado-esquerdo,\n  body.home .destaque.lado-direito {\n    grid-column: 1;\n  }\n  body.home .destaque {\n    padding: 21px 18px;\n    gap: 13px;\n  }\n  body.home .destaque h3 {\n    font-size: 18px;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  body.home .destaque {\n    transition: none;\n  }\n}";
const canonicalScript = "  <!-- PASSO 3 — ANIMAÇÃO DAS CAIXAS INFORMATIVAS -->\n  <script>\n  document.addEventListener(\"DOMContentLoaded\", function () {\n    const caixas = document.querySelectorAll(\"body.home .destaque\");\n    if (!caixas.length) return;\n\n    if (!(\"IntersectionObserver\" in window)) {\n      caixas.forEach(function (caixa) {\n        caixa.style.opacity = \"1\";\n        caixa.style.transform = \"translateY(0)\";\n      });\n      return;\n    }\n\n    caixas.forEach(function (caixa, indice) {\n      caixa.style.opacity = \"0\";\n      caixa.style.transform = \"translateY(24px)\";\n      caixa.style.transition =\n        \"opacity 0.7s ease, transform 0.7s ease\";\n      caixa.style.transitionDelay = (indice % 2) * 0.12 + \"s\";\n    });\n\n    const observador = new IntersectionObserver(\n      function (entradas, observador) {\n        entradas.forEach(function (entrada) {\n          if (entrada.isIntersecting) {\n            entrada.target.style.opacity = \"1\";\n            entrada.target.style.transform = \"translateY(0)\";\n            observador.unobserve(entrada.target);\n          }\n        });\n      },\n      { threshold: 0.15 }\n    );\n\n    caixas.forEach(function (caixa) {\n      observador.observe(caixa);\n    });\n  });\n  </script>";

let css = fs.readFileSync(cssPath, "utf8");
let html = fs.readFileSync(htmlPath, "utf8");
const changes = [];

const cssOccurrences = css.split(cssMarker).length - 1;
if (cssOccurrences > 1) {
  console.error("Correção interrompida: o bloco de CSS parece duplicado. Nenhum arquivo foi alterado.");
  process.exit(1);
}
if (cssOccurrences === 0) {
  css = css.trimEnd() + "\n\n" + canonicalCss + "\n";
  changes.push("Restaurado o bloco conhecido de estilos das caixas informativas em style.css.");
}

const scriptOccurrences = html.split(scriptMarker).length - 1;
if (scriptOccurrences > 1) {
  console.error("Correção interrompida: o bloco de JavaScript parece duplicado. Nenhum arquivo foi alterado.");
  process.exit(1);
}
if (scriptOccurrences === 0) {
  const bodyEnd = html.lastIndexOf("</body>");
  if (bodyEnd < 0 || !html.includes("destaques-revelados")) {
    console.error("Correção interrompida: estrutura do index.html não corresponde ao esperado. Nenhum arquivo foi alterado.");
    process.exit(1);
  }
  html = html.slice(0, bodyEnd).trimEnd() + "\n\n" + canonicalScript + "\n\n" + html.slice(bodyEnd);
  changes.push("Restaurado o bloco conhecido da animação em index.html.");
}

if (!changes.length) {
  console.log("Nenhuma correção necessária: os blocos monitorados estão presentes.");
} else {
  // Validate the intended markers before writing either file.
  if (!css.includes(cssMarker) || !html.includes(scriptMarker) || html.indexOf(scriptMarker) > html.lastIndexOf("</body>")) {
    console.error("Validação posterior falhou. Nenhum arquivo foi gravado.");
    process.exit(1);
  }
  if (changes.some(change => change.includes("style.css"))) fs.writeFileSync(cssPath, css);
  if (changes.some(change => change.includes("index.html"))) fs.writeFileSync(htmlPath, html);
  for (const change of changes) console.log("- " + change);
  console.log("Correção limitada concluída. Revise o diff e execute os testes antes de publicar.");
}
