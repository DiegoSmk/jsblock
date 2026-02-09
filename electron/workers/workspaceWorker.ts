import * as fs from 'fs';
import * as path from 'path';
import { createSearchPattern } from '../utils/SearchUtils';
import { SearchOptions } from '../shared/ipc-types';

/**
 * Workspace Worker
 * Handles heavy I/O operations like search and replace.
 */

interface SearchResult {
    file: string;
    line: number;
    text: string;
    matchIndex: number;
}

const MAX_SEARCH_RESULTS = 2000;
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB
const DEFAULT_MAX_DEPTH = 50;

class WorkspaceWorker {
    private currentActionId: string | null = null;
    private isCancelled = false;

    constructor() {
        this.setupListeners();
    }

    private setupListeners() {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        process.on('message', async (msg: { id: string; type: string; payload?: unknown }) => {
            const { id, type, payload } = msg;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
            const data = payload as any;

            if (type === 'cancel') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (this.currentActionId === data?.id) {
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
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    operationPromise = this.searchInFiles(data.query, data.rootPath, data.options);
                } else if (type === 'replace') {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    operationPromise = this.replaceInFiles(data.query, data.replacement, data.rootPath, data.options);
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
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                this.sendToMain(id, { error: message });
            } finally {
                if (this.currentActionId === id) {
                    this.currentActionId = null;
                }
            }
        });
    }

    private async searchInFiles(query: string, rootPath: string, options: SearchOptions): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const pattern = createSearchPattern(query, options);
        if (!pattern) return [];

        const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
        const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

        const traverse = async (currentPath: string, depth: number) => {
            if (this.isCancelled) return;
            if (results.length >= MAX_SEARCH_RESULTS) return;
            if (depth > maxDepth) return;

            try {
                const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    if (this.isCancelled || results.length >= MAX_SEARCH_RESULTS) break;

                    const fullPath = path.join(currentPath, entry.name);

                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        await traverse(fullPath, depth + 1);
                    } else if (entry.isFile()) {
                        if (this.isCancelled) break;

                        const ext = path.extname(entry.name).toLowerCase();
                        if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.bin', '.dll', '.so', '.dylib'].includes(ext)) {
                            continue;
                        }

                        try {
                            const stats = await fs.promises.stat(fullPath);
                            if (stats.size > maxFileSize) continue;

                            const content = await fs.promises.readFile(fullPath, 'utf-8');
                            if (content.includes('\0')) continue;

                            const lines = content.split(/\r?\n/);

                            for (let i = 0; i < lines.length; i++) {
                                if (this.isCancelled) break;
                                if (results.length >= MAX_SEARCH_RESULTS) break;

                                const line = lines[i];
                                pattern.lastIndex = 0;
                                if (pattern.test(line)) {
                                    results.push({
                                        file: fullPath,
                                        line: i + 1,
                                        text: line.trim(),
                                        matchIndex: line.search(pattern)
                                    });
                                }
                            }
                        } catch { /* ignore */ }
                    }
                }
            } catch { /* ignore */ }
        };

        await traverse(rootPath, 0);
        return results;
    }

    private async replaceInFiles(query: string, replacement: string, rootPath: string, options: SearchOptions): Promise<void> {
        const pattern = createSearchPattern(query, options);
        if (!pattern) return;

        const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
        const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

        const traverse = async (currentPath: string, depth: number) => {
            if (this.isCancelled) return;
            if (depth > maxDepth) return;

            try {
                const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    if (this.isCancelled) break;
                    const fullPath = path.join(currentPath, entry.name);

                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        await traverse(fullPath, depth + 1);
                    } else if (entry.isFile()) {
                        if (this.isCancelled) break;

                        const ext = path.extname(entry.name).toLowerCase();
                        if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.bin', '.dll', '.so', '.dylib'].includes(ext)) {
                            continue;
                        }

                        try {
                            const stats = await fs.promises.stat(fullPath);
                            if (stats.size > maxFileSize) continue;

                            const content = await fs.promises.readFile(fullPath, 'utf-8');
                            if (content.includes('\0')) continue;

                            if (pattern.test(content)) {
                                const newContent = content.replace(pattern, replacement);
                                await fs.promises.writeFile(fullPath, newContent, 'utf-8');
                            }
                        } catch { /* ignore */ }
                    }
                }
            } catch { /* ignore */ }
        };

        await traverse(rootPath, 0);
    }

    private sendToMain(id: string, payload: unknown) {
        if (process.send && typeof payload === 'object' && payload !== null) {
            process.send({ id, ...payload });
        }
    }
}

new WorkspaceWorker();
