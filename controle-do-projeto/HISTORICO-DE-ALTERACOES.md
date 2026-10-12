# Histórico de alterações

Use este documento para registrar mudanças relevantes feitas no site.

## Modelo para cada registro

- **Data:**
- **Pedido autorizado:**
- **Arquivos alterados:**
- **Mudanças exatas:**
- **Arquivos que deveriam permanecer intactos:**
- **Verificações realizadas:**
- **Limitações ou testes não realizados:**
- **Commit do GitHub:**

## Registros

Ainda não há registros nesta página. As alterações futuras devem ser documentadas após serem realizadas e verificadas. Não registrar como concluída uma mudança que não foi executada.


## Alteração: destaques que aparecem ao rolar a página

- **Data:** 2026-10-12
- **Pedido autorizado:** Adicionar oito caixas informativas inspiradas no efeito de entrada ao rolar a página do site do Colégio São Francisco Xavier, com quatro alternadas à esquerda e quatro à direita.
- **Arquivos alterados:** `index.html`, `style.css`.
- **Mudanças exatas:** Inserida uma seção na página inicial com oito caixas sobre aprendizagem, fé e valores, vida escolar, convivência, autonomia, parceria entre família e escola, formação integral e comunidade. Adicionada animação de entrada por IntersectionObserver e estilos responsivos; no celular, as caixas ficam empilhadas para manter a leitura.
- **Arquivos que deveriam permanecer intactos:** `pagina.html`, `paginas.js`, `editor.js` e demais arquivos não relacionados.
- **Verificações realizadas:** Conferidos os arquivos e âncoras antes da alteração; a implementação foi inserida nas áreas previstas e foi adicionada regra para preferência por movimento reduzido.
- **Limitações ou testes não realizados:** Não foi possível executar teste visual no navegador nem confirmar a renderização ao vivo nesta operação.
- **Commit do GitHub:** index.html: d550bc6474286735650610f94e05f6876cbfc6f0; style.css: 81d01f6df8c8a3ab1f81f4da33172bef7b22ed66


## Reversão: destaques ao rolar a página

- **Data:** 2026-10-12
- **Pedido autorizado:** Remover a seção de oito caixas informativas adicionada anteriormente, pois o usuário decidiu fazê-la manualmente.
- **Arquivos alterados:** `index.html`, `style.css`, este histórico.
- **Mudanças exatas:** Removida somente a seção `destaques-revelados`, o script que animava as caixas e o bloco CSS correspondente. Restaurada a referência de cache de `style.css` para `v=20261012-2`. Nenhuma outra seção, menu ou arquivo do site foi intencionalmente alterado.
- **Verificações realizadas:** Confirmado que os marcadores específicos existiam antes da remoção e que os limites da seção e do script foram encontrados.
- **Limitações ou testes não realizados:** Não foi executado teste visual no navegador.
