
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import * as pty from 'node-pty';
import os from 'os';
import { PluginManager } from './services/PluginManager';
import { ExecutionManager } from './services/ExecutionManager';

const execFileAsync = promisify(execFile);
// const execAsync = promisify(exec); // unused

// Disable hardware acceleration to avoid some GPU-related errors and suppress autofill warnings
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-features', 'PasswordManager,PasswordGeneration');
app.commandLine.appendSwitch('disable-autofill-keyboard-accessor-view', 'true');


let mainWindow: BrowserWindow | null;
let splashWindow: BrowserWindow | null;

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 400,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        icon: path.join(__dirname, '../../build/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Use app.isPackaged for reliable path resolution
    const splashPath = !app.isPackaged
        ? path.join(__dirname, '../../public/splash.html')
        : path.join(__dirname, '../public/splash.html');

    void splashWindow.loadFile(splashPath);
    splashWindow.center();
}

function createWindow() {
    const startLoadTime = Date.now();

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false, // Don't show until ready
        backgroundColor: '#0f172a', // Match app's dark theme background
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 12, y: 12 }, // For macOS
        icon: path.join(__dirname, '../../build/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
    });

    // Surgical transition: Close splash and show main window only when UI is 100% ready
    // Failsafe: if the app takes more than 5s to send app-ready, show it anyway
    const fallbackTimeout = setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            console.warn('App ready timeout - showing main window as fallback');
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.close();
                splashWindow = null;
            }
            mainWindow.show();
        }
    }, 8000); // 8 seconds is a safe margin for slow dev environments

    ipcMain.once('app-ready', () => {
        clearTimeout(fallbackTimeout);
        const elapsedTime = Date.now() - startLoadTime;
        const minimumTime = 1000;
        const remainingTime = Math.max(0, minimumTime - elapsedTime);

        setTimeout(() => {
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.close();
                splashWindow = null;
            }
            mainWindow?.show();
        }, remainingTime);
    });

    if (app.isPackaged) {
        void mainWindow.loadFile(path.join(__dirname, '../index.html'));
    } else {
        void mainWindow.loadURL('http://localhost:5173');
    }

    // Add failure logging
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
        if (errorCode === -102) { // ERR_CONNECTION_REFUSED
            console.error('Connection refused. Is the dev server (Vite) running on http://localhost:5173?');
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // --- MCP LOG CAPTURE ---
    const logPath = path.join(app.getAppPath(), 'app.log');
    const logToFile = (msg: string) => {
        const timestamp = new Date().toISOString();
        try {
            fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
        } catch {
            // Can't use console.error here if we're overriding it
        }
    };

    // Override Main Process console
    /* eslint-disable no-console */
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: unknown[]) => {
        originalLog(...args);
        logToFile(`[MAIN][INFO] ${args.map(a => (a !== null && typeof a === 'object') ? JSON.stringify(a) : String(a)).join(' ')}`);
    };
    console.warn = (...args: unknown[]) => {
        originalWarn(...args);
        logToFile(`[MAIN][WARN] ${args.map(a => (a !== null && typeof a === 'object') ? JSON.stringify(a) : String(a)).join(' ')}`);
    };
    console.error = (...args: unknown[]) => {
        originalError(...args);
        logToFile(`[MAIN][ERROR] ${args.map(a => (a !== null && typeof a === 'object') ? JSON.stringify(a) : String(a)).join(' ')}`);
    };
    /* eslint-enable no-console */

    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        const levels = ['Debug', 'Info', 'Warn', 'Error'];
        const lvlName = levels[level] || 'Log';
        logToFile(`[RENDERER][${lvlName}] ${message} (at ${sourceId}:${line})`);
    });

    logToFile('--- NEW SESSION STARTED ---');
}

const pluginManager = new PluginManager();
const executionManager = new ExecutionManager();

void app.whenReady().then(() => {
    createSplashWindow();
    createWindow();
    if (mainWindow) {
        pluginManager.setMainWindow(mainWindow);
        executionManager.setMainWindow(mainWindow);
    }

    // Initial discovery and host start
    pluginManager.discoverPlugins();
    pluginManager.startExtensionHost();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('ensure-project-config', async (_event, folderPath: string) => {
    try {
        const blockPath = path.join(folderPath, '.block');
        if (!fs.existsSync(blockPath)) {
            await fs.promises.mkdir(blockPath, { recursive: true });

            // Create default settings.json
            const settingsPath = path.join(blockPath, 'settings.json');
            if (!fs.existsSync(settingsPath)) {
                await fs.promises.writeFile(settingsPath, JSON.stringify({
                    theme: 'dark',
                    zoom: 1,
                    lastOpenedFile: null
                }, null, 2));
            }
        }
        return true;
    } catch (err) {
        console.error('Error ensuring project config:', err);
        return false;
    }
});

// IPC Handlers for File System
ipcMain.handle('select-folder', async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const result = await dialog.showOpenDialog(win!, {
        properties: ['openDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
});

ipcMain.handle('read-dir', async (_event, dirPath: string) => {
    try {
        const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
        return files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            path: path.join(dirPath, file.name)
        }));
    } catch (err) {
        console.error('Error reading directory:', err);
        return [];
    }
});

ipcMain.handle('read-file', async (_event, filePath: string) => {
    try {
        return await fs.promises.readFile(filePath, 'utf-8');
    } catch (err) {
        console.error('Error reading file:', err);
        throw err;
    }
});

ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    try {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return true;
    } catch (err) {
        console.error('Error writing file:', err);
        throw err;
    }
});

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
ipcMain.handle('create-file', async (_event, filePath: string, content: string = '') => {
    try {
        if (fs.existsSync(filePath)) {
            throw new Error('Arquivo já existe');
        }
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return true;
    } catch (err) {
        console.error('Error creating file:', err);
        throw err;
    }
});


ipcMain.handle('create-directory', async (_event, dirPath: string) => {
    try {
        if (fs.existsSync(dirPath)) {
            throw new Error('Diretório já existe');
        }
        await fs.promises.mkdir(dirPath, { recursive: true });
        return true;
    } catch (err) {
        console.error('Error creating directory:', err);
        throw err;
    }
});

ipcMain.handle('check-path-exists', (_event, pathToCheck: string) => {
    try {
        return fs.existsSync(pathToCheck);
    } catch (err) {
        console.error('Error checking path existence:', err);
        return false;
    }
});

ipcMain.handle('move-file', async (_event, oldPath: string, newPath: string) => {
    try {
        await fs.promises.rename(oldPath, newPath);
        return true;
    } catch (err) {
        console.error('Error moving file:', err);
        throw err;
    }
});

// Generic delete for files or folders (New API)
ipcMain.handle('delete-file-or-folder', async (_event, pathToDelete: string) => {
    try {
        await fs.promises.rm(pathToDelete, { recursive: true, force: true });
        return true;
    } catch (err) {
        console.error('Error deleting item:', err);
        throw err;
    }
});

ipcMain.handle('get-file-stats', async (_event, pathStr: string) => {
    try {
        const stats = await fs.promises.stat(pathStr);
        return {
            size: stats.size,
            mtime: stats.mtime.getTime(),
            isDirectory: stats.isDirectory()
        };
    } catch (err) {
        console.error('Error getting stats:', err);
        throw err;
    }
});

ipcMain.handle('open-system-terminal', (_event, dirPath: string) => {
    try {
        if (process.platform === 'linux') {
            // Try common terminal emulators
            exec(`gnome-terminal --working-directory="${dirPath}"`, (err) => {
                if (err) exec(`konsole --workdir "${dirPath}"`, (err) => {
                    if (err) exec(`xfce4-terminal --working-directory="${dirPath}"`, (err) => {
                        if (err) exec(`xterm -e "cd ${dirPath} && bash"`);
                    });
                });
            });
        } else if (process.platform === 'win32') {
            exec(`start cmd /K "cd /d ${dirPath}"`);
        } else if (process.platform === 'darwin') {
            exec(`open -a Terminal "${dirPath}"`);
        }
        return true;
    } catch (err) {
        console.error('Error opening system terminal:', err);
        return false;
    }
});

ipcMain.handle('git-command', async (_event, dirPath: string, args: string[]) => {
    try {
        const { stdout, stderr } = await execFileAsync('git', args, { cwd: dirPath });
        return { stdout, stderr };
    } catch (err: unknown) {
        const error = err as { stdout?: string; stderr?: string; message?: string };
        return { stdout: error.stdout ?? '', stderr: error.stderr ?? error.message ?? String(err) };
    }
});

// Plugin System Handlers
ipcMain.handle('plugins:discover', () => {
    return pluginManager.discoverPlugins();
});

ipcMain.handle('plugins:toggle', (_event, id: string, enabled: boolean) => {
    pluginManager.togglePlugin(id, enabled);
    return true;
});

ipcMain.handle('plugins:install', async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const result = await dialog.showOpenDialog(win!, {
        properties: ['openDirectory'],
        title: 'Selecionar pasta do Plugin'
    });

    if (result.canceled) return null;

    try {
        return pluginManager.installPlugin(result.filePaths[0]);
    } catch (err) {
        console.error('Failed to install plugin:', err);
        throw err;
    }
});

ipcMain.handle('plugins:uninstall', (_event, id: string) => {
    pluginManager.uninstallPlugin(id);
    return true;
});

// Execution Manager Handlers
ipcMain.on('execution:start', (_event, code: string, filePath?: string) => {
    void executionManager.startExecution(code, filePath);
});

ipcMain.on('execution:stop', () => {
    executionManager.stopExecution();
});

ipcMain.on('execution:set-runtime', (_event, runtime: 'node' | 'bun' | 'deno') => {
    executionManager.setRuntime(runtime);
});

ipcMain.on('benchmark:start', (_event, code: string, line: number, filePath?: string) => {
    void executionManager.startBenchmark(code, line, filePath);
});

ipcMain.handle('execution:check-availability', async () => {
    return await executionManager.checkAvailability();
});

// MCP Sync State Handler
let isSyncingState = false;
let pendingSyncState: { data: unknown } | null = null;

ipcMain.on('mcp:sync-state', (_event, state: unknown) => {
    if (isSyncingState) {
        pendingSyncState = { data: state };
        return;
    }

    isSyncingState = true;
    const statePath = path.join(app.getAppPath(), 'state.json');

    const writeLoop = async (data: unknown) => {
        try {
            await fs.promises.writeFile(statePath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (err) {
            console.error('Failed to sync state to file', err);
        } finally {
            if (pendingSyncState) {
                const nextState = pendingSyncState.data;
                pendingSyncState = null;
                void writeLoop(nextState);
            } else {
                isSyncingState = false;
            }
        }
    };

    void writeLoop(state);
});


// Window Control Handlers
ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

ipcMain.on('window-close', () => {
    mainWindow?.close();
});

// --- Terminal (PTY) Management ---
let ptyProcess: pty.IPty | null = null;
let currentTerminalId = 0;

ipcMain.on('terminal-create', (event, options: { cwd: string }) => {
    const terminalId = ++currentTerminalId;

    if (ptyProcess) {
        try {
            ptyProcess.kill();
        } catch {
            // Ignore error if process already dead
        }
        ptyProcess = null;
    }

    let shell = 'bash';
    let args: string[] = ['-i'];

    if (process.platform === 'win32') {
        shell = 'powershell.exe';
        args = [];
    } else {
        // Use user's preferred shell if available
        shell = process.env.SHELL ?? (process.platform === 'darwin' ? 'zsh' : 'bash');
        args = process.platform === 'darwin' ? ['-l'] : ['-i'];
    }

    const workingDir = options.cwd && fs.existsSync(options.cwd) ? options.cwd : os.homedir();

    try {
        const newPty = pty.spawn(shell, args, {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd: workingDir,
            env: {
                ...process.env,
                TERM: 'xterm-256color',
                COLORTERM: 'truecolor',
                LANG: process.env.LANG ?? 'en_US.UTF-8'
            } as Record<string, string>
        });

        newPty.onData((data) => {
            if (currentTerminalId === terminalId) {
                mainWindow?.webContents.send('terminal-data', data);
            }
        });

        newPty.onExit(({ exitCode, signal }) => {
            if (currentTerminalId === terminalId) {
                mainWindow?.webContents.send('terminal-data', `\r\n[Processo finalizado com código ${exitCode}${signal ? ` e sinal ${signal}` : ''}]\r\n`);
                if (ptyProcess === newPty) {
                    ptyProcess = null;
                }
            }
        });

        ptyProcess = newPty;
    } catch (err) {
        console.error('Failed to spawn terminal:', err);
        if (currentTerminalId === terminalId) {
            mainWindow?.webContents.send('terminal-data', `\r\n[Erro ao iniciar terminal: ${err instanceof Error ? err.message : String(err)}]\r\n`);
        }
    }
});

ipcMain.on('terminal-input', (event, data: string) => {
    ptyProcess?.write(data);
});

ipcMain.on('terminal-resize', (event, { cols, rows }: { cols: number, rows: number }) => {
    ptyProcess?.resize(cols, rows);
});

ipcMain.on('terminal-kill', () => {
    // Incrementing ID invalidates any pending exit callbacks from the current process
    currentTerminalId++;
    if (ptyProcess) {
        ptyProcess.kill();
        ptyProcess = null;
    }
});

// Ensure cleanup on quit
app.on('will-quit', () => {
    ptyProcess?.kill();
});
