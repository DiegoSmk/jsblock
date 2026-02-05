# Backend (Electron Main Process)

O backend da aplicação é responsável por gerenciar a janela nativa, interagir com o sistema operacional e fornecer capacidades que o navegador (Renderer) não possui por motivos de segurança.

## Arquivos Principais

- `electron/main.ts`: Ponto de entrada. Configura janelas, IPC e PTY.
- `electron/preload.ts`: Script de "ponte" que expõe a API `window.electron` de forma segura.
- `electron/services/PluginManager.ts`: Gerencia a descoberta e carregamento de plugins.

## Inicialização (`main.ts`)

O processo de boot segue a seguinte ordem:
1.  **Desativar Aceleração de Hardware**: Para evitar glitches visuais em algumas GPUs.
2.  **Splash Screen**: Cria e exibe uma janela leve de carregamento.
3.  **Main Window**: Cria a janela principal (oculta).
4.  **Carregamento**: Carrega o `index.html` (prod) ou `localhost:5173` (dev).
5.  **Transição**: Oculta o splash e mostra o main window quando o evento `app-ready` é recebido do Renderer (ou após um timeout de segurança).

## IPC Handlers (Canais de Comunicação)

O Renderer solicita ações via `ipcRenderer.invoke`, e o Main responde.

| Canal | Propósito | Retorno |
|-------|-----------|---------|
| `read-file` | Lê conteúdo de arquivo | `Promise<string>` |
| `write-file` | Escreve conteúdo em arquivo | `Promise<void>` |
| `read-dir` | Lista arquivos de diretório | `Promise<FileEntry[]>` |
| `select-folder` | Abre diálogo nativo de seleção | `Promise<path>` |
| `create-file` | Cria novo arquivo vazio | `Promise<void>` |
| `delete-file-or-folder` | Remove arquivo ou pasta | `Promise<boolean>` |
| `check-path-exists` | Verifica existência de caminho | `boolean` |
| `get-file-stats` | Obtém estatísticas do arquivo | `{ size: number, mtime: number, isDirectory: boolean }` |
| `ensure-project-config` | Cria pasta `.block` se não existir | `Promise<void>` |
| `open-system-terminal` | Abre terminal do OS (gnome, cmd, etc) | `void` |
| `git-command` | Executa comandos git via `execFile` | `{ stdout, stderr }` |

## Terminal Integrado (PTY)

O backend utiliza a biblioteca `node-pty` para criar pseudo-terminais reais. Isso permite que o usuário execute comandos como `npm install` ou `node script.js` dentro da interface do JS Block.

### Fluxo do Terminal
1.  Renderer envia `terminal-create`.
2.  Main cria processo `pty.spawn` (bash/zsh/powershell).
3.  `ptyProcess.onData` envia dados para o Renderer via `terminal-data`.
4.  Renderer envia input do usuário via `terminal-input`.
5.  Main escreve no processo pty.

**Anti-pattern Identificado**: O gerenciamento de IDs de terminal (`currentTerminalId`) é uma variável global simples no `main.ts`. Se houver múltiplas janelas no futuro, isso quebrará.
*Recomendação*: Encapsular a lógica de terminal em uma classe `TerminalManager` que mapeie `WebContents ID` -> `PtyProcess`.

## Plugin Manager

O `PluginManager` escaneia diretórios específicos em busca de extensões. Ele carrega manifestos e gerencia o ciclo de vida (instalar/remover).

```typescript
// Exemplo de uso no Main
const pluginManager = new PluginManager();
pluginManager.discoverPlugins();
```

## Tratamento de Erros

Atualmente, a maioria dos erros é capturada e logada com `console.error`.
**Ponto de Atenção**: Erros no Main Process não são visíveis para o usuário final a menos que sejam explicitamente enviados de volta via IPC ou Toast.
*Sugestão*: Criar um wrapper padrão para handlers IPC que capture erros e retorne um objeto `{ success: false, error: message }` padronizado.
