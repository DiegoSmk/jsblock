import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
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
    let mockWorker: {
        on: Mock;
        postMessage: Mock;
        kill: Mock;
        stdout: { on: Mock };
        stderr: { on: Mock };
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let workerCallbacks: Record<string, (msg: any) => void> = {};

    beforeEach(() => {
        workerCallbacks = {};
        mockWorker = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            on: vi.fn((event: string, cb: (msg: any) => void) => {
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
        (utilityProcess.fork as unknown as Mock).mockImplementation(() => mockWorker);
        (ipcMain.handle as unknown as Mock).mockClear();

        service = new WorkspaceService();
        service.registerHandlers();
    });

    afterEach(() => {
        service.stop();
        vi.clearAllMocks();
    });

    it('should delegate search to worker after cancelling pending', async () => {
        const calls = (ipcMain.handle as unknown as Mock).mock.calls;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const searchCall = calls.find((call: any[]) => call[0] === 'workspace:search');
        expect(searchCall).toBeDefined();
        const searchHandler = searchCall![1] as (event: unknown, query: string, path: string, options: unknown) => Promise<unknown>;

        const searchPromise = searchHandler({}, 'query', '/root', {
            regex: false,
            caseSensitive: false
        });

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(utilityProcess.fork).toHaveBeenCalled();

        // Should have 2 messages: 1 for cancellation, 1 for search
        expect(mockWorker.postMessage).toHaveBeenCalledTimes(2);

        expect(mockWorker.postMessage).toHaveBeenNthCalledWith(1, { type: 'cancel' });

        const sentPayload = mockWorker.postMessage.mock.calls[1][0] as { id: string };
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

        if (workerCallbacks.message) {
            workerCallbacks.message({ id, results: mockResults });
        }

        const results = await searchPromise;
        expect(results).toEqual(mockResults);
    });

    it('should handle worker errors', async () => {
        const calls = (ipcMain.handle as unknown as Mock).mock.calls;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const searchHandler = calls.find((call: any[]) => call[0] === 'workspace:search')![1] as (event: unknown, query: string, path: string, options: unknown) => Promise<unknown>;

        const searchPromise = searchHandler({}, 'query', '/root', {});

        // Skip cancellation message, look at the second call (the actual search)
        const sentPayload = mockWorker.postMessage.mock.calls[1][0] as { id: string };
        const id = sentPayload.id;

        if (workerCallbacks.message) {
            workerCallbacks.message({ id, error: 'Worker crashed' });
        }

        await expect(searchPromise).rejects.toThrow('Worker crashed');
    });

    it('should handle worker process exit', async () => {
        const calls = (ipcMain.handle as unknown as Mock).mock.calls;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const searchHandler = calls.find((call: any[]) => call[0] === 'workspace:search')![1] as (event: unknown, query: string, path: string, options: unknown) => Promise<unknown>;

        const searchPromise = searchHandler({}, 'query', '/root', {});

        if (workerCallbacks.exit) {
            workerCallbacks.exit(1);
        }

        await expect(searchPromise).rejects.toThrow('Worker exited');
    });

    it('should handle operation timeout', async () => {
        vi.useFakeTimers();
        const calls = (ipcMain.handle as unknown as Mock).mock.calls;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const searchHandler = calls.find((call: any[]) => call[0] === 'workspace:search')![1] as (event: unknown, query: string, path: string, options: unknown) => Promise<unknown>;

        const searchPromise = searchHandler({}, 'query', '/root', {});

        // Fast-forward time
        vi.advanceTimersByTime(31000);

        await expect(searchPromise).rejects.toThrow('Operation search timed out after 30s');
        vi.useRealTimers();
    });
});
