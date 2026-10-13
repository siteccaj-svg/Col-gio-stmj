# Governança central do site

Esta pasta é a **camada central de orientação** para os mecanismos auxiliares do repositório. Ela define como as pastas de controle, diagnóstico, operação e recuperação devem se comportar quando houver uma solicitação de alteração do responsável pelo site.

## Regra de prioridade

1. **Pedido explícito do responsável pelo site:** define exatamente o resultado autorizado.
2. **Governança central:** orienta a aplicação do pedido e limita o escopo das ferramentas auxiliares.
3. **Documentação e verificadores das outras pastas:** servem como apoio; não autorizam mudanças extras nem devem ser interpretados como permissão para reescrever conteúdo.
4. **Automações de correção e recuperação:** só podem agir quando forem acionadas pelo fluxo próprio e dentro dos limites descritos abaixo.

## Regras obrigatórias para alterações futuras

- Alterar somente os arquivos e trechos necessários para cumprir o pedido explícito.
- Não modificar conteúdo, visual, comportamento ou arquivos não mencionados por conveniência.
- Antes de editar, consultar o estado atual do repositório e identificar o escopo mínimo.
- Se uma ferramenta auxiliar reclamar de uma estrutura diferente, parar e relatar o problema; não ampliar a alteração por conta própria.
- Verificadores podem ler arquivos, testar referências e registrar alertas, mas não devem reescrever as páginas.
- A correção segura continua limitada aos blocos conhecidos documentados em `operacao-do-site/`; não é uma autorização geral para corrigir o site.
- A recuperação de versão continua sendo uma ação manual com confirmação e revisão por Pull Request.
- Depois de cada alteração, conferir o diff e informar os arquivos alterados e as verificações realmente executadas.

## Mapa dos mecanismos existentes

- `controle-do-projeto/`: regras de escopo, mapa, histórico e checklist.
- `operacao-do-site/`: verificação e correção segura limitada.
- `scripts/`: diagnóstico técnico existente.
- `.github/workflows/`: automações do GitHub Actions, incluindo diagnóstico, verificação, pontos de segurança e fluxos manuais de correção/recuperação.
- Arquivos principais do site na raiz: `index.html`, `pagina.html`, `paginas.js`, `style.css` e `editor.js`.

## Por que as pastas não foram movidas

Os caminhos atuais são referenciados pelos scripts e pelos workflows do GitHub Actions. Mover fisicamente essas pastas para dentro desta pasta-mãe sem atualizar e testar todas as referências poderia quebrar as automações. Por isso, esta pasta funciona como **pasta-mãe lógica**, sem reorganizar nem alterar os caminhos existentes do site.

## Limite técnico importante

Este documento estabelece o protocolo que deve ser seguido ao trabalhar no repositório, mas um arquivo Markdown, sozinho, não consegue bloquear tecnicamente permissões do GitHub nem obrigar todos os processos externos a obedecer. As automações existentes foram mantidas intactas nesta alteração. Proteções técnicas de branch e permissões do GitHub são configurações separadas.

## Checklist antes de qualquer alteração

- [ ] Pedido e resultado esperado estão claros.
- [ ] Arquivos necessários foram identificados.
- [ ] Arquivos fora do escopo serão preservados.
- [ ] Nenhuma automação de diagnóstico será tratada como autorização para alterar conteúdo.
- [ ] O diff final corresponde somente ao pedido autorizado.
- [ ] Limitações de teste foram informadas com transparência.
