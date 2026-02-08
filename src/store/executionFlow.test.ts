import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from './useStore';
import { resetListeners } from '../features/execution/store/executionSlice';

import type { ExecutionPayload } from '../types/electron';

describe('Quokka-like Execution Flow', () => {
    let mockExecutionStart: ReturnType<typeof vi.fn>;
    let mockOnExecutionLog: ReturnType<typeof vi.fn>;
    let mockOnExecutionError: ReturnType<typeof vi.fn>;
    let logCallback: (data: ExecutionPayload) => void;
    let errorCallback: (data: string | { line: number; message: string }) => void;
    let startCallback: () => void;

    beforeEach(() => {
        resetListeners();
        // Reset store
        useStore.setState({
            executionResults: new Map(),
            executionErrors: new Map(),
            code: 'const a = 10;',
            livePreviewEnabled: true // Enable for tests
        });

        // Mock Electron API
        mockExecutionStart = vi.fn();
        mockOnExecutionLog = vi.fn((cb: (data: ExecutionPayload) => void) => {
            logCallback = cb;
            return () => { /* cleanup */ };
        });
        mockOnExecutionError = vi.fn((cb: (err: string | { line: number; message: string }) => void) => {
            errorCallback = cb;
            return () => { /* cleanup */ };
        });

        const mockApi = {
            executionStart: mockExecutionStart,
            onExecutionLog: mockOnExecutionLog,
            onExecutionError: mockOnExecutionError,
            onExecutionStarted: vi.fn((cb) => {
                startCallback = cb;
                return () => {};
            }),
            onExecutionDone: vi.fn((cb) => { return () => {}; }),
            onExecutionClear: vi.fn((cb) => { return () => {}; }),
            onSystemStats: vi.fn((cb) => { return () => {}; }),
            checkExists: vi.fn(),
            discoverPlugins: vi.fn(),
        };

        // @ts-expect-error - Mocking global window property
        window.electron = mockApi;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // @ts-expect-error - Cleaning up mock
        delete window.electron;
    });

    it('should send execution request to backend', () => {
        const { runExecution } = useStore.getState();
        runExecution('const a = 10;');
        expect(mockExecutionStart).toHaveBeenCalledWith('const a = 10;', undefined);
    });

    it('should update executionResults when receiving execution:value messages', async () => {
        const { runExecution } = useStore.getState();
        runExecution('const a = 10;');

        const message = {
            type: 'execution:value' as const,
            line: 1,
            value: '10'
        };

        expect(logCallback).toBeDefined();
        logCallback(message);

        await new Promise(r => setTimeout(r, 50));

        const results = useStore.getState().executionResults;
        expect(results.has(1)).toBe(true);
        expect(results.get(1)).toEqual([{ value: '10', type: 'spy' }]);
    });

    it('should update executionErrors when receiving execution:error messages', async () => {
        const { runExecution } = useStore.getState();
        runExecution('const a = 10;');

        const error = {
            message: 'Something went wrong',
            line: 5,
            column: 10
        };

        expect(errorCallback).toBeDefined();
        errorCallback(error);

        await new Promise(r => setTimeout(r, 50));

        const errors = useStore.getState().executionErrors;
        expect(errors.has(5)).toBe(true);
        expect(errors.get(5)).toMatchObject({ message: 'Something went wrong' });
    });

    it('should accumulate multiple values for the same line', async () => {
        const { runExecution } = useStore.getState();
        runExecution('const a = 10;');

        logCallback({ type: 'execution:value', line: 2, value: '0' });
        logCallback({ type: 'execution:value', line: 2, value: '1' });

        await new Promise(r => setTimeout(r, 50));

        const results = useStore.getState().executionResults;
        expect(results.get(2)).toEqual([{ value: '0', type: 'spy' }, { value: '1', type: 'spy' }]);
    });

    it('should clear previous results on new execution', async () => {
        const { runExecution } = useStore.getState();

        runExecution('const a = 10;');
        if (startCallback) startCallback();
        logCallback({ type: 'execution:value', line: 1, value: 'old' });

        await new Promise(r => setTimeout(r, 50));

        expect(useStore.getState().executionResults.get(1)).toEqual([{ value: 'old', type: 'spy' }]);

        runExecution('const a = 20;');
        if (startCallback) startCallback();

        await new Promise(r => setTimeout(r, 50));

        expect(useStore.getState().executionResults.size).toBe(0);
        expect(useStore.getState().executionErrors.size).toBe(0);
    });
});
