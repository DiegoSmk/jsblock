# Protocolo de Refatoração: Arquitetura Orientada a Features

Este documento serve como guia mestre para a reorganização da estrutura de pastas do projeto. O objetivo é migrar de uma estrutura horizontal (por tipo: components, logic, store) para uma estrutura vertical (por domínio: features/x, features/y).

## 🎯 Estrutura Alvo
O projeto deverá seguir estritamente o seguinte layout ao final da refatoração:

```text
src/
  ├── components/       # UI Kit Genérico (Button, Modal, Input, Layouts base)
  ├── features/         # Módulos de Domínio (Onde a lógica reside)
  │   ├── editor/       # Canvas, ReactFlow, Nós, Blueprints
  │   ├── execution/    # Runner, Logs, Instrumentação, Decoração
  │   ├── git/          # Integração Git, Gráficos, Histórico
  │   └── settings/     # Configurações do Aplicativo
  ├── layout/           # Componentes de Layout Macro (Sidebar, Wrappers)
  ├── hooks/            # Hooks utilitários globais (não amarrados a business logic)
  └── store/            # Configuração root da store (combineSlices)
```

## 📋 Lista de Tarefas (Execução Obrigatória)

Execute as tarefas na ordem apresentada. Após cada movimento de arquivo, **verifique e corrija imediatamente todas as importações quebradas**.

### 1. Preparação da Infraestrutura
1.  Crie o diretório `src/features`.
2.  Crie o diretório `src/components/ui`.
3.  Crie o diretório `src/features/execution`.
4.  Crie o diretório `src/features/git`.
5.  Crie o diretório `src/features/editor`.

### 2. Migração da Feature: Execution (Prioridade Máxima)
Isolar toda a lógica de execução de código, instrumentação e feedback visual (Quokka-like).

1.  **Frontend / Hooks**:
    - Mova `src/hooks/useMonacoDecorations.ts` para `src/features/execution/hooks/useMonacoDecorations.ts`.
    - Identifique qualquer outro hook ou utilitário exclusivo de execução em `src/utils` e mova-o para `src/features/execution/utils`.

2.  **Backend / Electron Services**:
    - *Nota: O código do processo Electron (`electron/`) pode manter uma estrutura espelhada ou ser agrupado se a arquitetura permitir. Por enquanto, foque em limpar o `src`.*
    - Se houver tipos TypeScript compartilhados relacionados à execução em `src/types`, mova-os para `src/features/execution/types.ts`.

3.  **Store Slices**:
    - Analise `src/store/useStore.ts` e `src/store/slices`. Se houver slices dedicados a logs de execução ou estado do runner, extraia-os para `src/features/execution/store`.

### 3. Migração da Feature: Git
Limpar a raiz de componentes e lógica de controle de versão.

1.  **Componentes**:
    - Mova para `src/features/git/components`:
        - `GitGraphView.tsx`
        - `GitInfoPanel.tsx`
        - `GitInitView.tsx`
        - `PanelSection.tsx` (se for exclusivo do Git)
        - `CommitHistory.tsx` (se existir)
    
2.  **Lógica**:
    - Mova arquivos relacionados a Git de `src/logic` para `src/features/git/logic` ou `services`.

### 4. Migração da Feature: Editor (Blueprints)
Agrupar o core do editor visual.

1.  **Nodes (Componentes de Nós)**:
    - Mova todos os componentes de nós (`VariableNode`, `SwitchNode`, `FunctionNode`, etc.) de `src/components` para `src/features/editor/nodes`.
    
2.  **Lógica do Editor**:
    - Mova `verify_codegen.ts`, `verify_nested_flow.ts` e lógicas de grafo de `src/logic` para `src/features/editor/logic`.

### 5. Saneamento do UI Kit
Padronizar componentes visuais básicos.

1.  Identifique componentes genéricos em `src/components` que **não** possuem lógica de negócio (ex: `ModernModal`, `Button`, `Input`).
2.  Mova-os para `src/components/ui`.
3.  Renomeie arquivos se necessário para manter consistência (PascalCase).

### 6. Validação Final
1.  Execute `npm run type-check` (ou `tsc`) para garantir que nenhum import ficou quebrado.
2.  Verifique se o `App.tsx` e `main.tsx` estão importando dos novos caminhos.
3.  Delete pastas vazias que restaram em `src/components` ou `src/logic`.
