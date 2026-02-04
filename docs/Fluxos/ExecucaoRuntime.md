# Fluxo de Execução (Runtime)

O JS Block possui dois modos distintos de execução de código, cada um servindo a um propósito diferente.

## 1. Execução "Live" (Web Worker)

Para fornecer feedback imediato no editor visual (mostrando valores em cima das arestas ou nós), o sistema executa o código constantemente em background.

### Arquitetura
- **Arquivo**: `src/workers/runtime.worker.ts`
- **Mecanismo**: `Web Worker` + `new Function()` constructor.
- **Trigger**: Sempre que o código muda (`setCode`), o store coleta expressões de interesse (variáveis, chamadas) e envia para o worker.

### Como Funciona
1.  **Captura**: O store varre os nós e identifica quais expressões precisam ser monitoradas (ex: valor da variável `x`).
2.  **Envio**: Envia `{ code: "const x = 10;", items: [{id: "var-x", expr: "x"}] }` para o worker.
3.  **Wrapper**: O worker envolve o código do usuário em uma função IIFE que retorna um objeto com os valores solicitados.
    ```javascript
    return (function() {
        try {
            const x = 10; // Código do usuário
            return { "var-x": (function(){ return x })() }; // Captura
        } catch { return {}; }
    })()
    ```
4.  **Retorno**: O worker devolve o objeto JSON com os valores calculados, que o store salva em `runtimeValues`.

### Limitações e Segurança
- **Ambiente Isolado**: Roda em uma thread separada, não trava a UI.
- **Sem Node.js**: Não consegue fazer `require('fs')` ou acessar APIs do sistema.
- **Segurança**: Embora rode em worker, ainda é `eval` indireto. Código malicioso pode travar o worker (loop infinito), mas não deve comprometer o sistema principal.

## 2. Execução de Sistema (Node PTY)

Para rodar a aplicação "de verdade", usamos o ambiente Node.js do sistema hospedeiro.

### Arquitetura
- **Frontend**: Componente `Xterm` (xterm.js).
- **Backend**: Biblioteca `node-pty`.

### Fluxo
1.  O usuário clica em "Run" ou abre o terminal.
2.  O Frontend solicita `ipcRenderer.send('terminal-create')`.
3.  O Backend cria um processo filho (bash/zsh/cmd).
4.  O usuário digita `node arquivo.js`.
5.  O processo pty executa o node nativo da máquina.
6.  A saída (stdout/stderr) é enviada via pipe para o backend e depois via IPC para o xterm no frontend.

### Vantagens
- Acesso total às APIs do Node.js.
- Persistência de ambiente (variáveis de ambiente, pasta atual).
- Comportamento idêntico a um terminal externo.
