import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from './useStore';

describe('Quokka-like Execution Flow', () => {
    let mockExecutionStart: any;
    let mockOnExecutionLog: any;
    let mockOnExecutionError: any;
    let logCallback: (data: any) => void;
    let errorCallback: (data: any) => void;

    beforeEach(() => {
        // Reset store
        useStore.setState({ executionResults: new Map(), executionErrors: new Map(), code: 'const a = 10;' });

        // Mock Electron API
        mockExecutionStart = vi.fn();
        mockOnExecutionLog = vi.fn((cb) => {
            logCallback = cb;
            return () => {};
        });
        mockOnExecutionError = vi.fn((cb) => {
            errorCallback = cb;
            return () => {};
        });

        window.electronAPI = {
            executionStart: mockExecutionStart,
            onExecutionLog: mockOnExecutionLog,
            onExecutionError: mockOnExecutionError,
            checkPathExists: vi.fn(),
            discoverPlugins: vi.fn(),
        } as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // @ts-ignore
        delete window.electronAPI;
    });

    it('should send execution request to backend', () => {
        const { runExecution } = useStore.getState();
        runExecution();
        expect(mockExecutionStart).toHaveBeenCalledWith('const a = 10;', undefined);
    });

    it('should update executionResults when receiving execution:value messages', () => {
        const { runExecution } = useStore.getState();
        runExecution();

        const message = {
            type: 'execution:value',
            line: 1,
            value: '10'
        };

        expect(logCallback).toBeDefined();
        logCallback(message);

        const results = useStore.getState().executionResults;
        expect(results.has(1)).toBe(true);
        expect(results.get(1)).toEqual(['10']);
    });

    it('should update executionErrors when receiving execution:error messages', () => {
        const { runExecution } = useStore.getState();
        runExecution();

        const error = {
            message: 'Something went wrong',
            line: 5,
            column: 10
        };

        expect(errorCallback).toBeDefined();
        errorCallback(error);

        const errors = useStore.getState().executionErrors;
        expect(errors.has(5)).toBe(true);
        expect(errors.get(5)).toEqual('Something went wrong');
    });

    it('should accumulate multiple values for the same line', () => {
        const { runExecution } = useStore.getState();
        runExecution();

        logCallback({ type: 'execution:value', line: 2, value: '0' });
        logCallback({ type: 'execution:value', line: 2, value: '1' });

        const results = useStore.getState().executionResults;
        expect(results.get(2)).toEqual(['0', '1']);
    });

    it('should clear previous results on new execution', () => {
        const { runExecution } = useStore.getState();

        runExecution();
        logCallback({ type: 'execution:value', line: 1, value: 'old' });
        expect(useStore.getState().executionResults.get(1)).toEqual(['old']);

        runExecution();
        expect(useStore.getState().executionResults.size).toBe(0);
        expect(useStore.getState().executionErrors.size).toBe(0);
    });
});
