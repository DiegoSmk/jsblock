import type { StateCreator } from 'zustand';
import type { AppState } from '../../../types/store';
import type { ExecutionSlice, ExecutionError } from '../types';
import type { ExecutionPayload } from '../../../types/electron';

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let executionDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;
let hasPendingUpdates = false;

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

export const resetExecutionStateForTesting = () => {
    buffer = { results: new Map(), coverage: new Set(), errors: new Map() };
    hasPendingUpdates = false;
    if (simulationInterval) clearInterval(simulationInterval);
    if (executionDebounceTimeout) clearTimeout(executionDebounceTimeout);
    if (rafId) cancelAnimationFrame(rafId);
    simulationInterval = null;
    executionDebounceTimeout = null;
    rafId = null;
};

export const createExecutionSlice: StateCreator<AppState, [], [], ExecutionSlice> = (set, get) => {

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

    return {
        executionResults: new Map(),
        executionErrors: new Map(),
        executionCoverage: new Set(),
        isSimulating: false,
        isExecuting: false,
        livePreviewEnabled: false,
        runtimeValues: {},
        availableRuntimes: { node: false, bun: false, deno: false },
        systemStats: { cpu: 0 },
        isListenersInitialized: false,
        lastExecutedCode: null,

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

        currentRuntime: 'node',

        setRuntime: (runtime: 'node' | 'bun' | 'deno') => {
            set({ currentRuntime: runtime });
            window.electron?.executionSetRuntime(runtime);
            if (get().livePreviewEnabled) {
                void get().runExecution();
            }
        },

        checkAvailability: async () => {
            if (window.electron?.executionCheckAvailability) {
                const availability = await window.electron.executionCheckAvailability();
                set({ availableRuntimes: availability });
            }
        },

        runExecutionDebounced: (customCode?: string, customPath?: string) => {
            if (executionDebounceTimeout) clearTimeout(executionDebounceTimeout);
            executionDebounceTimeout = setTimeout(() => {
                get().runExecution(customCode, customPath);
                executionDebounceTimeout = null;
            }, 300);
        },

        initializeExecutionListeners: () => {
            const { isListenersInitialized } = get();
            if (isListenersInitialized || !window.electron) return;

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
                set({ isExecuting: false });
                if (typeof err === 'object' && err !== null) {
                    const lineNum = Number(err.line || 1);
                    let message = err.message;
                    const isTimeout = err.errorCode === 'EXEC_TIMEOUT' || /execution timed out/i.test(message);
                    if (isTimeout && !message.includes('Tip:')) {
                        message = 'Execution timed out. Tip: Click or CTRL+ENTER to increase limit';
                    }
                    buffer.errors.set(lineNum, { ...err, message });
                    scheduleUpdate();
                } else if (typeof err === 'string') {
                    let message = err;
                    if (/execution timed out/i.test(message)) {
                        message = 'Execution timed out. Tip: Click or CTRL+ENTER to increase limit';
                    }
                    buffer.errors.set(1, { message, line: 1, column: 1 });
                    scheduleUpdate();
                }
            });

            window.electron.onExecutionStarted(() => {
                set({
                    executionResults: new Map(),
                    executionErrors: new Map(),
                    executionCoverage: new Set(),
                    isExecuting: true
                });
            });

            window.electron.onExecutionDone(() => {
                set({ isExecuting: false });
                flushBuffer();
            });

            window.electron.onExecutionClear(() => {
                set({
                    executionResults: new Map(),
                    executionErrors: new Map(),
                    executionCoverage: new Set()
                });
            });

            window.electron.onSystemStats((stats: { cpu: number }) => {
                set({ systemStats: stats });
            });

            set({ isListenersInitialized: true });
        },

        runExecution: (customCode?: string, customPath?: string) => {
            const { code, selectedFile, livePreviewEnabled, lastExecutedCode } = get();
            const codeToRun = customCode ?? code;
            const pathToRun = customPath ?? selectedFile;

            if (customCode !== undefined && codeToRun === lastExecutedCode) return;
            if (!codeToRun?.trim()) {
                set({ executionResults: new Map(), executionErrors: new Map(), executionCoverage: new Set(), isExecuting: false });
                return;
            }

            const shouldExecute = (customCode === undefined) || livePreviewEnabled;
            if (window.electron && shouldExecute) {
                set({ lastExecutedCode: codeToRun });
                buffer = { results: new Map(), coverage: new Set(), errors: new Map() };
                hasPendingUpdates = false;
                set({ executionResults: new Map(), executionErrors: new Map(), executionCoverage: new Set(), isExecuting: true });
                get().initializeExecutionListeners();
                window.electron.executionStart(codeToRun, pathToRun ?? undefined);
            }
        },
    };
};
