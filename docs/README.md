# Documentação Técnica - JS Block

Bem-vindo à documentação técnica do projeto **JS Block** (js-blueprints-electron). Este projeto é um ambiente de programação visual para JavaScript e TypeScript, construído sobre Electron e React.

## 📋 Resumo Executivo

O **JS Block** permite que desenvolvedores construam lógica de programação utilizando um editor visual baseado em nós (flow-based programming), mantendo sincronização bidirecional com o código fonte gerado. O sistema é capaz de:
- Analisar código JavaScript/TypeScript existente e gerar um grafo visual.
- Permitir edição visual que atualiza o código em tempo real.
- Executar o código em um ambiente seguro (Web Worker) ou via terminal do sistema (PTY).
- Gerenciar arquivos e projetos locais.

## 🛠️ Stack Tecnológico

- **Runtime:** [Electron](https://www.electronjs.org/) (Main Process)
- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Gerenciamento de Estado:** [Zustand](https://github.com/pmndrs/zustand)
- **Editor Visual:** [@xyflow/react](https://reactflow.dev/) (anteriormente React Flow)
- **Editor de Código:** [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Manipulação de AST:** [Recast](https://github.com/benjamn/recast) + [Babel Parser](https://babeljs.io/docs/babel-parser)
- **Terminal:** [xterm.js](https://xtermjs.org/) + [node-pty](https://github.com/microsoft/node-pty)

## 📚 Estrutura da Documentação

Esta documentação está organizada da seguinte forma:

- **[[Arquitetura.md]]**: Visão geral da arquitetura do sistema e diagramas de alto nível.
- **Componentes**: Detalhamento técnico dos módulos principais.
  - [[Componentes/BackendElectron.md|Backend (Electron)]]: Processo principal, IPC e Sistema de Arquivos.
  - [[Componentes/GerenciamentoEstado.md|Gerenciamento de Estado]]: Store global (Zustand) e persistência.
  - [[Componentes/LogicaVisual.md|Lógica Visual]]: Parsers, Generators e AST.
  - [[Componentes/InterfaceUsuario.md|Interface]]: Componentes React e customização de nós.
- **Fluxos**: Explicação dos processos críticos.
  - [[Fluxos/SincronizacaoCodigo.md|Sincronização Código <-> Visual]]: O coração do sistema.
  - [[Fluxos/ExecucaoRuntime.md|Execução]]: Como o código é rodado.
- **[[Padroes.md]]**: Convenções de código e padrões adotados.

## 🚀 Como Executar

### Pré-requisitos
- Node.js (v18+)
- npm

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
# Inicia o Vite e o Electron em modo de desenvolvimento
npm run electron:dev
```

### Build
```bash
npm run electron:build
```
