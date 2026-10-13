/* Formulários dos recursos escolares: o usuário revisa e envia pelo WhatsApp. */
(function () {
  "use strict";
  const numeroWhatsAppColegio = "553138250451";
  function configurarFormulario(idFormulario, idStatus, montarMensagem) {
    const form = document.getElementById(idFormulario);
    const status = document.getElementById(idStatus);
    if (!form || !status) return;
    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (!form.reportValidity()) return;
      const dados = Object.fromEntries(new FormData(form).entries());
      const mensagem = montarMensagem(dados);
      status.textContent = "Abrindo o WhatsApp para você revisar a mensagem e enviá-la ao colégio.";
      window.location.href = "https://wa.me/" + numeroWhatsAppColegio + "?text=" + encodeURIComponent(mensagem);
    });
  }
  configurarFormulario("formAtendimentoEscolar", "atendimento-status", function (d) {
    return ["Olá! Gostaria de entrar em contato com o Colégio Santa Teresinha do Menino Jesus.","","Nome: " + d.nome,d.email ? "E-mail: " + d.email : "","Assunto: " + d.assunto,"Mensagem: " + d.mensagem].filter(Boolean).join("\n");
  });
  configurarFormulario("formVisitaEscolar", "visita-status", function (d) {
    const data = d.data ? d.data.split("-").reverse().join("/") : "Não informada";
    return ["Olá! Gostaria de solicitar uma visita ao Colégio Santa Teresinha do Menino Jesus.","","Nome: " + d.nome,"Telefone: " + d.telefone,"Data desejada: " + data,"Período preferido: " + d.periodo,"Etapa de interesse: " + d.etapa,"","Entendo que a visita depende de confirmação pela equipe do colégio."].join("\n");
  });
  const data = document.getElementById("visita-data");
  if (data) { const now = new Date(); data.min = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,10); }
})();
