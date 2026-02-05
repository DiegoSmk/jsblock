import type { StateCreator } from 'zustand';
import type { AppState } from '../../../types/store';
import type { ExecutionSlice } from '../types';

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let executionDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
let listenersInitialized = false;

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
            }, 100);
        }
    },

    setLivePreviewEnabled: (enabled: boolean) => {
        set({ livePreviewEnabled: enabled });
        if (enabled) {
            get().runExecution();
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

        // Clear previous results on new run
        set({
            executionResults: new Map(),
            executionErrors: new Map(),
            executionCoverage: new Set()
        });

        if (window.electron && shouldExecute) {
            if (!listenersInitialized) {
                window.electron.onExecutionLog((data) => {
                    // Check for Canvas Data (discriminated by 'level' and absence of 'type' in definition, but existence in runtime)
                    if ('level' in data && data.level === 'data') {
                        // Narrowing to CanvasDataPayload
                        const canvasData = data as { args: [string, unknown] };
                        if (canvasData.args?.[0] === 'canvasData') {
                            set({ runtimeValues: { canvasData: canvasData.args[1] } });
                        }
                        return;
                    }

                    // Handle types that look like standard execution messages
                    if ('type' in data) {
                        if (data.type === 'execution:value') {
                            const { line, value, valueType } = data;
                            const lineNum = Number(line);
                            const targetLine = lineNum === 0 ? 0 : lineNum; // 0 for floating logs

                            const currentMap = new Map(get().executionResults);
                            const existing = currentMap.get(targetLine) ?? [];
                            existing.push({ value, type: valueType ?? 'spy' });
                            currentMap.set(targetLine, existing);
                            set({ executionResults: currentMap });
                        } else if (data.type === 'execution:coverage') {
                            const { line } = data;
                            const lineNum = Number(line);
                            const currentCoverage = new Set(get().executionCoverage);
                            currentCoverage.add(lineNum);
                            set({ executionCoverage: currentCoverage });
                        } else if (data.type === 'execution:log') {
                            const args = data.args ?? [];
                            const msg = args.map((a: unknown) =>
                                (typeof a === 'object' && a !== null) ? JSON.stringify(a) : String(a)
                            ).join(' ');
                            const level = data.level ?? 'log';
                            // eslint-disable-next-line no-console
                            console.log(`[Backend ${level}] ${msg}`);
                        }
                    }
                });
                window.electron.onExecutionError((err) => {
                    if (typeof err === 'object' && err !== null) {
                        const currentMap = new Map(get().executionErrors);
                        currentMap.set(err.line, err.message);
                        set({ executionErrors: currentMap });
                    } else {
                        console.error(`[Backend Error] ${typeof err === 'object' ? JSON.stringify(err) : String(err)}`);
                    }
                });
                listenersInitialized = true;
            }
            window.electron.executionStart(codeToRun, pathToRun ?? undefined);
        }
    },
});
