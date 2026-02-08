import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkspaceService } from './WorkspaceService';
import { ipcMain, utilityProcess } from 'electron';

// Mock electron module
vi.mock('electron', () => {
    return {
        ipcMain: {
            handle: vi.fn(),
            on: vi.fn()
        },
        dialog: {
            showOpenDialog: vi.fn()
        },
        BrowserWindow: vi.fn(),
        utilityProcess: {
            fork: vi.fn()
        },
    };
});

describe('WorkspaceService Search', () => {
    let service: WorkspaceService;
    let mockWorker: any;
    let workerCallbacks: Record<string, Function> = {};

    beforeEach(() => {
        workerCallbacks = {};
        mockWorker = {
            on: vi.fn((event, cb) => {
                workerCallbacks[event] = cb;
            }),
            postMessage: vi.fn(),
            kill: vi.fn(),
            stdout: {
                on: vi.fn()
            },
            stderr: {
                on: vi.fn()
            },
        };

        // Reset mock implementations
        (utilityProcess.fork as any).mockImplementation(() => mockWorker);
        (ipcMain.handle as any).mockClear();

        service = new WorkspaceService();
        service.registerHandlers();
    });

    afterEach(() => {
        service.stop();
        vi.clearAllMocks();
    });

    it('should delegate search to worker after cancelling pending', async () => {
        const calls = (ipcMain.handle as any).mock.calls;
        const searchCall = calls.find((call: any[]) => call[0] === 'workspace:search');
        expect(searchCall).toBeDefined();
        const searchHandler = searchCall[1];

        const searchPromise = searchHandler({}, 'query', '/root', {
            regex: false,
            caseSensitive: false
        });

        expect(utilityProcess.fork).toHaveBeenCalled();

        // Should have 2 messages: 1 for cancellation, 1 for search
        expect(mockWorker.postMessage).toHaveBeenCalledTimes(2);

        expect(mockWorker.postMessage).toHaveBeenNthCalledWith(1, { type: 'cancel' });

        const sentPayload = (mockWorker.postMessage as any).mock.calls[1][0];
        expect(sentPayload).toMatchObject({
            type: 'search',
            payload: {
                query: 'query',
                options: {
                    regex: false,
                    caseSensitive: false
                }
            }
        });

        const id = sentPayload.id;
        const mockResults = [{
            file: '/root/test.ts', line: 1, text: 'match', matchIndex: 0
        }];

        if (workerCallbacks['message']) {
            workerCallbacks['message']({ id, results: mockResults });
        }

        const results = await searchPromise;
        expect(results).toEqual(mockResults);
    });

    it('should handle worker errors', async () => {
        const calls = (ipcMain.handle as any).mock.calls;
        const searchHandler = calls.find((call: any[]) => call[0] === 'workspace:search')[1];

        const searchPromise = searchHandler({}, 'query', '/root', {});

        // Skip cancellation message, look at the second call (the actual search)
        const sentPayload = (mockWorker.postMessage as any).mock.calls[1][0];
        const id = sentPayload.id;

        if (workerCallbacks['message']) {
            workerCallbacks['message']({ id, error: 'Worker crashed' });
        }

        await expect(searchPromise).rejects.toThrow('Worker crashed');
    });
});
