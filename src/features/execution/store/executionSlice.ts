import type { StateCreator } from 'zustand';
import type { AppState } from '../../../types/store';
import type { ExecutionSlice, ExecutionError } from '../types';
import type { ExecutionPayload } from '../../../types/electron';

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let executionDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
let listenersInitialized = false;
let lastExecutedCode = '';

// Internal Buffer (not in state to avoid React overhead)
let buffer: {
    results: Map<number, { value: string; type: 'spy' | 'log' }[]>;
    coverage: Set<number>;
    errors: Map<number, ExecutionError>;
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
                rafId ??= requestAnimationFrame(flushBuffer);
            };

            // Fast safety flush for silent code (400ms)
            setTimeout(() => {
                if (buffer.results.size === 0 && buffer.errors.size === 0) {
                    set({ executionResults: new Map(), executionCoverage: new Set(), executionErrors: new Map() });
                }
            }, 400);

            if (!listenersInitialized) {
                // Main thread messages
                window.electron.onExecutionLog((data: ExecutionPayload) => {
                    if ('level' in data && data.level === 'data') {
                        if ('args' in data && data.args?.[0] === 'canvasData') {
                            set({ runtimeValues: { canvasData: data.args[1] } });
                        }
                        return;
                    }

                    if ('type' in data) {
                        if (data.type === 'execution:value') {
                            const lineNum = Number(data.line);
                            const existing = buffer.results.get(lineNum) ?? [];
                            if (existing.length < 50) {
                                existing.push({ value: data.value, type: data.valueType ?? 'spy' });
                                buffer.results.set(lineNum, existing);
                                scheduleUpdate();
                            }
                        } else if (data.type === 'execution:coverage') {
                            buffer.coverage.add(Number(data.line));
                            scheduleUpdate();
                        }
                    }
                });

                window.electron.onExecutionError((err: ExecutionError | string) => {
                    if (typeof err === 'object' && err !== null) {
                        const lineNum = Number(err.line || 1);
                        buffer.errors.set(lineNum, err);
                        scheduleUpdate();
                    } else if (typeof err === 'string') {
                        buffer.errors.set(1, { message: err, line: 1, column: 1 });
                        scheduleUpdate();
                    }
                });

                window.electron.onExecutionStarted(() => {
                    set({ executionErrors: new Map() });
                });

                window.electron.onExecutionClear(() => {
                    set({
                        executionResults: new Map(),
                        executionErrors: new Map(),
                        executionCoverage: new Set()
                    });
                });

                listenersInitialized = true;
            }
            window.electron.executionStart(codeToRun, pathToRun ?? undefined);
        }
    },
});
