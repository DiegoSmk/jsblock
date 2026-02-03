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
- **Em Desenvolvimento (Pendente)**:
    - **Aba Desenvolvedor**: A opção "Mostrar Áreas de Conexão" foi reintroduzida na interface, mas precisa de uma implementação robusta no CSS/JS para que os indicadores de debug apareçam corretamente sem interferir na funcionalidade dos handles.

## 4. Inconsistência de Cores e Natureza dos Handles
- **Sintoma**: Os conectores do `TaskNode` possuem cores diferentes (Azul na esquerda e Verde na direita).
- **Esclarecimento de Regra de Negócio**: 
    1. Os conectores nestes nós devem ser sempre **híbridos** (capazes de enviar e receber conexões simultaneamente).
    2. **Visibilidade Persistente**: Quando um conector possui uma conexão ativa, ele DEVE permanecer visível de forma persistente, tanto para Notas quanto para Utilitários. Atualmente, eles desaparecem ou ficam ocultos, deixando a linha conectada a um ponto invisível (como visto na imagem anexada).
- **Problema**: A disparidade de cores atual reforça a ideia de "Entrada vs Saída" e a falta de visibilidade persistente dificulta a gestão visual do grafo.
- **Correção Solicitada**: 
    1. Implementar cada conector como funcionalmente híbrido (sobreposição de `source` e `target`).
    2. Padronizar a cor para um tom neutro (cinza com borda branca) em ambos os lados.
    3. Garantir que se o handle estiver conectado (`hasConnections`), sua opacidade/visibilidade seja 100% mesmo sem hover.

## 5. Próxima Etapa Recomendada
- Investigar a propriedade `pointer-events` nos ícones e labels dentro do `UtilityNode`. Se o ícone estiver sobreposto ao handle ou se o handle estiver com `z-index` menor que o conteúdo do nó, o clique não será registrado corretamente.
- Aumentar a `connectionRadius` nas configurações do React Flow ou criar um elemento invisível maior ao redor do handle que delegue os eventos para o `Handle` real.
- Implementar a hibridização funcional e visual conforme descrito no ponto 4, garantindo a visibilidade fixa para conectores ativos.
