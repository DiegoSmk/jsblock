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
                get().runExecution(undefined, undefined, true);
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

    runExecution: (customCode?: string, customPath?: string, isSimulationTrigger = false) => {
        const { code, selectedFile, livePreviewEnabled } = get();
        const codeToRun = customCode ?? code;
        const pathToRun = customPath ?? selectedFile;

        if (!isSimulationTrigger && customCode !== undefined && codeToRun === lastExecutedCode) {
            return;
        }

        if (!codeToRun || codeToRun.trim() === '') {
            set({ executionResults: new Map(), executionErrors: new Map(), executionCoverage: new Set() });
            return;
        }

        const shouldExecute = (customCode === undefined) || livePreviewEnabled;
        if (window.electron && shouldExecute) {
            lastExecutedCode = codeToRun;

            // PROFESSIONAL UX: Clear errors immediately when starting a new run.
            // Errors are per-code-state. Keeping them is deceptive.
            set({ executionErrors: new Map() });

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

            // Force a final flush even if no data arrives (e.g. silent but valid code)
            // This ensures results from old code are eventually cleared.
            setTimeout(() => {
                if (buffer.results.size === 0 && get().executionResults.size > 0) {
                    set({ executionResults: new Map(), executionCoverage: new Set() });
                }
            }, 500);

            if (!listenersInitialized) {
                window.electron.onExecutionLog((data) => {
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

                window.electron.onExecutionError((err) => {
                    if (typeof err === 'object' && err !== null) {
                        buffer.errors.set(err.line, err.message);
                        scheduleUpdate();
                    }
                });
                listenersInitialized = true;
            }
            window.electron.executionStart(codeToRun, pathToRun ?? undefined);
        }
    },
});
