export interface ExecutionError {
    message: string;
    line: number;
    column?: number;
    errorCode?: string;
    suggestion?: {
        text: string;
        replace: string;
    };
}

export interface ExecutionSlice {
    executionResults: Map<number, { value: string; type: 'spy' | 'log' }[]>;
    executionErrors: Map<number, ExecutionError>;
    executionCoverage: Set<number>;
    isSimulating: boolean;
    isExecuting: boolean;
    livePreviewEnabled: boolean;
    runtimeValues: Record<string, unknown>;
    availableRuntimes: Record<'node' | 'bun' | 'deno', boolean>;

    toggleSimulation: () => void;
    runExecution: (customCode?: string, customPath?: string) => void;
    runExecutionDebounced: (customCode?: string, customPath?: string) => void;
    setLivePreviewEnabled: (enabled: boolean) => void;
    currentRuntime: 'node' | 'bun' | 'deno';
    setRuntime: (runtime: 'node' | 'bun' | 'deno') => void;
    checkAvailability: () => Promise<void>;
}
