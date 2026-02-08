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

    it('should delegate search to worker', async () => {
        // Find the registered handler for 'workspace:search'
        // ipcMain.handle is called during registerHandlers in beforeEach
        const calls = (ipcMain.handle as any).mock.calls;
        const searchCall = calls.find((call: any[]) => call[0] === 'workspace:search');
        expect(searchCall).toBeDefined();
        const searchHandler = searchCall[1];

        // Trigger the handler
        const searchPromise = searchHandler({}, 'query', '/root', {
            regex: false,
            caseSensitive: false
        });

        // Verify worker was started
        expect(utilityProcess.fork).toHaveBeenCalled();

        // Verify message sent to worker
        expect(mockWorker.postMessage).toHaveBeenCalled();
        const sentPayload = (mockWorker.postMessage as any).mock.calls[0][0];

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
        expect(sentPayload.payload.rootPath).toContain('root'); // Normalized path check

        const id = sentPayload.id;
        const mockResults = [{
            file: '/root/test.ts',
            line: 1,
            text: 'match',
            matchIndex: 0
        }];

        // Simulate worker response
        // Worker sends { id, results } for search success
        if (workerCallbacks['message']) {
            workerCallbacks['message']({
                id,
                results: mockResults
            });
        }

        const results = await searchPromise;
        expect(results).toEqual(mockResults);
    });

    it('should handle worker errors', async () => {
        const calls = (ipcMain.handle as any).mock.calls;
        const searchHandler = calls.find((call: any[]) => call[0] === 'workspace:search')[1];

        const searchPromise = searchHandler({}, 'query', '/root', {});

        // Get the ID
        const sentPayload = (mockWorker.postMessage as any).mock.calls[0][0];
        const id = sentPayload.id;

        // Simulate worker error
        if (workerCallbacks['message']) {
            workerCallbacks['message']({
                id,
                error: 'Worker crashed'
            });
        }

        await expect(searchPromise).rejects.toThrow('Worker crashed');
    });
});
