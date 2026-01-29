
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

import { app, BrowserWindow, protocol, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import * as pty from 'node-pty';
import os from 'os';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

// Disable Autofill to check if it suppresses "Request Autofill.enable failed" errors
app.commandLine.appendSwitch('disable-features', 'Autofill');


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
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Use app.isPackaged for reliable path resolution
    const splashPath = !app.isPackaged
        ? path.join(__dirname, '../../public/splash.html')
        : path.join(__dirname, '../public/splash.html');

    splashWindow.loadFile(splashPath);
    splashWindow.center();
}

function createWindow() {
    const startLoadTime = Date.now();

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Don't show until ready
        backgroundColor: '#0f172a', // Match app's dark theme background
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 12, y: 12 }, // For macOS
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
    });

    // Surgical transition: Close splash and show main window only when UI is 100% ready
    ipcMain.once('app-ready', () => {
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
        mainWindow.loadFile(path.join(__dirname, '../index.html'));
    } else {
        mainWindow.loadURL('http://localhost:5173');
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createSplashWindow();
    createWindow();

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
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
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

ipcMain.handle('check-path-exists', async (_event, pathToCheck: string) => {
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

ipcMain.handle('open-system-terminal', async (_event, dirPath: string) => {
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
    } catch (err: any) {
        return { stdout: err.stdout || '', stderr: err.stderr || err.message };
    }
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

ipcMain.on('terminal-create', (event, options: { cwd: string }) => {
    // Kill existing process if any
    if (ptyProcess) {
        ptyProcess.kill();
        ptyProcess = null;
    }

    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

    ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: options.cwd || os.homedir(),
        env: process.env as any
    });

    ptyProcess.onData((data) => {
        mainWindow?.webContents.send('terminal-data', data);
    });

    ptyProcess.onExit(() => {
        mainWindow?.webContents.send('terminal-data', '\r\n[Processo finalizado]\r\n');
        ptyProcess = null;
    });
});

ipcMain.on('terminal-input', (event, data: string) => {
    ptyProcess?.write(data);
});

ipcMain.on('terminal-resize', (event, { cols, rows }: { cols: number, rows: number }) => {
    ptyProcess?.resize(cols, rows);
});

ipcMain.on('terminal-kill', () => {
    ptyProcess?.kill();
    ptyProcess = null;
});

// Ensure cleanup on quit
app.on('will-quit', () => {
    ptyProcess?.kill();
});
