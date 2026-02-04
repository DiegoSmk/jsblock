import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    readDir: (path: string) => ipcRenderer.invoke('read-dir', path),
    readFile: (path: string) => ipcRenderer.invoke('read-file', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
    ensureProjectConfig: (path: string) => ipcRenderer.invoke('ensure-project-config', path),
    windowMinimize: () => ipcRenderer.send('window-minimize'),
    windowMaximize: () => ipcRenderer.send('window-maximize'),
    windowClose: () => ipcRenderer.send('window-close'),
    createFile: (path: string, content?: string) => ipcRenderer.invoke('create-file', path, content),
    createDirectory: (path: string) => ipcRenderer.invoke('create-directory', path),
    deleteFile: (path: string) => ipcRenderer.invoke('delete-file', path),
    deleteDirectory: (path: string) => ipcRenderer.invoke('delete-directory', path),
    checkPathExists: (path: string) => ipcRenderer.invoke('check-path-exists', path),
    moveFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('move-file', oldPath, newPath),
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
    openSystemTerminal: (path: string) => ipcRenderer.invoke('open-system-terminal', path),
    appReady: () => ipcRenderer.send('app-ready'),

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
    onExecutionLog: (callback: (data: { type: string, level: string, args: unknown[] }) => void) => {
        const subscription = (_event: unknown, data: { type: string, level: string, args: unknown[] }) => callback(data);
        ipcRenderer.on('execution:log', subscription);
        return () => ipcRenderer.removeListener('execution:log', subscription);
    },
    onExecutionError: (callback: (error: string) => void) => {
        const subscription = (_event: unknown, error: string) => callback(error);
        ipcRenderer.on('execution:error', subscription);
        return () => ipcRenderer.removeListener('execution:error', subscription);
    }
});
