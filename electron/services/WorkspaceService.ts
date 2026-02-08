import { ipcMain, dialog, BrowserWindow, utilityProcess, UtilityProcess } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { SearchOptions, SearchResult } from '../types';
import { PathUtils } from '../utils/PathUtils';

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
    private worker: UtilityProcess | null = null;
    private pendingRequests = new Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>();

    constructor() { }

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
    }

    private ensureWorker() {
        if (this.worker) return this.worker;

        const workerPath = path.join(__dirname, '../workers/workspaceWorker.js');
        this.worker = utilityProcess.fork(workerPath, [], {
            stdio: 'inherit'
        });

        this.worker.on('message', (msg: any) => {
            const { id, results, success, error } = msg;
            const request = this.pendingRequests.get(id);
            if (request) {
                if (error) {
                    request.reject(new Error(error));
                } else if (results !== undefined) {
                    request.resolve(results);
                } else {
                    request.resolve(success);
                }
                this.pendingRequests.delete(id);
            }
        });

        this.worker.on('exit', () => {
            this.worker = null;
            // Reject all pending
            this.pendingRequests.forEach(req => req.reject(new Error('Worker exited')));
            this.pendingRequests.clear();
        });

        return this.worker;
    }

    private sendToWorker(type: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);
            this.pendingRequests.set(id, { resolve, reject });
            this.ensureWorker().postMessage({ id, type, payload });
        });
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

            const folderPath = PathUtils.normalize(result.filePaths[0]);
            await this.setupWatcher(folderPath);
            return {
                path: folderPath,
                tree: await this.getFileTree(folderPath)
            };
        });

        ipcMain.handle('workspace:get-tree', async (_event, folderPath: string) => {
            return await this.getFileTree(PathUtils.normalize(folderPath));
        });

        ipcMain.handle('workspace:search', async (_event, query: string, rootPath: string, options: SearchOptions) => {
            return await this.sendToWorker('search', { query, rootPath: PathUtils.normalize(rootPath), options });
        });

        ipcMain.handle('workspace:replace', async (_event, query: string, replacement: string, rootPath: string, options: SearchOptions) => {
            return await this.sendToWorker('replace', { query, replacement, rootPath: PathUtils.normalize(rootPath), options });
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

        // Use a simple debounce for watcher events to avoid spamming tree updates
        let updateTimeout: NodeJS.Timeout | null = null;
        this.watcher.on('all', (event: string, filePath: string) => {
            if (updateTimeout) clearTimeout(updateTimeout);

            updateTimeout = setTimeout(async () => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    const tree = await this.getFileTree(this.currentRoot!);
                    this.mainWindow.webContents.send('workspace:updated', {
                        event,
                        path: PathUtils.normalize(filePath),
                        tree
                    });
                }
            }, 300); // 300ms debounce
        });
    }

    private async getFileTree(folderPath: string): Promise<FileNode[]> {
        try {
            const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
            const nodes: FileNode[] = [];

            for (const entry of entries) {
                const fullPath = PathUtils.join(folderPath, entry.name);

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
        if (this.worker) {
            this.worker.kill();
            this.worker = null;
        }
    }
}
