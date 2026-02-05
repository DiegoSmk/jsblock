# Gerenciamento de Estado (Zustand)

O estado da aplicação é gerenciado centralmente pela biblioteca [Zustand](https://github.com/pmndrs/zustand). O arquivo principal é `src/store/useStore.ts`.

## Estrutura do Store

O store contém tanto dados de UI (layout, tema) quanto dados lógicos (nós, arestas, código).

```typescript
export const useStore = create<AppState>((set, get, api) => ({
    ...createGitSlice(set, get, api), // Slice modularizado

    // Estado Principal
    code: '',             // Código fonte atual
    nodes: [],            // Nós do React Flow
    edges: [],            // Conexões
    theme: 'dark',        // Tema da UI

    // Configurações (Persistidas)
    settingsConfig: '...', // JSON stringificado do settings.json

    // Runtime
    runtimeValues: {},    // Valores capturados durante execução

    // Navegação
    navigationStack: [],  // Pilha de escopos (funções, loops)
    activeScopeId: 'root'
}));
```

## Persistência

A aplicação usa uma estratégia de persistência híbrida:
1.  **localStorage**: Usado para configurações de UI (`layout`, `recentEnvironments`, `theme`).
    - *Nota*: O store tenta ler `localStorage` diretamente na inicialização das propriedades, o que pode causar inconsistências se não gerenciado via `persist` middleware.
2.  **Sistema de Arquivos**: O código (`code`) e o grafo (`nodes/edges`) são salvos em arquivos `.js` ou `.block` via IPC.

## Sincronização de Estado

A função mais crítica do store é `setCode(code: string)`.
1.  Ela é chamada quando o editor de texto muda ou quando um arquivo é carregado.
2.  Chama `parseCodeToFlow(code)` para gerar novos nós.
3.  Calcula layout (`getLayoutedElements`).
4.  Inicia um Web Worker para avaliar valores em tempo real (`runtimeWorker`).

## Anti-Patterns e Refatoração

### 1. "God Object" Store
O arquivo `useStore.ts` é extremamente grande e contém lógica misturada de:
- Sistema de Arquivos (saveFile, loadContent)
- Configurações (sync JSON)
- Lógica de UI (modais, toasts)
- Manipulação de Grafo (addNode, updateNode)

**Recomendação**: Quebrar o store em múltiplos slices menores, similar ao que foi feito com `gitSlice`.
- `createFileSlice`: carregar, salvar, auto-save.
- `createSettingsSlice`: tema, layout, config json.
- `createGraphSlice`: manipulação de nós e arestas.
- `createRuntimeSlice`: execução e workers.

### 2. Side-Effects dentro do Store
Existem muitos `setTimeout` e chamadas `window.electronAPI` diretas dentro das actions do Zustand.
**Recomendação**: Mover lógica assíncrona pesada para "Services" ou Thunks, mantendo o store puro para atualização de estado.

### 3. Persistência Manual
A lógica de salvar configurações (`updateSettingsConfig`) faz parse/stringify de JSON manualmente e grava no localStorage em cada update.
**Recomendação**: Utilizar o middleware `persist` do Zustand para automatizar isso de forma performática.
