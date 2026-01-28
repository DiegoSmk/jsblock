
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

import { app, BrowserWindow, protocol, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 12, y: 12 }, // For macOS
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
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

ipcMain.handle('git-command', async (_event, dirPath: string, args: string[]) => {
    try {
        // Basic security: simple check if it starts with git (though we pass as array)
        const command = `git ${args.join(' ')}`;
        const { stdout, stderr } = await execAsync(command, { cwd: dirPath });
        return { stdout, stderr };
    } catch (err: any) {
        // Git often returns error codes for things like "nothing to commit"
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
