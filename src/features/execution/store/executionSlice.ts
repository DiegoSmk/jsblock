import type { StateCreator } from 'zustand';
import type { AppState } from '../../../types/store';
import type { ExecutionSlice } from '../types';

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let executionDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
let listenersInitialized = false;
let lastExecutedCode = ''; // Elite change detection

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
                // Simulation is for animation-heavy flows (Canvas)
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

        // ELITE CHANGE DETECTION: Don't run if code hasn't changed
        // Unless it's a manual trigger (customCode === undefined) or a simulation pulse
        if (!isSimulationTrigger && customCode !== undefined && codeToRun === lastExecutedCode) {
            return;
        }

        // Safety: don't run empty code
        if (!codeToRun || codeToRun.trim() === '') {
            set({ executionResults: new Map(), executionErrors: new Map(), executionCoverage: new Set() });
            return;
        }

        const shouldExecute = (customCode === undefined) || livePreviewEnabled;
        if (window.electron && shouldExecute) {
            lastExecutedCode = codeToRun;

            // Wipe buffer for new run
            buffer = { results: new Map(), coverage: new Set(), errors: new Map() };
            hasPendingUpdates = false;

            // Use requestAnimationFrame for smooth, flicker-free UI updates
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

                        // Prevent infinite duplication in buffer
                        if (existing.length < 50) {
                            existing.push({ value, type: valueType ?? 'spy' });
                            buffer.results.set(lineNum, existing);
                            scheduleUpdate();
                        }
                    } else if (data.type === 'execution:coverage') {
                        buffer.coverage.add(Number(data.line));
                        scheduleUpdate();
                    } else if (data.type === 'execution:log') {
                        // Consoles logs are handled separately for stability
                        // eslint-disable-next-line no-console
                        console.log(`[JS-BLOCK]`, ... (data.args || []));
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
