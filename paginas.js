const conteudos={
colegio:["O Colégio","Uma tradição de fé e educação","Nossa missão é oferecer uma formação acadêmica sólida, humana e cristã, em um ambiente acolhedor que valoriza cada aluno.","Conheça nossa história, nossa comunidade e os espaços que fazem parte da vida escolar."],
ensino:["Etapas de Ensino","Aprender e crescer em cada etapa","Acompanhamos o desenvolvimento dos alunos com atenção às necessidades de cada fase escolar.","Educação Infantil · Ensino Fundamental · Ensino Médio"],
proposta:["Proposta Pedagógica","Conhecimento, valores e propósito","Uma proposta educativa que une excelência acadêmica, formação humana e valores cristãos.","Buscamos formar pessoas responsáveis, solidárias, curiosas e preparadas para o futuro."],
noticias:["Notícias e Eventos","A vida do colégio em movimento","Acompanhe projetos, celebrações, atividades e momentos importantes da nossa comunidade escolar.","Em breve, esta área poderá receber notícias e galerias atualizadas pela equipe do colégio."],
matriculas:["Matrículas","Comece sua história conosco","Será uma alegria receber sua família e apresentar nossa proposta educativa.","Entre em contato com a secretaria para informações sobre vagas, etapas de ensino e visitas."],
contato:["Fale Conosco","Estamos à disposição","Entre em contato com a equipe do Colégio Santa Teresinha do Menino Jesus.","Ipatinga · MG · Telefone: (31) 3825-0451"]
};
const key=new URLSearchParams(location.search).get("secao")||"colegio";const d=conteudos[key]||conteudos.colegio;
document.title=d[0]+" | Colégio Santa Teresinha";
document.getElementById("conteudo").innerHTML=`<section class="inner-hero"><p class="eyebrow">COLÉGIO SANTA TERESINHA DO MENINO JESUS</p><h1>${d[1]}</h1><p>${d[2]}</p><a class="btn dark" href="index.html">← Página inicial</a><div class="inner-symbol">✝</div></section><section class="inner-content"><p class="eyebrow">${d[0].toUpperCase()}</p><h2>${d[0]}</h2><p>${d[3]}</p><div class="inner-panel"><h3>Tradição, fé e conhecimento</h3><p>Educação clássica católica para formar grandes pessoas.</p></div></section>`;
window.scrollTo(0,0);
