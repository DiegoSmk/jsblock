# � Plano de Trabalho: Refatoração de Utility Nodes & Conectividade

Este documento detalha os requisitos, tarefas técnicas e especificações para a finalização da branch `feature/utility-nodes-refactor`. O objetivo é estabilizar a interface de grafos, padronizar a experiência visual e garantir a hibridização total dos conectores.

---

## 🔍 Análise de Funcionalidades em Desenvolvimento (Branch: `feature/utility-nodes-refactor`)

A branch foca na transição de um sistema de "Notas" puras para um ecossistema de "Nós de Utilidade" (Task, Copy, Collector, Portal). 

### 1. Sistema de "Smart Conversion"
- **O que é**: Conversão automática de strings Markdown (ex: `- [ ]`) em NoteNodes para nós do tipo `UtilityNode` (Task).
- **Status Técnico**: Implementado no lado da UI via `useNoteLogic`, mas carece de sincronização bidirecional robusta. O fluxo atual é: `NoteNode -> Regex Match -> AppState.addUtilityNode -> Position Calculation`.
- **Desafios**: Sincronização entre o texto da nota original (que permanece) e o nó gerado.

### 2. Hibridização de Conectores (Handles)
- **O que é**: Cada ponto de conexão deve atuar simultaneamente como `source` e `target`.
- **Implementação React Flow**: Tradicionalmente, o React Flow utiliza `isConnectable` mas separa o tipo. Para hibridização total, deve-se usar handles sobrepostos ou a propriedade `onConnect` no store que ignore a direção, combinada com handles que aceitam ambos os tipos visualmente.

### 3. Arquitetura de Registro e Dados
- **Registry**: Utiliza `src/registry/utilities.ts` para desacoplar a lógica visual do componente `UtilityNode.tsx`. Isso permite adicionar novos tipos (ex: `timer`) sem alterar o JSX principal.
- **Store Sync**: O estado `checked` e `label` das Tasks é atualizado via `updateNodeData`. É crucial garantir que o `onNodesChange` não sobrescreva dados voláteis durante o HMR (Hot Module Replacement).

---

## 🛠 Requisitos e Tarefas (Backlog para Merge)

### 🔴 Requisito 1: Estabilização de Conectividade & Eventos
*   **Problema**: Dificuldade de clique (deadzones) e erro de container #004.
*   **Tarefa 1.1**: Validar `pointer-events: none` em sub-elementos (Ícones Lucide, Labels) dentro dos `UtilityNodes` para evitar interceptação de eventos destinados ao `Handle`.
*   **Tarefa 1.2**: Implementar `connectionRadius: 30` (ou similar) nas opções do `ReactFlow` para facilitar a "sucção" da linha antes do mouse atingir o pixel central.
*   **Tarefa 1.3**: Garantir que o wrapper em `FlowContent.tsx` mantenha `flex: 1` e `min-height: 0` para evitar o colapso do container.

### 🔵 Requisito 2: Padronização Visual & Hibridização
*   **Problema**: Cores Azul/Verde inconsistentes e handles que desaparecem quando conectados.
*   **Tarefa 2.1**: Unificar estilos de Handle para `background: #94a3b8` (cinza neutro) com `border: 2px solid #fff` em todos os Utility Nodes.
*   **Tarefa 2.2**: Implementar lógica de "Visibilidade Persistente": 
    - Atribuir `opacity: 1` se `hasConnections(handleId) === true`.
    - Manter `opacity: 0` ou reduzida apenas quando o nó está desconectado e sem hover.
*   **Tarefa 2.3**: Criar o "Extreme Hybrid Handle": Inserir dois componentes `<Handle />` no mesmo `top/left`, um `source` e um `target`, garantindo compatibilidade total de fluxo.

### 🟡 Requisito 3: Funcionalidades de Desenvolvedor (Debug)
*   **Problema**: Opção "Mostrar Áreas de Conexão" ineficaz.
*   **Tarefa 3.1**: Criar um seletor CSS condicional que, quando `settings.showDebugHandles` é true, renderiza um `::after` no conector com `outline: 2px solid red` e `background: rgba(255,0,0,0.2)`. Isso deve ser puramente visual e não alterar as dimensões físicas do conector.

### 🟢 Requisito 4: Sincronização de Estado (Data Persistence)
*   **Problema**: Garantir que as alterações nos Utilitários sobrevivam ao Save/Load.
*   **Tarefa 4.1**: Validar se o `checked: boolean` das Tasks está sendo persistido no `AppNode.data`.
*   **Tarefa 4.2**: Testar a hibridização com o sistema de Undo/Redo para evitar "ghost edges" (arestas fantasmas).

### 🛡️ Requisito 5: Isolamento Arquitetural (Encapsulamento de Escopo)
*   **Objetivo**: Garantir que as melhorias de UX para Notas/Utilitários (hibridização, visibilidade) não interfiram na integridade semântica do motor de execução de Código.
*   **Tarefa 5.1 (CSS Scoping)**: Migrar todos os estilos de Handles de utilidades para classes específicas e isoladas (ex: `.utility-handle-wrapper`). Nunca utilizar seletores globais como `.react-flow__handle` para mudanças estéticas de utilidades.
*   **Tarefa 5.2 (Lógica de Conexão)**: Refatorar o `isValidConnection` e o `onConnect` no Store para aplicar um "Check de Domínio":
    - Se `source.type` ou `target.type` for `noteNode` ou `utilityNode` -> Aplicar regras de **Conexão Híbrida** (múltiplas entradas/saídas, sem restrição de direção).
    - Se ambos forem nós de código -> Aplicar regras de **Conexão Semântica** (validar tipos de dados, restringir direção única).
*   **Tarefa 5.3 (Namespacing de Dados)**: Garantir que propriedades como `checked` ou `utilityType` nunca coexistam ou conflitem com `expression` ou `isDecl` no mesmo objeto de dado, mantendo esquemas de dados (schemas) limpos e previsíveis.

---

## 📈 Critérios de Aceite para o Próximo Commit
1. [ ] Resolução definitiva do erro #004 (React Flow container size).
2. [ ] Conectores de cores unificadas (Cinza/Branco) com hibridização funcional apenas em nós de utilidade.
3. [ ] Conectores permanecem visíveis se houver uma aresta (edge) ligada a eles.
4. [ ] Início de conexão é detectado mesmo se o mouse estiver levemente fora do ponto central.
5. [ ] Garantia técnica (via código) de que as regras de hibridização não afetam nós de lógica JS (ex: VariableNode).
6. [ ] Aba "Desenvolvedor" funcional com visualização de área vermelha isolada para utilidades.
