import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { SearchOptions, SearchResult } from '../types';

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

        ipcMain.handle('workspace:search', async (_event, query: string, rootPath: string, options: SearchOptions) => {
            return await this.searchInFiles(query, rootPath, options);
        });

        ipcMain.handle('workspace:replace', async (_event, query: string, replacement: string, rootPath: string, options: SearchOptions) => {
            return await this.replaceInFiles(query, replacement, rootPath, options);
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

    private async searchInFiles(query: string, rootPath: string, options: SearchOptions): Promise<SearchResult[]> {
        const results: SearchResult[] = [];

        // Escape regex characters if not using regex mode
        const pattern = options.regex
            ? new RegExp(query, options.caseSensitive ? 'g' : 'gi')
            : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.caseSensitive ? 'g' : 'gi');

        // Helper recursive function
        const traverse = async (currentPath: string) => {
            try {
                const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);

                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        await traverse(fullPath);
                    } else if (entry.isFile()) {
                        // Skip non-text files based on extension (basic heuristic)
                        const ext = path.extname(entry.name).toLowerCase();
                        if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.bin', '.dll', '.so', '.dylib'].includes(ext)) {
                            continue;
                        }

                        // Read file content
                        try {
                            const content = await fs.promises.readFile(fullPath, 'utf-8');
                            // Check for null bytes to avoid binary files that slipped through extension check
                            if (content.includes('\0')) continue;

                            const lines = content.split(/\r?\n/);

                            lines.forEach((line, index) => {
                                // Reset lastIndex for global regex
                                pattern.lastIndex = 0;
                                if (pattern.test(line)) {
                                    results.push({
                                        file: fullPath,
                                        line: index + 1,
                                        text: line.trim(), // Trim for display
                                        matchIndex: line.search(pattern)
                                    });
                                }
                            });
                        } catch (err) {
                            // Ignore read errors
                        }
                    }
                }
            } catch (err) {
                // Ignore directory read errors
            }
        };

        await traverse(rootPath);
        return results;
    }

    private async replaceInFiles(query: string, replacement: string, rootPath: string, options: SearchOptions): Promise<void> {
        // Escape regex characters if not using regex mode
        const pattern = options.regex
            ? new RegExp(query, options.caseSensitive ? 'g' : 'gi')
            : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.caseSensitive ? 'g' : 'gi');

        const traverse = async (currentPath: string) => {
            try {
                const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);

                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        await traverse(fullPath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.bin', '.dll', '.so', '.dylib'].includes(ext)) {
                            continue;
                        }

                        try {
                            const content = await fs.promises.readFile(fullPath, 'utf-8');
                            if (content.includes('\0')) continue;

                            if (pattern.test(content)) {
                                const newContent = content.replace(pattern, replacement);
                                await fs.promises.writeFile(fullPath, newContent, 'utf-8');
                            }
                        } catch (err) {
                            // Ignore errors
                        }
                    }
                }
            } catch (err) {
                // Ignore errors
            }
        };

        await traverse(rootPath);
    }

    stop() {
        if (this.watcher) {
            void this.watcher.close();
            this.watcher = null;
        }
    }
}
