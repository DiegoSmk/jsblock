# 📑 Relatório Técnico: Diagnóstico de Visualização e Conectividade

## 1. Problema de Conectividade nos UtilityNodes
- **Sintoma**: Usuários encontram extrema dificuldade em "capturar" ou "ancorar" conexões nos handles dos `UtilityNodes`. 
- **Detalhe Crítico**: A falha ocorre especificamente quando o ponteiro do mouse está **exatamente sobre o conector** (o ponto visual). Isso sugere que o componente de visualização ou algum overlay está interceptando os eventos de mouse, impedindo que o `Handle` do React Flow processe o início da conexão.
- **Visual**: O usuário relata ver um "ponto cinza com borda branca" ao aproximar o mouse, o que pode ser um conflito entre o estilo padrão da biblioteca e as customizações CSS aplicadas.

## 2. Erros de Layout de Container
- **Erro**: `[React Flow]: The React Flow parent container needs a width and a height to render the graph (Error #004)`.
- **Causa**: O componente `FlowContent.tsx` estava perdendo suas dimensões em tempo de execução, provavelmente devido à estrutura de painéis (`Allotment`) que não propagava corretamente o tamanho flexível.
- **Estado Atual**: Foi aplicada uma correção forçando `flex: 1` e `min-height: 0` no wrapper do `ReactFlow`.

## 3. Análise de Mudanças Recentes
- **Rejeitadas**:
    - Alteração dos handles para formato quadrado.
    - Implementação da classe CSS `.debug-handle` com `!important`.
    - Modo de "Debug de Áreas de Conexão" via quadrados vermelhos (não resolveu a causa raiz e degradou a estética).
- **Mantidas (Úteis)**:
    - Correção de chaves duplicadas no `useStore.ts` (resolução de avisos de build).
    - Limpeza de sintaxe e imports não utilizados no `UtilityNode.tsx`.
    - Correção do tamanho do container pai do React Flow no `FlowContent.tsx`.

## 4. Próxima Etapa Recomendada
- Investigar a propriedade `pointer-events` nos ícones e labels dentro do `UtilityNode`. Se o ícone estiver sobreposto ao handle ou se o handle estiver com `z-index` menor que o conteúdo do nó, o clique não será registrado corretamente.
- Aumentar a `connectionRadius` nas configurações do React Flow ou criar um elemento invisível maior ao redor do handle que delegue os eventos para o `Handle` real.
