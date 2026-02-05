# Lógica Visual (AST & Transformação)

Este módulo é o "cérebro" do JS Block, responsável por converter texto em diagrama e diagrama em texto.

## Code Parser (`src/logic/CodeParser.ts`)

O Parser transforma código JavaScript em nós do React Flow.

### Fluxo
1.  **Input**: String de código.
2.  **Parse**: `@babel/parser` gera a AST (Abstract Syntax Tree).
3.  **Dispatch**: Um `Dispatcher` percorre o corpo do programa (Statement por Statement).
4.  **Criação de Nós**:
    - Identifica tipos (VariableDeclaration, FunctionCall, IfStatement, etc.).
    - Cria objetos `AppNode` com posição calculada.
    - Cria `Edges` (arestas) conectando o fluxo (`flow-next`, `flow-true`, etc.).

### Contexto
O parser mantém um `ParserContext` que rastreia:
- `nodes`: Lista acumulada de nós.
- `edges`: Lista acumulada de arestas.
- `varMap`: Mapeamento de variáveis para conectar inputs automaticamente.

## Code Generator (`src/logic/CodeGenerator.ts`)

O Generator faz o caminho inverso: pega o grafo visual e atualiza o código. Ele usa a biblioteca `recast` para tentar manter a formatação original do código do usuário.

### Estratégia de Reconstrução

Ao invés de gerar o código do zero (o que perderia comentários e formatação), o Generator segue estes passos:

1.  **Parse do Código Atual**: Gera AST do código existente.
2.  **Mapeamento**: Cria mapas de conexões baseados nas arestas atuais do grafo.
3.  **Reorganização de Blocos**:
    - Detecta conexões de fluxo (ex: "If True" -> "Console Log").
    - Move os Statements na AST para dentro dos blocos corretos (ex: move o `console.log` para dentro do `consequent` do `IfStatement`).
    - *Isso permite que o usuário arraste conexões visualmente e o código mude de escopo.*
4.  **Atualização de Expressões**:
    - Percorre a AST usando `types.visit`.
    - Para cada nó (If, Call, BinaryExpr), verifica se há inputs conectados no grafo.
    - Se houver, substitui a expressão na AST (ex: muda `if (a)` para `if (b)` se o usuário conectou a variável `b`).
5.  **Print**: O `recast.print` gera a string final.

## Desafios e Anti-Patterns

### 1. Dependência de Índices
O sistema depende fortemente da ordem dos statements.
- Os IDs dos nós são gerados como `call-exec-0`, `if-1`, etc.
- **Problema**: Se o usuário inserir uma linha manualmente no editor de texto, todos os índices mudam, potencialmente quebrando as conexões visuais se o estado não for perfeitamente sincronizado.

### 2. Complexidade do Generator
O arquivo `CodeGenerator.ts` é complexo e imperativo. A lógica de `reorganizeASTBasedOnFlow` manipula arrays de statements manualmente, o que é propenso a erros.

### 3. Tipagem
Uso excessivo de `any` e type casting nas visitas da AST (`path.node as IfStatement`). Isso reduz a segurança da refatoração.
