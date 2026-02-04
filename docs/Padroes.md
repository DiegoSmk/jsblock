# Padrões e Convenções

## Nomenclatura

### Arquivos
- **Componentes React**: PascalCase (ex: `FlowContent.tsx`, `SidebarContainer.tsx`).
- **Hooks e Stores**: camelCase, prefixo `use` (ex: `useStore.ts`).
- **Classes/Lógica**: PascalCase (ex: `CodeParser.ts`).
- **Backend Services**: PascalCase (ex: `PluginManager.ts`).

### IDs e Chaves
- **Nós (Nodes)**: kebab-case com prefixo de tipo e índice/ID único.
  - `if-0`, `call-exec-5`, `var-myVariable`.
- **Handles (XYFlow)**: kebab-case descritivo.
  - `flow-in`: Entrada de fluxo de execução (topo).
  - `flow-next` / `flow-out`: Saída de fluxo (fundo).
  - `flow-true` / `flow-false`: Saídas condicionais.
  - `input-a`, `input-b`: Entradas de dados.
- **Canais IPC**: kebab-case (ex: `read-file`, `terminal-create`).

## Padrões de Código

### Store (Zustand)
- Evite lógica complexa dentro do `useStore`. Prefira extrair para funções puras em `src/logic`.
- Use Slices para dividir domínios diferentes (como `gitSlice`).

### Componentes de Nó
- Devem ser puramente visuais sempre que possível.
- Dados persistentes devem ficar em `data` (propriedade do React Flow) e não em `state` local do componente, para sobreviverem a remontagens.

### Tratamento de Erros
- **Backend**: Use blocos `try/catch` em handlers IPC. Evite derrubar a aplicação inteira.
- **Frontend**: Use `console.error` para bugs, mas mostre `toasts` para erros operacionais (ex: falha ao salvar arquivo).

## Estilização
- Cores de borda/handle devem seguir o tipo semântico:
  - **Azul**: Fluxo de execução / Função.
  - **Roxo**: Lógica / Controle.
  - **Verde**: Sucesso / String.
  - **Amarelo**: Aviso / Número.
  - **Vermelho**: Erro / Exceção.
