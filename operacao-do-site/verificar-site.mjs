import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const issues = [];
const requiredFiles = [
  "index.html",
  "pagina.html",
  "paginas.js",
  "style.css",
  "editor.js",
  "scripts/diagnostico-site.mjs",
];

function read(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    issues.push(`Arquivo necessário ausente: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    issues.push(`Arquivo necessário ausente: ${file}`);
  }
}

const html = read("index.html");
const css = read("style.css");

if (html) {
  const cards = (html.match(/class=["'][^"']*\bdestaque\b[^"']*["']/g) || []).length;
  if (cards !== 8) {
    issues.push(`Esperadas 8 caixas informativas na página inicial; encontradas ${cards}.`);
  }
  if (!html.includes("destaques-revelados")) {
    issues.push("A seção das caixas informativas não foi encontrada no index.html.");
  }
  if (!html.includes("IntersectionObserver")) {
    issues.push("O efeito de surgimento ao rolar não foi encontrado no index.html.");
  }
  if (html.indexOf("IntersectionObserver") > html.lastIndexOf("</body>")) {
    issues.push("O script de animação aparece depois do fechamento de body.");
  }
}

if (css) {
  for (const selector of [
    "body.home .destaques-revelados",
    "body.home .destaque",
    "body.home .destaque.lado-esquerdo",
    "body.home .destaque.lado-direito",
  ]) {
    if (!css.includes(selector)) {
      issues.push(`Estilo necessário não encontrado em style.css: ${selector}`);
    }
  }
}

console.log("VERIFICAÇÃO DE INTEGRIDADE DO SITE");
console.log(`Repositório: ${ROOT}`);
console.log("1/2 — Conferindo arquivos e conexão entre caixas, estilos e animação.");

const diagnostic = spawnSync(process.execPath, [path.join(ROOT, "scripts/diagnostico-site.mjs")], {
  cwd: ROOT,
  env: process.env,
  encoding: "utf8",
  timeout: 30000,
});

if (diagnostic.stdout) process.stdout.write(diagnostic.stdout);
if (diagnostic.stderr) process.stderr.write(diagnostic.stderr);
if (diagnostic.error) {
  issues.push(`Não foi possível executar o diagnóstico existente: ${diagnostic.error.message}`);
} else if (diagnostic.status !== 0) {
  issues.push("O diagnóstico existente encontrou problemas no repositório ou no site publicado.");
}

if (issues.length) {
  console.error(`\nVERIFICAÇÃO COM ${issues.length} PROBLEMA(S):`);
  for (const issue of issues) console.error(`- ${issue}`);
  console.error("\nNenhum arquivo do site foi corrigido automaticamente. Corrija cada problema de forma dirigida e execute esta verificação novamente.");
  process.exitCode = 1;
} else {
  console.log("\nVerificação concluída sem problemas detectados.");
  console.log("Nota: isso não garante ausência de erros visuais, testes reais de interação ou funcionamento do editor/serviços externos.");
}
