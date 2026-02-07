import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceService } from './WorkspaceService';
import * as fs from 'fs';
import * as path from 'path';

// Mock electron module
vi.mock('electron', () => {
    return {
        ipcMain: { handle: vi.fn(), on: vi.fn() },
        dialog: { showOpenDialog: vi.fn() },
        BrowserWindow: vi.fn(),
    };
});

// Mock fs module
vi.mock('fs', () => {
    return {
        promises: {
            readdir: vi.fn(),
            readFile: vi.fn(),
            writeFile: vi.fn(),
        }
    };
});

describe('WorkspaceService Search', () => {
    let service: WorkspaceService;

    beforeEach(() => {
        service = new WorkspaceService();
        vi.clearAllMocks();
    });

    it('should find text in files', async () => {
        const mockReaddir = fs.promises.readdir as unknown as ReturnType<typeof vi.fn>;
        const mockReadFile = fs.promises.readFile as unknown as ReturnType<typeof vi.fn>;

        // Setup directory structure mocks
        // When readdir is called with '/root', return file1 and subdir
        mockReaddir.mockImplementation(async (dirPath) => {
            if (dirPath === '/root' || dirPath === path.normalize('/root')) {
                return [
                    { name: 'file1.txt', isFile: () => true, isDirectory: () => false },
                    { name: 'subdir', isFile: () => false, isDirectory: () => true },
                ];
            }
            if (dirPath === path.join('/root', 'subdir') || dirPath === path.normalize('/root/subdir')) {
                return [
                    { name: 'file2.ts', isFile: () => true, isDirectory: () => false },
                ];
            }
            return [];
        });

        // Setup file content mocks
        mockReadFile.mockImplementation(async (filePath) => {
            if (filePath.includes('file1.txt')) return 'Hello World\nAnother line';
            if (filePath.includes('file2.ts')) return 'console.log("Hello JS");';
            return '';
        });

        // Access private method
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = await (service as any).searchInFiles('Hello', '/root', { caseSensitive: false, regex: false });

        expect(results).toHaveLength(2);
        const file1Result = results.find((r: { file: string }) => r.file.includes('file1.txt'));
        const file2Result = results.find((r: { file: string }) => r.file.includes('file2.ts'));

        expect(file1Result).toBeDefined();
        expect(file1Result).toMatchObject({ line: 1, text: 'Hello World' });

        expect(file2Result).toBeDefined();
        expect(file2Result).toMatchObject({ line: 1, text: 'console.log("Hello JS");' });
    });

    it('should support case sensitive search', async () => {
        const mockReaddir = fs.promises.readdir as unknown as ReturnType<typeof vi.fn>;
        const mockReadFile = fs.promises.readFile as unknown as ReturnType<typeof vi.fn>;

        mockReaddir.mockResolvedValue([
            { name: 'file1.txt', isFile: () => true, isDirectory: () => false },
        ]);

        mockReadFile.mockResolvedValue('hello world\nHello World');

        // Case Sensitive: "Hello" should only match line 2
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = await (service as any).searchInFiles('Hello', '/root', { caseSensitive: true, regex: false });

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ line: 2, text: 'Hello World' });
    });

    it('should support regex search', async () => {
        const mockReaddir = fs.promises.readdir as unknown as ReturnType<typeof vi.fn>;
        const mockReadFile = fs.promises.readFile as unknown as ReturnType<typeof vi.fn>;

        mockReaddir.mockResolvedValue([
            { name: 'file1.txt', isFile: () => true, isDirectory: () => false },
        ]);

        mockReadFile.mockResolvedValue('user123\nadmin');

        // Regex: "user\d+"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = await (service as any).searchInFiles('user\\d+', '/root', { caseSensitive: false, regex: true });

        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ line: 1, text: 'user123' });
    });
});
