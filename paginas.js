const paginas = {
  colegio: {
    nome: "O Colégio",
    titulo: "Uma tradição de fé e educação",
    resumo: "Um espaço de aprendizagem que valoriza o conhecimento, a formação humana e os princípios cristãos.",
    intro: "O Colégio Santa Teresinha do Menino Jesus busca contribuir para o desenvolvimento acadêmico e humano dos alunos, em diálogo com as famílias e com atenção a cada etapa da vida escolar.",
    cards: [
      ["Nossa identidade", "Uma comunidade educativa que procura unir conhecimento, respeito, responsabilidade e valores cristãos."],
      ["Formação humana", "Incentivo a atitudes de empatia, cooperação, honestidade e cuidado com o próximo."],
      ["Família e escola", "O diálogo e a parceria com as famílias são importantes para acompanhar a caminhada de cada aluno."]
    ],
    destaque: "Conheça de perto a proposta educativa",
    chamada: "Entre em contato para conversar com a equipe e saber mais sobre a vida escolar."
  },
  ensino: {
    nome: "Etapas de Ensino",
    titulo: "Aprender e crescer em cada etapa",
    resumo: "Uma jornada de aprendizagem, amadurecimento e descobertas, respeitando as características de cada fase.",
    intro: "Cada etapa escolar apresenta novas perguntas, habilidades e oportunidades. A proposta é acompanhar esse percurso com incentivo ao estudo, à autonomia e à convivência respeitosa.",
    cards: [
      ["Educação Infantil", "Acolhimento, brincadeiras, linguagem e primeiras descobertas que ajudam a despertar a curiosidade."],
      ["Ensino Fundamental", "Construção dos conhecimentos, desenvolvimento do raciocínio e fortalecimento dos hábitos de estudo."],
      ["Ensino Médio", "Aprofundamento dos conteúdos, autonomia, responsabilidade e preparação para os próximos passos."]
    ],
    destaque: "Encontre a etapa adequada para sua família",
    chamada: "Fale com a secretaria para confirmar as etapas oferecidas, as vagas e as informações de matrícula."
  },
  proposta: {
    nome: "Proposta Pedagógica",
    titulo: "Conhecimento, valores e propósito",
    resumo: "Uma educação que busca integrar aprendizagem acadêmica, formação humana e valores cristãos.",
    intro: "A formação escolar envolve conteúdos, hábitos, relações e escolhas. Por isso, aprender também significa desenvolver responsabilidade, curiosidade intelectual, respeito e compromisso com a comunidade.",
    cards: [
      ["Excelência acadêmica", "Valorizar o estudo, a leitura, o pensamento crítico e a busca constante pelo conhecimento."],
      ["Valores cristãos", "Promover respeito, solidariedade, serviço e atenção à dignidade de cada pessoa."],
      ["Desenvolvimento integral", "Incentivar autonomia, convivência, responsabilidade e participação na vida escolar."]
    ],
    destaque: "Educar para a vida",
    chamada: "Converse com a equipe para conhecer melhor os princípios que orientam a proposta educativa."
  },
  noticias: {
    nome: "Notícias e Eventos",
    titulo: "A vida do colégio em movimento",
    resumo: "Projetos, celebrações, atividades e momentos que aproximam a comunidade escolar.",
    intro: "Esta área é dedicada a compartilhar novidades e acontecimentos da vida escolar. As publicações podem reunir comunicados, registros de projetos, datas importantes e atividades realizadas pela comunidade.",
    cards: [
      ["Projetos escolares", "Espaço para apresentar trabalhos, experiências de aprendizagem e iniciativas desenvolvidas pelos alunos."],
      ["Celebrações e encontros", "Registros de momentos importantes, atividades comunitárias e celebrações do calendário escolar."],
      ["Comunicados", "Informações e avisos para manter famílias e responsáveis atualizados sobre a rotina escolar."]
    ],
    destaque: "Acompanhe as novidades",
    chamada: "As atualizações desta seção dependem da publicação de informações pela equipe do colégio."
  },
  matriculas: {
    nome: "Matrículas",
    titulo: "Comece sua história conosco",
    resumo: "Conheça a proposta educativa do colégio e converse com a equipe sobre o ingresso de novos alunos.",
    intro: "Escolher uma escola é uma decisão importante para toda a família. Nossa equipe pode orientar sobre as etapas de ensino, a disponibilidade de vagas e os procedimentos necessários para matrícula.",
    cards: [
      ["1. Entre em contato", "Converse com a secretaria para solicitar as informações atualizadas sobre matrículas."],
      ["2. Conheça a proposta", "Tire suas dúvidas sobre as etapas escolares, a rotina e os princípios educativos."],
      ["3. Confirme os próximos passos", "Verifique documentos necessários, disponibilidade de vagas e orientações da secretaria."]
    ],
    destaque: "Estamos à disposição para orientar sua família",
    chamada: "Ligue para (31) 3825-0451 ou visite a seção Fale Conosco para ver as informações de contato."
  },
  contato: {
    nome: "Fale Conosco",
    titulo: "Estamos à disposição",
    resumo: "Entre em contato para tirar dúvidas e conhecer melhor o Colégio Santa Teresinha do Menino Jesus.",
    intro: "A equipe do colégio pode orientar as famílias sobre a proposta educativa, as etapas de ensino e as informações de matrícula.",
    cards: [
      ["Telefone", "(31) 3825-0451. Entre em contato para consultar informações e orientações da secretaria."],
      ["Localização", "Colégio Santa Teresinha do Menino Jesus, em Ipatinga — Minas Gerais."],
      ["Visita e informações", "Entre em contato antes de se deslocar para confirmar horários e a melhor forma de atendimento."]
    ],
    destaque: "Será um prazer conversar com você",
    chamada: "Use as informações de contato para falar com a equipe e esclarecer suas dúvidas."
  }
};

const menuSubpaginas = [
  ["O Colégio", "colegio"],
  ["Etapas de Ensino", "ensino"],
  ["Proposta Pedagógica", "proposta"],
  ["Notícias", "noticias"],
  ["Matrículas", "matriculas"],
  ["Fale Conosco", "contato"]
];

const secao = new URLSearchParams(window.location.search).get("secao") || "colegio";
const pagina = paginas[secao] || paginas.colegio;
document.title = pagina.nome + " | Colégio Santa Teresinha";

const menu = menuSubpaginas.map(([rotulo, chave]) =>
  `<a href="pagina.html?secao=${chave}" ${chave === secao ? 'aria-current="page"' : ""}>${rotulo}</a>`
).join("");

const cards = pagina.cards.map(([titulo, texto], i) => `
  <article class="inner-feature">
    <span aria-hidden="true">${["✦", "♡", "✝"][i]}</span>
    <h3>${titulo}</h3>
    <p>${texto}</p>
  </article>
`).join("");

document.getElementById("conteudo").innerHTML = `
  <section class="inner-hero">
    <p class="eyebrow">COLÉGIO SANTA TERESINHA DO MENINO JESUS</p>
    <h1>${pagina.titulo}</h1>
    <p>${pagina.resumo}</p>
    <a class="btn dark" href="index.html">← Página inicial</a>
    <div class="inner-symbol" aria-hidden="true">✝</div>
  </section>
  <nav class="subnav" aria-label="Navegação das páginas">
    ${menu}
  </nav>
  <section class="inner-content">
    <div class="inner-intro">
      <p class="eyebrow">${pagina.nome.toUpperCase()}</p>
      <h2>${pagina.nome}</h2>
      <p>${pagina.intro}</p>
    </div>
    <div class="inner-feature-grid">
      ${cards}
    </div>
    <div class="inner-bottom">
      <div>
        <h3>${pagina.destaque}</h3>
        <p>${pagina.chamada}</p>
      </div>
      <a class="btn dark" href="pagina.html?secao=contato">Fale Conosco →</a>
    </div>
  </section>
`;

window.scrollTo(0, 0);
