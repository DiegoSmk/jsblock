
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
import { WorkspaceService } from './services/WorkspaceService';
import { windowManager, WindowType, WindowOptions } from './services/WindowManager';
import { SecurityUtils } from './utils/SecurityUtils';

const execFileAsync = promisify(execFile);

// Enable transparency support for Linux
if (process.platform === 'linux') {
    app.commandLine.appendSwitch('enable-transparent-visuals');
}

app.commandLine.appendSwitch('disable-features', 'PasswordManager,PasswordGeneration');
app.commandLine.appendSwitch('disable-autofill-keyboard-accessor-view', 'true');

// --- Logging Configuration ---
let logStream: fs.WriteStream | null = null;
let logToFile: (msg: string) => void = (msg: string) => {
    // Early fallback before setupLogging
    process.stdout.write(`[PRE-INIT] ${msg}\n`);
};

function setupLogging() {
    try {
        const logPath = path.join(app.getPath('userData'), 'app.log');
        logStream = fs.createWriteStream(logPath, { flags: 'a' });

        logStream.on('error', (err) => {
            process.stderr.write(`[LOG ERROR] Failed to write to log file: ${err.message}\n`);
        });

        logToFile = (msg: string) => {
            const timestamp = new Date().toISOString();
            if (logStream && !logStream.destroyed && logStream.writable) {
                logStream.write(`[${timestamp}] ${msg}\n`);
            }
        };

        // Override console globally
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
    } catch (err) {
        process.stderr.write(`[FATAL] Failed to setup logging: ${String(err)}\n`);
    }
}

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

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
        show: false,
        backgroundColor: '#0f172a',
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 12, y: 12 },
        icon: path.join(__dirname, '../../build/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
    });

    const fallbackTimeout = setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            console.warn('App ready timeout - showing main window as fallback');
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.close();
                splashWindow = null;
            }
            mainWindow.show();
        }
    }, 8000);

    ipcMain.once('app-ready', () => {
        console.warn('IPC: app-ready received from frontend');
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
        const tryLoad = async (port: number) => {
            try {
                await mainWindow?.loadURL(`http://localhost:${port}`);
                return true;
            } catch {
                return false;
            }
        };

        void (async () => {
            if (await tryLoad(5173)) return;
            if (await tryLoad(5174)) return;
        })();
    }

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        if (errorCode === -102) return;
        console.error(`Failed to load ${validatedURL}:`, errorCode, errorDescription);
    });

    mainWindow.on('closed', () => {
        windowManager.closeAllWindows();
        mainWindow = null;
    });

    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        const levels = ['Debug', 'Info', 'Warn', 'Error'];
        const lvlName = levels[level] || 'Log';
        logToFile(`[RENDERER][${lvlName}] ${message} (at ${sourceId}:${line})`);
    });

    logToFile('--- NEW SESSION STARTED ---');
}

const pluginManager = new PluginManager();
const executionManager = new ExecutionManager();
const workspaceService = new WorkspaceService();

void app.whenReady().then(() => {
    setupLogging();
    createSplashWindow();
    createWindow();
    if (mainWindow) {
        pluginManager.setMainWindow(mainWindow);
        executionManager.setMainWindow(mainWindow);
        workspaceService.setMainWindow(mainWindow);
        windowManager.setMainWindow(mainWindow);
    }

    // Register handlers
    workspaceService.registerHandlers();

    // Initial discovery and host start
    void pluginManager.discoverPlugins();
    void pluginManager.startExtensionHost();

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
        SecurityUtils.validatePath(folderPath);
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

ipcMain.handle('check-paths-exists', async (_event, paths: string[]) => {
    try {
        const results: Record<string, boolean> = {};
        await Promise.all(paths.map(async (pathToCheck) => {
            try {
                // We do NOT validate path here because we want to check existence
                // of recent files that might not be authorized yet.
                await fs.promises.access(pathToCheck);
                results[pathToCheck] = true;
            } catch {
                results[pathToCheck] = false;
            }
        }));
        return results;
    } catch (err) {
        console.error('Error checking paths existence:', err);
        return {};
    }
});

// IPC Handlers for File System
ipcMain.handle('select-folder', async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const result = await dialog.showOpenDialog(win!, {
        properties: ['openDirectory']
    });
    if (result.canceled) return null;
    const selectedPath = result.filePaths[0];
    SecurityUtils.authorizePath(selectedPath);
    return selectedPath;
});

ipcMain.handle('read-dir', async (_event, dirPath: string) => {
    try {
        SecurityUtils.validatePath(dirPath);
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
        SecurityUtils.validatePath(filePath);
        return await fs.promises.readFile(filePath, 'utf-8');
    } catch (err) {
        console.error('Error reading file:', err);
        throw err;
    }
});

ipcMain.handle('read-multiple-files', async (_event, filePaths: string[]) => {
    try {
        const results: Record<string, string> = {};
        await Promise.all(filePaths.map(async (filePath) => {
            try {
                SecurityUtils.validatePath(filePath);
                const content = await fs.promises.readFile(filePath, 'utf-8');
                results[filePath] = content;
            } catch (err) {
                console.error(`Error reading file ${filePath} in bulk:`, err);
                results[filePath] = '';
            }
        }));
        return results;
    } catch (err) {
        console.error('Error reading multiple files:', err);
        return {};
    }
});

ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    try {
        SecurityUtils.validatePath(filePath);
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
        SecurityUtils.validatePath(filePath);
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
        SecurityUtils.validatePath(dirPath);
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
        // We do not validate path for simple existence check
        return fs.existsSync(pathToCheck);
    } catch (err) {
        console.error('Error checking path existence:', err);
        return false;
    }
});

ipcMain.handle('move-file', async (_event, oldPath: string, newPath: string) => {
    try {
        SecurityUtils.validatePath(oldPath);
        SecurityUtils.validatePath(newPath);
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
        SecurityUtils.validatePath(pathToDelete);
        await fs.promises.rm(pathToDelete, { recursive: true, force: true });
        return true;
    } catch (err) {
        console.error('Error deleting item:', err);
        throw err;
    }
});

ipcMain.handle('get-file-stats', async (_event, pathStr: string) => {
    try {
        SecurityUtils.validatePath(pathStr);
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
        SecurityUtils.validatePath(dirPath);

        if (process.platform === 'linux') {
            const terminals = [
                { bin: 'gnome-terminal', args: ['--working-directory', dirPath] },
                { bin: 'konsole', args: ['--workdir', dirPath] },
                { bin: 'xfce4-terminal', args: ['--working-directory', dirPath] },
                // xterm is more tricky with working directory, using a shell wrapper if needed
                { bin: 'xterm', args: ['-e', `cd "${dirPath.replace(/"/g, '\\"')}" && bash`] }
            ];

            const tryTerminal = (index: number) => {
                if (index >= terminals.length) return;
                const { bin, args } = terminals[index];
                execFile(bin, args, (err) => {
                    if (err) tryTerminal(index + 1);
                });
            };
            tryTerminal(0);

        } else if (process.platform === 'win32') {
            // Using 'start' via exec is still shell-based, but we escape carefully.
            // Better: use powershell or a direct process if possible.
            // For Windows cmd /K, we quote the path and ensure cd /d handles drive changes.
            const escapedPath = dirPath.replace(/"/g, '^"');
            exec(`start cmd /K "cd /d \\"${escapedPath}\\""`);
        } else if (process.platform === 'darwin') {
            execFile('open', ['-a', 'Terminal', dirPath]);
        }
        return true;
    } catch (err) {
        console.error('Error opening system terminal:', err);
        return false;
    }
});

ipcMain.handle('git-command', async (_event, dirPath: string, args: string[]) => {
    try {
        SecurityUtils.validatePath(dirPath);
        const { stdout, stderr } = await execFileAsync('git', args, { cwd: dirPath });
        return { stdout, stderr };
    } catch (err: unknown) {
        const error = err as { stdout?: string; stderr?: string; message?: string };
        return { stdout: error.stdout ?? '', stderr: error.stderr ?? error.message ?? String(err) };
    }
});

// Plugin System Handlers
ipcMain.handle('plugins:discover', async () => {
    return await pluginManager.discoverPlugins();
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
        const pluginPath = result.filePaths[0];
        SecurityUtils.authorizePath(pluginPath);
        return pluginManager.installPlugin(pluginPath);
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
let pendingSyncState: unknown = null;

const processSyncState = async () => {
    // If no pending state, we're done
    if (pendingSyncState === null) {
        isSyncingState = false;
        return;
    }

    const state = pendingSyncState;
    pendingSyncState = null; // Clear pending state so new updates can be queued
    const statePath = path.join(app.getAppPath(), 'state.json');

    try {
        await fs.promises.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
        console.error('Failed to sync state to file', err);
    } finally {
        // If new state arrived while writing, process it
        if (pendingSyncState !== null) {
            void processSyncState();
        } else {
            isSyncingState = false;
        }
    }
};

ipcMain.on('mcp:sync-state', (_event, state: unknown) => {
    pendingSyncState = state;
    if (!isSyncingState) {
        isSyncingState = true;
        void processSyncState();
    }
});
// Window Control Handlers
ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
});

ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
        win.unmaximize();
    } else {
        win?.maximize();
    }
});

ipcMain.handle('window:toggle-always-on-top', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        const newState = !win.isAlwaysOnTop();
        win.setAlwaysOnTop(newState);
        return newState;
    }
    return false;
});

ipcMain.handle('window:open', (_event, type: WindowType, options: WindowOptions) => {
    return windowManager.openWindow(type, options);
});

ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
});

// --- Terminal (PTY) Management ---
let ptyProcess: pty.IPty | null = null;
let currentTerminalId = 0;

ipcMain.on('terminal-create', (event, options: { cwd: string }) => {
    void (async () => {
        const terminalId = ++currentTerminalId;

        if (options.cwd) {
            try {
                SecurityUtils.validatePath(options.cwd);
            } catch (err) {
                console.error('Unauthorized terminal creation attempt:', err);
                mainWindow?.webContents.send('terminal-data', `\r\n[Erro: Acesso negado ao diretório ${options.cwd}]\r\n`);
                return;
            }
        }

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

        const workingDirExists = options.cwd ? await fs.promises.access(options.cwd).then(() => true).catch(() => false) : false;
        const workingDir = options.cwd && workingDirExists ? options.cwd : os.homedir();

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
    })();
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
    logStream?.end();
});
