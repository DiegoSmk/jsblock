import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from './useStore';

describe('Quokka-like Execution Flow', () => {
    let mockExecutionStart: any;
    let mockOnExecutionLog: any;
    let mockOnExecutionError: any;
    let logCallback: (data: any) => void;

    beforeEach(() => {
        // Reset store
        useStore.setState({ executionResults: new Map(), code: 'const a = 10;' });

        // Mock Electron API
        mockExecutionStart = vi.fn();
        mockOnExecutionLog = vi.fn((cb) => {
            logCallback = cb;
            return () => {};
        });
        mockOnExecutionError = vi.fn();

        window.electronAPI = {
            executionStart: mockExecutionStart,
            onExecutionLog: mockOnExecutionLog,
            onExecutionError: mockOnExecutionError,
            // ... mock other required methods if necessary for store init
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

        // Simulate backend sending an instrumented value
        // Line 1, Value "10"
        const message = {
            type: 'execution:value',
            line: 1,
            value: '10'
        };

        // Trigger the callback captured by the mock
        expect(logCallback).toBeDefined();
        logCallback(message);

        const results = useStore.getState().executionResults;
        expect(results.has(1)).toBe(true);
        expect(results.get(1)).toEqual(['10']);
    });

    it('should accumulate multiple values for the same line (e.g. loops)', () => {
        const { runExecution } = useStore.getState();
        runExecution();

        expect(logCallback).toBeDefined();

        // Simulate loop behavior: i=0, i=1
        logCallback({ type: 'execution:value', line: 2, value: '0' });
        logCallback({ type: 'execution:value', line: 2, value: '1' });

        const results = useStore.getState().executionResults;
        expect(results.get(2)).toEqual(['0', '1']);
    });

    it('should clear previous results on new execution', () => {
        const { runExecution } = useStore.getState();

        // First run
        runExecution();
        logCallback({ type: 'execution:value', line: 1, value: 'old' });
        expect(useStore.getState().executionResults.get(1)).toEqual(['old']);

        // Second run
        runExecution();
        expect(useStore.getState().executionResults.size).toBe(0);
    });
});
