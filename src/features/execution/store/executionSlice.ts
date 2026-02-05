import type { StateCreator } from 'zustand';
import type { AppState } from '../../../types/store';
import type { ExecutionSlice } from '../types';

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let executionDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
let listenersInitialized = false;
let lastExecutedCode = '';

// Internal Buffer (not in state to avoid React overhead)
let buffer: {
    results: Map<number, { value: string; type: 'spy' | 'log' }[]>;
    coverage: Set<number>;
    errors: Map<number, string>;
} = {
    results: new Map(),
    coverage: new Set(),
    errors: new Map()
};

let rafId: number | null = null;
let hasPendingUpdates = false;

export const createExecutionSlice: StateCreator<AppState, [], [], ExecutionSlice> = (set, get) => ({
    executionResults: new Map(),
    executionErrors: new Map(),
    executionCoverage: new Set(),
    isSimulating: false,
    livePreviewEnabled: false,
    runtimeValues: {},

    toggleSimulation: () => {
        const { isSimulating } = get();
        if (isSimulating) {
            if (simulationInterval !== null) clearInterval(simulationInterval);
            simulationInterval = null;
            set({ isSimulating: false });
        } else {
            set({ isSimulating: true });
            simulationInterval = setInterval(() => {
                get().runExecution();
            }, 1000);
        }
    },

    setLivePreviewEnabled: (enabled: boolean) => {
        set({ livePreviewEnabled: enabled });
        if (enabled) {
            get().runExecution();
        } else {
            set({
                executionResults: new Map(),
                executionErrors: new Map(),
                executionCoverage: new Set()
            });
        }
    },

    runExecutionDebounced: (customCode?: string, customPath?: string) => {
        if (executionDebounceTimeout) clearTimeout(executionDebounceTimeout);
        executionDebounceTimeout = setTimeout(() => {
            get().runExecution(customCode, customPath);
            executionDebounceTimeout = null;
        }, 300);
    },

    runExecution: (customCode?: string, customPath?: string) => {
        const { code, selectedFile, livePreviewEnabled } = get();
        const codeToRun = customCode ?? code;
        const pathToRun = customPath ?? selectedFile;

        // Force execution check
        if (customCode !== undefined && codeToRun === lastExecutedCode) {
            return;
        }

        if (!codeToRun || codeToRun.trim() === '') {
            set({ executionResults: new Map(), executionErrors: new Map(), executionCoverage: new Set() });
            return;
        }

        const shouldExecute = (customCode === undefined) || livePreviewEnabled;
        if (window.electron && shouldExecute) {
            lastExecutedCode = codeToRun;

            // Reset buffer
            buffer = { results: new Map(), coverage: new Set(), errors: new Map() };
            hasPendingUpdates = false;

            const flushBuffer = () => {
                if (hasPendingUpdates) {
                    set({
                        executionResults: new Map(buffer.results),
                        executionCoverage: new Set(buffer.coverage),
                        executionErrors: new Map(buffer.errors)
                    });
                    hasPendingUpdates = false;
                }
                rafId = null;
            };

            const scheduleUpdate = () => {
                hasPendingUpdates = true;
                if (!rafId) {
                    rafId = requestAnimationFrame(flushBuffer);
                }
            };

            // Fast safety flush for silent code (400ms)
            setTimeout(() => {
                if (buffer.results.size === 0 && buffer.errors.size === 0) {
                    set({ executionResults: new Map(), executionErrors: new Map(), executionCoverage: new Set() });
                }
            }, 400);

            if (!listenersInitialized) {
                // Main thread messages
                window.electron.onExecutionLog((data: any) => {
                    // Success signal from backend (Transpilation passed)
                    if (data === 'execution:started' || data?.type === 'execution:started') {
                        set({ executionErrors: new Map() });
                        return;
                    }

                    if (data.level === 'data') {
                        const canvasData = data as { args: [string, unknown] };
                        if (canvasData.args?.[0] === 'canvasData') {
                            set({ runtimeValues: { canvasData: canvasData.args[1] } });
                        }
                        return;
                    }

                    if (data.type === 'execution:value') {
                        const { line, value, valueType } = data;
                        const lineNum = Number(line);
                        const existing = buffer.results.get(lineNum) ?? [];
                        if (existing.length < 50) {
                            existing.push({ value, type: valueType ?? 'spy' });
                            buffer.results.set(lineNum, existing);
                            scheduleUpdate();
                        }
                    } else if (data.type === 'execution:coverage') {
                        buffer.coverage.add(Number(data.line));
                        scheduleUpdate();
                    }
                });

                window.electron.onExecutionError((err: any) => {
                    if (typeof err === 'object' && err !== null) {
                        const lineNum = Number(err.line);
                        buffer.errors.set(lineNum || 1, err.message);
                        scheduleUpdate();
                    } else if (typeof err === 'string') {
                        // Handle raw string errors
                        buffer.errors.set(1, err);
                        scheduleUpdate();
                    }
                });
                listenersInitialized = true;
            }
            window.electron.executionStart(codeToRun, pathToRun ?? undefined);
        }
    },
});
