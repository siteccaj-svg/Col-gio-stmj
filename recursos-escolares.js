/* Recursos do site: formulários com encaminhamento explícito via WhatsApp. */
(function () {
  "use strict";
  const whatsappNumero = "553138250451";

  function ligarFormulario(id, statusId, montarMensagem) {
    const form = document.getElementById(id);
    const status = document.getElementById(statusId);
    if (!form || !status) return;

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (!form.reportValidity()) return;

      const dados = Object.fromEntries(new FormData(form).entries());
      const mensagem = montarMensagem(dados);
      const url = "https://wa.me/" + whatsappNumero + "?text=" + encodeURIComponent(mensagem);
      status.textContent = "O WhatsApp será aberto com a mensagem preparada. Confira os dados e toque em enviar para encaminhar ao colégio.";
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  ligarFormulario("formAtendimentoReal", "atendimento-status-st", function (d) {
    return [
      "Olá! Gostaria de entrar em contato com o Colégio Santa Teresinha do Menino Jesus.",
      "",
      "Nome: " + d.nome,
      d.email ? "E-mail: " + d.email : "",
      "Assunto: " + d.assunto,
      "Mensagem: " + d.mensagem
    ].filter(Boolean).join("\n");
  });

  ligarFormulario("formVisitaReal", "visita-status-st", function (d) {
    const data = d.data ? d.data.split("-").reverse().join("/") : "Não informada";
    return [
      "Olá! Gostaria de solicitar uma visita ao Colégio Santa Teresinha do Menino Jesus.",
      "",
      "Nome: " + d.nome,
      "Telefone: " + d.telefone,
      "Data desejada: " + data,
      "Período preferido: " + d.periodo,
      "Etapa de interesse: " + d.etapa,
      "",
      "Entendo que a data depende de confirmação pela equipe do colégio."
    ].join("\n");
  });

  const dataVisita = document.getElementById("visita-data-st");
  if (dataVisita) {
    const hoje = new Date();
    const localHoje = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    dataVisita.min = localHoje;
  }
})();
