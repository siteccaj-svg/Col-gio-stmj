const conteudos = {
  colegio: [
    "O Colégio",
    "Uma tradição de fé e educação",
    "Nossa missão é oferecer uma formação acadêmica sólida, humana e cristã, em um ambiente acolhedor que valoriza cada aluno.",
    "Conheça nossa história, nossa comunidade e os espaços que fazem parte da vida escolar."
  ],

  ensino: [
    "Etapas de Ensino",
    "Aprender e crescer em cada etapa",
    "Acompanhamos o desenvolvimento dos alunos com atenção às necessidades de cada fase escolar.",
    "Educação Infantil · Ensino Fundamental · Ensino Médio"
  ],

  proposta: [
    "Proposta Pedagógica",
    "Conhecimento, valores e propósito",
    "Uma proposta educativa que une excelência acadêmica, formação humana e valores cristãos.",
    "Buscamos formar pessoas responsáveis, solidárias, curiosas e preparadas para o futuro."
  ],

  noticias: [
    "Notícias e Eventos",
    "A vida do colégio em movimento",
    "Acompanhe projetos, celebrações, atividades e momentos importantes da nossa comunidade escolar.",
    "Em breve, esta área poderá receber notícias e galerias atualizadas pela equipe do colégio."
  ],

  matriculas: [
    "Matrículas",
    "Comece sua história conosco",
    "Será uma alegria receber sua família e apresentar nossa proposta educativa.",
    "Entre em contato com a secretaria para informações sobre vagas, etapas de ensino e visitas."
  ],

  contato: [
    "Fale Conosco",
    "Estamos à disposição",
    "Entre em contato com a equipe do Colégio Santa Teresinha do Menino Jesus.",
    "Ipatinga · MG · Telefone: (31) 3825-0451"
  ]
};

function carregarConteudo() {
  const parametros = new URLSearchParams(window.location.search);
  const secao = parametros.get("secao") || "colegio";

  const dados = conteudos[secao] || conteudos.colegio;
  const conteudo = document.getElementById("conteudo");

  if (!conteudo) {
    console.error('Não foi encontrado o elemento com o ID "conteudo".');
    return;
  }

  document.title = dados[0] + " | Colégio Santa Teresinha";

  conteudo.innerHTML = `
    <section class="inner-hero">
      <p class="eyebrow">
        COLÉGIO SANTA TERESINHA DO MENINO JESUS
      </p>

      <h1>${dados[1]}</h1>

      <p>${dados[2]}</p>

      <a class="btn dark" href="index.html">
        ← Página inicial
      </a>

      <div class="inner-symbol" aria-hidden="true">✝</div>
    </section>

    <section class="inner-content">
      <p class="eyebrow">${dados[0].toUpperCase()}</p>

      <h2>${dados[0]}</h2>

      <p>${dados[3]}</p>

      <div class="inner-panel">
        <h3>Tradição, fé e conhecimento</h3>
        <p>
          Educação clássica católica para formar grandes pessoas.
        </p>
      </div>
    </section>
  `;

  window.scrollTo(0, 0);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", carregarConteudo);
} else {
  carregarConteudo();
}
