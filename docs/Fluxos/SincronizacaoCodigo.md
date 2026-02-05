# Fluxo de Sincronização (Código <-> Visual)

A principal funcionalidade do JS Block é manter o código (texto) e o grafo (visual) em sincronia constante. Isso ocorre em dois laços principais.

## 1. Código para Visual (Text Change)

Quando o usuário edita o código no Monaco Editor ou abre um arquivo:

1.  **Trigger**: Evento `onChange` do Monaco ou `loadContent` do arquivo.
2.  **Action**: `useStore.getState().setCode(newCode)`.
3.  **Parsing**: `parseCodeToFlow(newCode)` é executado.
    - O Babel parseia o código.
    - O Dispatcher cria novos objetos `Node` e `Edge`.
4.  **Diffing (Implícito)**: O Zustand substitui o array de nós inteiramente (`nodes: layouted.nodes`).
    - *Nota*: Isso causa um re-render completo do canvas.
5.  **Layout**: `getLayoutedElements` (Dagre) organiza os nós automaticamente se a opção estiver ativada.

## 2. Visual para Código (Graph Change)

Quando o usuário interage com o canvas:

1.  **Trigger**: Eventos `onNodesChange`, `onEdgesChange`, `onConnect` do React Flow.
2.  **Action**: O store atualiza o estado local dos nós/arestas.
3.  **Debounce/Check**: Se for uma mudança estrutural (nova conexão, novo nó), o gerador é invocado.
4.  **Generation**: `generateCodeFromFlow(currentCode, nodes, edges)` é chamado.
    - Usa o código *atual* como base.
    - Aplica as transformações da AST.
    - Gera `newCode`.
5.  **Update**: `setCode(newCode)` é chamado.
    - **CUIDADO**: Aqui temos um potencial loop infinito.
    - *Solução*: O `setCode` geralmente tem flags ou o React Flow ignora updates se a estrutura não mudou drasticamente, mas é o ponto mais frágil do sistema.

## Diagrama de Sequência

![[Diagramas/FluxoSincronizacao.mmd]]

## Problemas de Concorrência

Como a sincronização é bidirecional e quase instantânea, podem ocorrer "race conditions":
- Se o usuário digitar rápido enquanto arrasta um nó, o gerador pode sobrescrever o que foi digitado.
- Atualmente, o sistema prioriza a última ação, mas não há travamento de mutex explícito entre os dois modos.
