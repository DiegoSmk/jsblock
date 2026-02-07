import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

export interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
}

export class WorkspaceService {
    private watcher: chokidar.FSWatcher | null = null;
    private currentRoot: string | null = null;
    private mainWindow: BrowserWindow | null = null;

    constructor() { }

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
    }

    registerHandlers() {
        ipcMain.handle('workspace:open-folder', async () => {
            if (!this.mainWindow) return null;

            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory']
            });

            if (result.canceled || result.filePaths.length === 0) {
                return null;
            }

            const folderPath = result.filePaths[0];
            await this.setupWatcher(folderPath);
            return {
                path: folderPath,
                tree: await this.getFileTree(folderPath)
            };
        });

        ipcMain.handle('workspace:get-tree', async (_event, folderPath: string) => {
            return await this.getFileTree(folderPath);
        });
    }

    private async setupWatcher(folderPath: string) {
        if (this.watcher) {
            await this.watcher.close();
        }

        this.currentRoot = folderPath;
        this.watcher = chokidar.watch(folderPath, {
            ignored: [/(^|[\/\\])\../, '**/node_modules/**', '**/.git/**'],
            persistent: true,
            ignoreInitial: true,
            depth: 99
        });

        this.watcher.on('all', async (event: string, filePath: string) => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                const tree = await this.getFileTree(this.currentRoot!);
                this.mainWindow.webContents.send('workspace:updated', {
                    event,
                    path: filePath,
                    tree
                });
            }
        });
    }

    private async getFileTree(folderPath: string): Promise<FileNode[]> {
        try {
            const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
            const nodes: FileNode[] = [];

            for (const entry of entries) {
                const fullPath = path.join(folderPath, entry.name);

                // Simple ignore list
                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
                    continue;
                }

                if (entry.isDirectory()) {
                    nodes.push({
                        name: entry.name,
                        path: fullPath,
                        isDirectory: true,
                        children: await this.getFileTree(fullPath)
                    });
                } else {
                    nodes.push({
                        name: entry.name,
                        path: fullPath,
                        isDirectory: false
                    });
                }
            }

            // Sort: Directories first, then alphabetically
            return nodes.sort((a, b) => {
                if (a.isDirectory === b.isDirectory) {
                    return a.name.localeCompare(b.name);
                }
                return a.isDirectory ? -1 : 1;
            });
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }

    stop() {
        if (this.watcher) {
            void this.watcher.close();
            this.watcher = null;
        }
    }
}
