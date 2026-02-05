# Arquitetura do Sistema

## Visão Geral

O **JS Block** segue a arquitetura padrão do Electron, com uma clara separação entre o **Main Process** (Processo Principal) e o **Renderer Process** (Processo de Renderização).

![[Diagramas/Arquitetura.mmd]]

### 1. Main Process (`electron/main.ts`)
Responsável pelo ciclo de vida da aplicação, criação de janelas e acesso a recursos nativos do sistema operacional.
- **Node.js Environment**: Acesso completo ao sistema de arquivos (`fs`), processos filhos (`child_process`), e PTY (`node-pty`).
- **Segurança**:
  - `nodeIntegration: false`: Impede que o renderer acesse APIs do Node.js diretamente.
  - `contextIsolation: true`: Garante que scripts de pré-carregamento rodem em um contexto isolado.
- **IPC Handlers**: Expõe funções seguras via `ipcMain` para operações de arquivo, terminal e plugins.

### 2. Renderer Process (`src/`)
A interface do usuário construída com React e Vite.
- **SPA (Single Page Application)**: Roda dentro da `BrowserWindow` criada pelo Main Process.
- **State Management**: Zustand mantém o estado da aplicação (nós, arestas, configurações).
- **Visual Engine**: `@xyflow/react` renderiza o grafo de nós.
- **AST Logic**: `CodeParser` e `CodeGenerator` rodam no cliente (browser context) para transformar código em visual e vice-versa.

## Fluxo de Dados

O fluxo de dados principal ocorre em um ciclo contínuo de sincronização:

1.  **Leitura**: O usuário abre um arquivo. O Main Process lê o conteúdo e envia para o Renderer via IPC.
2.  **Parsing**: O Renderer recebe a string de código e usa o `CodeParser` (Babel) para gerar uma lista de Nós e Arestas.
3.  **Visualização**: O React renderiza os componentes visuais.
4.  **Edição**: O usuário manipula os nós (move, conecta, edita valores). O Zustand atualiza o estado.
5.  **Geração**: Imediatamente após a mudança, o `CodeGenerator` (Recast) reconstrói a string de código a partir do estado atual dos nós.
6.  **Persistência**: Se o Auto-Save estiver ligado, o Renderer solicita ao Main Process que escreva o novo código no disco.

## Tecnologias Chave

### Manipulação de AST (Abstract Syntax Tree)
A característica mais complexa do projeto é a tradução bidirecional entre código e grafo.
- **Entrada (Code -> Flow)**: O código é parseado em AST. Um "Dispatcher" percorre a árvore e cria nós visuais correspondentes para estruturas suportadas (If, While, For, Switch, CallExpression).
- **Saída (Flow -> Code)**: Os nós visuais são convertidos de volta para AST. O `Recast` é usado para preservar a formatação original do código onde possível, embora a regeneração completa seja comum.

### Execução de Código
Existem dois modos de execução:
1.  **Web Worker (Sandbox)**: Para execução rápida e segura de lógica pura (sem acesso a DOM ou Node.js). Usado para avaliar expressões em tempo real.
2.  **Terminal (PTY)**: Para executar o arquivo real com `node`. O Main Process spawna um shell e conecta a entrada/saída a um componente `xterm.js` no Renderer via IPC.

## Estrutura de Diretórios

```
/
├── electron/          # Código do Processo Principal
│   ├── main.ts        # Entry point
│   ├── preload.ts     # Ponte de segurança (ContextBridge)
│   └── services/      # Lógica de negócios do backend (ex: Plugins)
├── src/               # Código do Processo de Renderização (React)
│   ├── components/    # UI Kit Genérico (Button, Modal, Input)
│   ├── features/      # Módulos de Domínio (Editor, Git, Execution, etc.)
│   │   ├── editor/    # Nós, Lógica AST, Componentes Visuais
│   │   ├── git/       # Controle de Versão e Terminal
│   │   └── ...        # Outras features
│   ├── layout/        # Componentes de Layout Macro (Header, Sidebar)
│   ├── store/         # Configuração Root da Store (Zustand)
│   └── workers/       # Web Workers
└── docs/              # Esta documentação
```
