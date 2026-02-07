import { contextBridge, ipcRenderer } from 'electron';
import type { ExecutionPayload, ExecutionError, BenchmarkResult } from './types';

contextBridge.exposeInMainWorld('electron', {
    // Dialogs & Window
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    openSystemTerminal: (path: string) => ipcRenderer.invoke('open-system-terminal', path),
    windowMinimize: () => ipcRenderer.send('window-minimize'),
    windowMaximize: () => ipcRenderer.send('window-maximize'),
    windowClose: () => ipcRenderer.send('window-close'),
    appReady: () => ipcRenderer.send('app-ready'),

    // File System API (Unified)
    fileSystem: {
        readDir: (path: string) => ipcRenderer.invoke('read-dir', path),
        readFile: (path: string) => ipcRenderer.invoke('read-file', path),
        writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
        createFile: (path: string, content?: string) => ipcRenderer.invoke('create-file', path, content),
        createDirectory: (path: string) => ipcRenderer.invoke('create-directory', path),
        delete: (path: string) => ipcRenderer.invoke('delete-file-or-folder', path),
        move: (source: string, target: string) => ipcRenderer.invoke('move-file', source, target),
        checkExists: (path: string) => ipcRenderer.invoke('check-path-exists', path),
        checkPathsExists: (paths: string[]) => ipcRenderer.invoke('check-paths-exists', paths),
        getStats: (path: string) => ipcRenderer.invoke('get-file-stats', path),
        ensureProjectConfig: (path: string) => ipcRenderer.invoke('ensure-project-config', path),
    },

    // Git
    gitCommand: (dirPath: string, args: string[]) => ipcRenderer.invoke('git-command', dirPath, args),

    // Terminal
    terminalCreate: (options: { cwd: string }) => ipcRenderer.send('terminal-create', options),
    terminalSendInput: (data: string) => ipcRenderer.send('terminal-input', data),
    terminalOnData: (callback: (data: string) => void) => {
        const subscription = (_event: unknown, data: string) => callback(data);
        ipcRenderer.on('terminal-data', subscription);
        return () => ipcRenderer.removeListener('terminal-data', subscription);
    },
    terminalResize: (cols: number, rows: number) => ipcRenderer.send('terminal-resize', { cols, rows }),
    terminalKill: () => ipcRenderer.send('terminal-kill'),

    // Plugins
    discoverPlugins: () => ipcRenderer.invoke('plugins:discover'),
    togglePlugin: (id: string, enabled: boolean) => ipcRenderer.invoke('plugins:toggle', id, enabled),
    installPlugin: () => ipcRenderer.invoke('plugins:install'),
    uninstallPlugin: (id: string) => ipcRenderer.invoke('plugins:uninstall', id),
    onPluginNotification: (callback: (data: { message: string }) => void) => {
        const subscription = (_event: unknown, data: { message: string }) => callback(data);
        ipcRenderer.on('plugin:notification', subscription);
        return () => ipcRenderer.removeListener('plugin:notification', subscription);
    },

    // Execution
    executionStart: (code: string, filePath?: string) => ipcRenderer.send('execution:start', code, filePath),
    executionStop: () => ipcRenderer.send('execution:stop'),
    executionCheckAvailability: () => ipcRenderer.invoke('execution:check-availability'),
    executionSetRuntime: (runtime: 'node' | 'bun' | 'deno') => ipcRenderer.send('execution:set-runtime', runtime),
    benchmarkStart: (code: string, line: number, filePath?: string) => ipcRenderer.send('benchmark:start', code, line, filePath),
    onBenchmarkResult: (callback: (results: BenchmarkResult[]) => void) => {
        const subscription = (_event: unknown, results: BenchmarkResult[]) => callback(results);
        ipcRenderer.on('benchmark:result', subscription);
        return () => ipcRenderer.removeListener('benchmark:result', subscription);
    },
    onExecutionLog: (callback: (data: ExecutionPayload) => void) => {
        const subscription = (_event: unknown, data: ExecutionPayload) => callback(data);
        ipcRenderer.on('execution:log', subscription);
        return () => ipcRenderer.removeListener('execution:log', subscription);
    },
    onExecutionError: (callback: (error: ExecutionError | string) => void) => {
        const subscription = (_event: unknown, error: ExecutionError | string) => callback(error);
        ipcRenderer.on('execution:error', subscription);
        return () => ipcRenderer.removeListener('execution:error', subscription);
    },
    onExecutionClear: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on('execution:clear', subscription);
        return () => ipcRenderer.removeListener('execution:clear', subscription);
    },
    onExecutionStarted: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on('execution:started', subscription);
        return () => ipcRenderer.removeListener('execution:started', subscription);
    },
    onExecutionDone: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on('execution:done', subscription);
        return () => ipcRenderer.removeListener('execution:done', subscription);
    },
    onSystemStats: (callback: (data: { cpu: number }) => void) => {
        const subscription = (_event: unknown, data: { cpu: number }) => callback(data);
        ipcRenderer.on('system:stats', subscription);
        return () => ipcRenderer.removeListener('system:stats', subscription);
    },
    // MCP Sync
    mcpSyncState: (state: unknown) => ipcRenderer.send('mcp:sync-state', state)
});
