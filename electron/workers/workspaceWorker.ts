import * as fs from 'fs';
import * as path from 'path';

/**
 * Workspace Worker
 * Handles heavy I/O operations like search and replace.
 */

interface SearchOptions {
    caseSensitive: boolean;
    regex: boolean;
}

interface SearchResult {
    file: string;
    line: number;
    text: string;
    matchIndex: number;
}

const MAX_SEARCH_RESULTS = 2000;
const MAX_FILE_SIZE_FOR_SEARCH = 1024 * 1024; // 1MB

class WorkspaceWorker {
    private currentActionId: string | null = null;
    private isCancelled = false;

    constructor() {
        this.setupListeners();
    }

    private setupListeners() {
        process.on('message', async (msg: { id: string; type: string; payload?: any }) => {
            const { id, type, payload } = msg;

            if (type === 'cancel') {
                if (this.currentActionId === payload?.id) {
                    this.isCancelled = true;
                }
                return;
            }

            // Start new action
            this.currentActionId = id;
            this.isCancelled = false;

            try {
                // Global timeout of 30 seconds for any operation
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Operation timed out after 30s')), 30000);
                });

                let operationPromise: Promise<unknown>;

                if (type === 'search') {
                    operationPromise = this.searchInFiles(payload.query, payload.rootPath, payload.options);
                } else if (type === 'replace') {
                    operationPromise = this.replaceInFiles(payload.query, payload.replacement, payload.rootPath, payload.options);
                } else {
                    throw new Error(`Unknown operation type: ${type}`);
                }

                const result = await Promise.race([operationPromise, timeoutPromise]);

                if (this.isCancelled) {
                    this.sendToMain(id, { error: 'Operation cancelled' });
                } else {
                    if (type === 'search') {
                        this.sendToMain(id, { results: result });
                    } else {
                        this.sendToMain(id, { success: true });
                    }
                }
            } catch (error: any) {
                this.sendToMain(id, { error: error.message || String(error) });
            } finally {
                if (this.currentActionId === id) {
                    this.currentActionId = null;
                }
            }
        });
    }

    private createSearchPattern(query: string, options: SearchOptions): RegExp | null {
        try {
            if (options.regex) {
                return new RegExp(query, options.caseSensitive ? 'g' : 'gi');
            } else {
                return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.caseSensitive ? 'g' : 'gi');
            }
        } catch (err) {
            return null;
        }
    }

    private async searchInFiles(query: string, rootPath: string, options: SearchOptions): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const pattern = this.createSearchPattern(query, options);
        if (!pattern) return [];

        const traverse = async (currentPath: string) => {
            if (results.length >= MAX_SEARCH_RESULTS) return;

            try {
                const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    if (this.isCancelled || results.length >= MAX_SEARCH_RESULTS) break;

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
                            const stats = await fs.promises.stat(fullPath);
                            if (stats.size > MAX_FILE_SIZE_FOR_SEARCH) continue;

                            const content = await fs.promises.readFile(fullPath, 'utf-8');
                            if (content.includes('\0')) continue;

                            const lines = content.split(/\r?\n/);

                            lines.forEach((line, index) => {
                                if (results.length >= MAX_SEARCH_RESULTS) return;
                                pattern.lastIndex = 0;
                                if (pattern.test(line)) {
                                    results.push({
                                        file: fullPath,
                                        line: index + 1,
                                        text: line.trim(),
                                        matchIndex: line.search(pattern)
                                    });
                                }
                            });
                        } catch (err) { /* ignore */ }
                    }
                }
            } catch (err) { /* ignore */ }
        };

        await traverse(rootPath);
        return results;
    }

    private async replaceInFiles(query: string, replacement: string, rootPath: string, options: SearchOptions): Promise<void> {
        const pattern = this.createSearchPattern(query, options);
        if (!pattern) return;

        const traverse = async (currentPath: string) => {
            try {
                const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    if (this.isCancelled) break;
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
                        } catch (err) { /* ignore */ }
                    }
                }
            } catch (err) { /* ignore */ }
        };

        await traverse(rootPath);
    }

    private sendToMain(id: string, payload: any) {
        if (process.send) {
            process.send({ id, ...payload });
        }
    }
}

new WorkspaceWorker();
