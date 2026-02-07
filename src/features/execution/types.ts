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

export interface BenchmarkResult {
    runtime: 'node' | 'bun' | 'deno';
    avgTime: number;
    minTime: number;
    maxTime: number;
    iterations: number;
    output: string;
    isWinner?: boolean;
}

export interface BenchmarkRecord {
    id: string;
    timestamp: number;
    filePath?: string;
    line: number;
    results: BenchmarkResult[];
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
    systemStats: { cpu: number };
    currentRuntime: 'node' | 'bun' | 'deno';

    toggleSimulation: () => void;
    runExecution: (customCode?: string, customPath?: string) => void;
    runExecutionDebounced: (customCode?: string, customPath?: string) => void;
    setLivePreviewEnabled: (enabled: boolean) => void;
    setRuntime: (runtime: 'node' | 'bun' | 'deno') => void;
    checkAvailability: () => Promise<void>;
    isListenersInitialized?: boolean;
    lastExecutedCode?: string | null;
}

export interface BenchmarkSlice {
    isBenchmarking: boolean;
    benchmarkResults: BenchmarkResult[] | null;
    benchmarkHistory: BenchmarkRecord[];

    runBenchmark: (code: string, line: number) => Promise<void>;
    setBenchmarkResults: (results: BenchmarkResult[] | null) => void;
    clearBenchmarkHistory: () => void;
    removeBenchmarkRecord: (id: string) => void;
}
