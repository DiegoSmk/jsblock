# Análise Técnica do Projeto JS Blueprints Electron

Esta análise cobre a arquitetura, performance, qualidade de código e sugestões de melhoria para o projeto `js-blueprints-electron`. O objetivo é identificar gargalos, oportunidades de refatoração ("repatriação" de código) e melhorias de manutenibilidade.

## 1. Visão Geral
O projeto é uma aplicação Desktop construída com **Electron**, **React**, **TypeScript** e **Vite**. Ele utiliza **Zustand** para gerenciamento de estado e **React Flow** para a interface de programação visual. Existe também um servidor **MCP (Model Context Protocol)** acoplado para expor logs e estado.

## 2. Pontos Fortes
*   **Segurança no Electron:** O `main.ts` configura corretamente `contextIsolation: true` e `nodeIntegration: false`, utilizando `preload.ts` e `ipcRenderer.invoke` para comunicação segura.
*   **Performance de Logs:** O `executionSlice.ts` utiliza um buffer interno fora do React e `requestAnimationFrame` para atualizar logs. Isso evita travamentos da UI durante execuções verborrágicas.
*   **Parsing em Background:** O `CodeParser.ts` utiliza um **Web Worker** (`parser.worker.ts`), garantindo que o parsing de código (operação pesada) não bloqueie a thread principal.
*   **Linting Rigoroso:** O projeto utiliza regras estritas do ESLint (`no-explicit-any`, `no-floating-promises`), o que garante uma base de código mais segura e tipada.

## 3. Gargalos de Performance (Crítico)

### 3.1. Geração de Código na Thread Principal
O arquivo `CodeGenerator.ts` é o maior gargalo de performance identificado.
*   **O Problema:** A função `generateCodeFromFlow` é executada de forma **síncrona** na thread principal sempre que uma aresta é alterada (`onEdgesChange` na store).
*   **Impacto:** Ela utiliza a biblioteca `recast` para fazer o parse e print da AST (Abstract Syntax Tree) inteira. Em fluxos grandes, isso causará "congelamentos" perceptíveis na interface ao arrastar conexões.
*   **Solução Recomendada:**
    1.  Mover a geração de código para um **Web Worker** (assim como o parser).
    2.  Aplicar **Debounce** na chamada de geração de código durante a edição visual (não gerar a cada pixel de movimento, apenas ao soltar ou após x ms).

### 3.2. Renderização do Flow
O componente `FlowContent.tsx` filtra nós visíveis (`filteredNodes`) a cada renderização.
*   **O Problema:** O cálculo de visibilidade baseada em `activeScopeId` é feito em JavaScript no tempo de renderização.
*   **Solução Recomendada:** Utilizar `useMemo` de forma mais agressiva ou mover a lógica de filtragem para um seletor do Zustand, evitando recálculos desnecessários se a estrutura do grafo não mudou.

## 4. Arquitetura e Clean Code

### 4.1. "God Object" na Store
O arquivo `src/store/useStore.ts` atua como um objeto centralizador massivo.
*   **O Problema:** Ele mistura lógicas de UI (modais, abas), Estado do Editor (nós, arestas), Configurações e Sistema de Arquivos. Funções complexas como `promoteToVariable` e lógica de negócio (`checkTaskRecurse`) estão "hardcoded" dentro da store.
*   **Solução (Repatriação):**
    *   Extrair lógica de manipulação de nós para `src/features/editor/store/editorSlice.ts`.
    *   Extrair lógica de UI global para `src/store/uiSlice.ts`.
    *   Mover lógica de negócio complexa para *Services* ou *Helpers* puros, e apenas invocá-los na store.

### 4.2. Acoplamento no Gerador de Código
O `CodeGenerator.ts` possui strings mágicas e acoplamento forte com índices de array (`call-exec-${index}`).
*   **Risco:** Se a ordem dos statements mudar sem atualizar os IDs dos nós correspondentemente, o gráfico quebrará.
*   **Sugestão:** Refatorar para usar UUIDs persistentes nos metadados da AST (via comentários ou decorators, se possível) ao invés de depender puramente da posição no array.

### 4.3. Tratamento de Arquivos
No `electron/main.ts`, existe uma condição de corrida (TOCTOU) menor em `create-file`:
```typescript
if (fs.existsSync(filePath)) { throw ... }
await fs.promises.writeFile(...)
```
*   **Melhoria:** Usar flags de abertura de arquivo (`wx` no Node.js) que falham atomicamente se o arquivo já existir, ao invés de checar antes.

## 5. Análise do MCP Server (`js-blueprints-mcp`)
*   **Caminhos Relativos:** O servidor MCP usa `path.join(__dirname, '../app.log')`. Isso funciona em desenvolvimento, mas pode falhar se a estrutura de pastas mudar no build de produção (asar).
*   **Recomendação:** Passar o caminho do arquivo de log/estado como argumento de linha de comando ao iniciar o servidor MCP, ou usar uma variável de ambiente configurada pelo app Electron.

## 6. Plano de Ação Recomendado

1.  **Refatoração Imediata (Performance):** Implementar `CodeGenerator` em Web Worker.
2.  **Refatoração de Arquitetura:** Quebrar `useStore.ts` em slices menores (`editorSlice`, `uiSlice`).
3.  **Melhoria de Robustez:** Substituir a lógica baseada em índices no `CodeGenerator` por uma baseada em identificadores mais robustos.
4.  **Correção MCP:** Ajustar a resolução de caminhos no servidor MCP.

Este documento serve como base para as próximas tarefas de desenvolvimento.
