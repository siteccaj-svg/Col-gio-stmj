import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE_URL = (process.env.SITE_URL || "https://siteccaj-svg.github.io/Col-gio-stmj/").replace(/\/$/, "") + "/";
const problems = [];
const checked = [];
const skipExternalSchemes = /^(?:https?:|mailto:|tel:|javascript:|data:|blob:|#)/i;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".github"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.html?$/i.test(entry.name)) checked.push(full);
  }
}

function existsLocalReference(raw, sourceFile) {
  const clean = raw.split("#")[0].split("?")[0].trim();
  if (!clean || skipExternalSchemes.test(clean) || clean.startsWith("//")) return true;
  let decoded;
  try { decoded = decodeURIComponent(clean); } catch { decoded = clean; }
  const base = decoded.startsWith("/")
    ? path.join(ROOT, decoded.replace(/^\/+/, ""))
    : path.resolve(path.dirname(sourceFile), decoded);
  const candidates = [base, path.join(base, "index.html")];
  return candidates.some(candidate => {
    try { return fs.statSync(candidate).isFile(); } catch { return false; }
  });
}

walk(ROOT);
if (!checked.some(file => path.basename(file) === "index.html")) {
  problems.push("Não foi encontrado index.html.");
}

for (const file of checked) {
  const html = fs.readFileSync(file, "utf8");
  const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)];
  for (const match of refs) {
    const ref = match[1].trim();
    if (!existsLocalReference(ref, file)) {
      problems.push(`Referência local não encontrada: ${path.relative(ROOT, file)} -> ${ref}`);
    }
  }
}

for (const required of ["index.html", "pagina.html", "style.css", "paginas.js", "editor.js"]) {
  if (!fs.existsSync(path.join(ROOT, required))) {
    problems.push(`Arquivo essencial ausente na raiz: ${required}`);
  }
}

try {
  const response = await fetch(SITE_URL, { redirect: "follow", signal: AbortSignal.timeout(20000) });
  if (!response.ok) problems.push(`Site publicado respondeu HTTP ${response.status}: ${SITE_URL}`);
  else {
    const html = await response.text();
    if (!html.toLowerCase().includes("<html")) problems.push("O site publicado respondeu, mas não parece conter HTML.");
    if (!html.includes("Colégio Santa Teresinha") && !html.includes("Colégio Santa Teresinha do Menino Jesus")) {
      problems.push("O site publicado não contém o título esperado do colégio; pode estar exibindo conteúdo inesperado.");
    }
  }
} catch (error) {
  problems.push(`Não foi possível acessar o site publicado: ${error.message}`);
}

console.log("DIAGNÓSTICO AUTOMÁTICO DO SITE");
console.log(`Arquivos HTML verificados: ${checked.length}`);
console.log(`Endereço publicado: ${SITE_URL}`);

if (problems.length) {
  console.error(`\nForam encontrados ${problems.length} problema(s):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log("\nNenhum problema foi encontrado nas verificações automáticas.");
  console.log("Observação: este teste não substitui cliques reais, teste visual, nem verificação do Supabase/editor.");
}
