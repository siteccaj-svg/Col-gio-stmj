# Segurança e recuperação do site

Este repositório usa o histórico do GitHub como cofre de versões. Os backups são referências Git e não cópias publicadas dentro do site.

## Como funciona

- **Ponto inicial:** a branch `seguranca/ponto-inicial-20261012` preserva o estado que existia quando o sistema foi instalado.
- **Pontos automáticos:** o workflow `Pontos de segurança do site` cria uma tag `seguro-...` a cada envio para `main`. Também pode ser executado manualmente na aba Actions.
- **Recuperação segura:** o workflow `Recuperar versão anterior do site` prepara uma branch e um Pull Request com a versão escolhida. Ele não altera a `main` diretamente.
- **Revisão:** confira o Pull Request e mescle somente se as diferenças forem as desejadas.

## Como recuperar uma versão

1. Abra a aba Actions do repositório.
2. Selecione **Recuperar versão anterior do site** e clique em **Run workflow**.
3. No campo `commit_sha`, informe o SHA completo de um commit anterior da `main`.
4. Escolha `sim` para confirmar. Se escolher `nao`, a operação será cancelada.
5. Abra o Pull Request criado, revise as mudanças e mescle-o para publicar a recuperação.

Para encontrar um SHA, abra o histórico de commits e copie o identificador completo do commit desejado. As tags `seguro-...` também apontam para commits preservados.

## Limites importantes

- O sistema preserva e recupera **arquivos do repositório**; não desfaz alterações no Supabase ou em outros serviços externos.
- O diagnóstico automático não garante todos os cliques, aparência em cada tela ou funcionamento de integrações. Testes no navegador continuam necessários.
- Uma recuperação cria um Pull Request para revisão, em vez de sobrescrever a versão publicada sem conferência.
