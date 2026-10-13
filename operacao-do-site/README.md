# Operação do site

Esta pasta centraliza a rotina de verificação do Colégio Santa Teresinha do Menino Jesus sem duplicar nem substituir as ferramentas existentes.

## O que a verificação faz

O script `verificar-site.mjs` verifica os arquivos essenciais, a presença das oito caixas informativas, a ligação entre HTML/CSS/JavaScript e executa o diagnóstico já existente em `scripts/diagnostico-site.mjs`, que também testa o endereço publicado.

## Execução local

Requer Node.js 20 ou superior:

```bash
node operacao-do-site/verificar-site.mjs
```

Para testar outro endereço publicado:

```bash
SITE_URL=https://seu-endereco/ node operacao-do-site/verificar-site.mjs
```

No Windows PowerShell:

```powershell
$env:SITE_URL="https://seu-endereco/"
node operacao-do-site/verificar-site.mjs
```

## Limites de segurança

- A rotina verifica e informa problemas; não reescreve automaticamente páginas, estilos, conteúdo ou scripts.
- Uma falha é reportada para correção dirigida, evitando que um reparo automático altere partes do site que não foram autorizadas.
- O diagnóstico não substitui testes visuais, cliques reais, nem a validação do editor e dos serviços externos.
- A recuperação de versões continua sendo feita pelo fluxo já existente, com revisão em Pull Request.


## Correção segura sob demanda

O script `corrigir-seguro.mjs` pode restaurar apenas os blocos canônicos conhecidos de CSS das caixas e JavaScript da animação quando estiverem ausentes. Ele interrompe se detectar duplicatas ou estrutura inesperada. Não corrige erros arbitrários nem altera textos.

Para usar localmente, execute `node operacao-do-site/corrigir-seguro.mjs` e depois `node operacao-do-site/verificar-site.mjs`. No GitHub, o fluxo manual **Correção segura sob demanda** executa os testes e, se houver alterações, prepara um Pull Request para revisão — nunca publica diretamente na branch principal.
