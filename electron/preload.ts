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
    checkPathExists: (path: string) => ipcRenderer.invoke('check-path-exists', path),
    moveFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('move-file', oldPath, newPath),
    gitCommand: (dirPath: string, args: string[]) => ipcRenderer.invoke('git-command', dirPath, args),

    // Terminal
    terminalCreate: (options: { cwd: string }) => ipcRenderer.send('terminal-create', options),
    terminalSendInput: (data: string) => ipcRenderer.send('terminal-input', data),
    terminalOnData: (callback: (data: string) => void) => {
        const subscription = (_event: any, data: string) => callback(data);
        ipcRenderer.on('terminal-data', subscription);
        return () => ipcRenderer.removeListener('terminal-data', subscription);
    },
    terminalResize: (cols: number, rows: number) => ipcRenderer.send('terminal-resize', { cols, rows }),
    terminalKill: () => ipcRenderer.send('terminal-kill')
});
