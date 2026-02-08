import { ipcMain, dialog, BrowserWindow, utilityProcess, UtilityProcess } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { SearchOptions, FileNode } from '../shared/ipc-types';
import { PathUtils } from '../utils/PathUtils';

export class WorkspaceService {
    private watcher: chokidar.FSWatcher | null = null;
    private currentRoot: string | null = null;
    private mainWindow: BrowserWindow | null = null;
    private worker: UtilityProcess | null = null;
    private pendingRequests = new Map<string, { resolve: (val: unknown) => void, reject: (err: Error) => void }>();

    private cachedTree: FileNode[] = [];

    // eslint-disable-next-line @typescript-eslint/no-empty-function
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

        this.worker.on('message', (msg: { id: string; results?: unknown; success?: boolean; error?: string }) => {
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

    private sendToWorker(type: string, payload: unknown): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);

            const timeout = setTimeout(() => {
                const pending = this.pendingRequests.get(id);
                if (pending) {
                    pending.reject(new Error(`Operation ${type} timed out after 30s`));
                    this.pendingRequests.delete(id);
                    // Also notify worker to stop if possible
                    if (this.worker) this.worker.postMessage({ id, type: 'cancel', payload: { id } });
                }
            }, 30000);

            this.pendingRequests.set(id, {
                resolve: (val) => {
                    clearTimeout(timeout);
                    resolve(val);
                },
                reject: (err) => {
                    clearTimeout(timeout);
                    reject(err);
                }
            });
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
            this.cachedTree = await this.getFileTree(folderPath); // Full scan once
            await this.setupWatcher(folderPath);
            return {
                path: folderPath,
                tree: this.cachedTree
            };
        });

        ipcMain.handle('workspace:get-tree', async (_event, folderPath: string) => {
            const normalizedPath = PathUtils.normalize(folderPath);
            if (normalizedPath === this.currentRoot) return this.cachedTree;
            return await this.getFileTree(normalizedPath);
        });

        ipcMain.handle('workspace:search', async (_event, query: string, rootPath: string, options: SearchOptions) => {
            // Cancel current action if any
            this.ensureWorker().postMessage({ type: 'cancel' });
            return this.sendToWorker('search', { query, rootPath: PathUtils.normalize(rootPath), options });
        });

        ipcMain.handle('workspace:replace', async (_event, query: string, replacement: string, rootPath: string, options: SearchOptions) => {
            // Cancel current action if any
            this.ensureWorker().postMessage({ type: 'cancel' });
            return this.sendToWorker('replace', { query, replacement, rootPath: PathUtils.normalize(rootPath), options });
        });
    }

    private async setupWatcher(folderPath: string) {
        if (this.watcher) {
            await this.watcher.close();
        }

        this.currentRoot = folderPath;
        this.watcher = chokidar.watch(folderPath, {
            ignored: [/(^|[/\\])\../, '**/node_modules/**', '**/.git/**'],
            persistent: true,
            ignoreInitial: true,
            depth: 99
        });

        // Use a simple debounce for watcher events to avoid spamming tree updates
        let updateTimeout: NodeJS.Timeout | null = null;
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.watcher.on('all', async (event: string, filePath: string) => {
            const normalizedFilePath = PathUtils.normalize(filePath);
            const parentDir = path.dirname(normalizedFilePath);

            // Surgical update: re-scan ONLY the parent directory of the change
            if (event === 'add' || event === 'addDir' || event === 'unlink' || event === 'unlinkDir') {
                const parentNodes = await this.getFileTree(parentDir);
                this.updateTreeCacheAt(parentDir, parentNodes);
            }

            if (updateTimeout) clearTimeout(updateTimeout);

            updateTimeout = setTimeout(() => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('workspace:updated', {
                        event,
                        path: normalizedFilePath,
                        tree: this.cachedTree
                    });
                }
            }, 300); // 300ms debounce
        });
    }

    private updateTreeCacheAt(targetPath: string, newNodes: FileNode[]) {
        if (targetPath === this.currentRoot) {
            this.cachedTree = newNodes;
            return;
        }

        const updateRecursive = (nodes: FileNode[]): boolean => {
            for (const node of nodes) {
                if (node.path === targetPath) {
                    node.children = newNodes;
                    return true;
                }
                if (node.children && updateRecursive(node.children)) {
                    return true;
                }
            }
            return false;
        };

        updateRecursive(this.cachedTree);
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
