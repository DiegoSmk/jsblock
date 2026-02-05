import type { StateCreator } from 'zustand';
import type { AppState } from '../../../types/store';
import type { ExecutionSlice } from '../types';

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let executionDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
let listenersInitialized = false;

// Buffered updates to prevent flickering
let updateBuffer: {
    results: Map<number, { value: string; type: 'spy' | 'log' }[]>;
    coverage: Set<number>;
    errors: Map<number, string>;
} = {
    results: new Map(),
    coverage: new Set(),
    errors: new Map()
};

let bufferTimeout: ReturnType<typeof setTimeout> | null = null;

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
            // Simulation should be less aggressive and REUSE the execution
            // instead of spawning new processes constantly
            simulationInterval = setInterval(() => {
                if (get().livePreviewEnabled) {
                    get().runExecution();
                }
            }, 1000); // 1s is safer for full process re-runs
        }
    },

    setLivePreviewEnabled: (enabled: boolean) => {
        set({ livePreviewEnabled: enabled });
        if (enabled) {
            get().runExecution();
        } else {
            // Clean up when disabled
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

        // Force execution if it's NOT a custom (internal/typing) trigger, 
        // OR if live preview is explicitly enabled.
        const shouldExecute = (customCode === undefined) || livePreviewEnabled;

        if (!codeToRun || codeToRun.trim() === '') {
            set({
                executionResults: new Map(),
                executionErrors: new Map(),
                executionCoverage: new Set()
            });
            return;
        }

        if (window.electron && shouldExecute) {
            // Reset buffer for new run but DON'T clear store yet to prevent flicker
            updateBuffer = {
                results: new Map(),
                coverage: new Set(),
                errors: new Map()
            };

            const flushBuffer = () => {
                set({
                    executionResults: new Map(updateBuffer.results),
                    executionCoverage: new Set(updateBuffer.coverage),
                    executionErrors: new Map(updateBuffer.errors)
                });
                bufferTimeout = null;
            };

            const scheduleFlush = () => {
                if (!bufferTimeout) {
                    bufferTimeout = setTimeout(flushBuffer, 50); // Batch updates every 50ms
                }
            };

            if (!listenersInitialized) {
                window.electron.onExecutionLog((data) => {
                    if ('level' in data && data.level === 'data') {
                        const canvasData = data as { args: [string, unknown] };
                        if (canvasData.args?.[0] === 'canvasData') {
                            set({ runtimeValues: { canvasData: canvasData.args[1] } });
                        }
                        return;
                    }

                    if ('type' in data) {
                        if (data.type === 'execution:value') {
                            const { line, value, valueType } = data;
                            const lineNum = Number(line);
                            const targetLine = lineNum === 0 ? 0 : lineNum;

                            const existing = updateBuffer.results.get(targetLine) ?? [];
                            existing.push({ value, type: valueType ?? 'spy' });
                            updateBuffer.results.set(targetLine, existing);
                            scheduleFlush();
                        } else if (data.type === 'execution:coverage') {
                            const { line } = data;
                            updateBuffer.coverage.add(Number(line));
                            scheduleFlush();
                        } else if (data.type === 'execution:log') {
                            const args = data.args ?? [];
                            const msg = args.map((a: unknown) =>
                                (typeof a === 'object' && a !== null) ? JSON.stringify(a) : String(a)
                            ).join(' ');
                            // eslint-disable-next-line no-console
                            console.log(`[Backend ${data.level ?? 'log'}] ${msg}`);
                        }
                    }
                });
                window.electron.onExecutionError((err) => {
                    if (typeof err === 'object' && err !== null) {
                        updateBuffer.errors.set(err.line, err.message);
                        scheduleFlush();
                    }
                });
                listenersInitialized = true;
            }
            window.electron.executionStart(codeToRun, pathToRun ?? undefined);
        }
    },
});
