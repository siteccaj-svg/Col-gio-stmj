# Relação entre os arquivos

Este documento é uma referência inicial. Confirme as relações no código atual antes de cada alteração; não presuma dependências que não foram verificadas.

## Arquivos controlados

- **`index.html`**: página principal. Pode conter referências a folhas de estilo e scripts.
- **`pagina.html`**: estrutura de exibição das páginas secundárias; pode carregar estilos e scripts compartilhados.
- **`paginas.js`**: contém dados/conteúdos usados pelas páginas secundárias.
- **`style.css`**: define regras visuais compartilhadas, incluindo estilos responsivos.
- **`editor.js`**: implementa funcionalidades do editor.

## Regras para mudanças relacionadas
1. Consultar as referências reais entre arquivos antes de editar.
2. Não modificar um arquivo dependente automaticamente apenas porque existe uma relação entre eles.
3. Se a mudança realmente exigir outro arquivo, descrever a relação técnica e pedir autorização antes de alterá-lo.
4. Depois de uma mudança autorizada, verificar as páginas e funções afetadas, sem afirmar que houve teste visual ou funcional se ele não foi executado.
5. Manter este documento atualizado quando uma relação importante for confirmada ou alterada.

## Limite importante
Estes documentos organizam o processo de trabalho, mas não concedem acesso técnico por si só nem garantem ausência de erros. Para cada pedido futuro, as regras precisam ser consultadas e o resultado precisa ser conferido.
