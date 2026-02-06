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
    isBenchmarking: boolean;
    benchmarkResults: BenchmarkResult[] | null;
    benchmarkHistory: BenchmarkRecord[];
    livePreviewEnabled: boolean;
    runtimeValues: Record<string, unknown>;
    availableRuntimes: Record<'node' | 'bun' | 'deno', boolean>;
    systemStats: { cpu: number };

    toggleSimulation: () => void;
    runExecution: (customCode?: string, customPath?: string) => void;
    runExecutionDebounced: (customCode?: string, customPath?: string) => void;
    runBenchmark: (code: string, line: number) => Promise<void>;
    setBenchmarkResults: (results: BenchmarkResult[] | null) => void;
    setLivePreviewEnabled: (enabled: boolean) => void;
    currentRuntime: 'node' | 'bun' | 'deno';
    setRuntime: (runtime: 'node' | 'bun' | 'deno') => void;
    checkAvailability: () => Promise<void>;
    clearBenchmarkHistory: () => void;
    removeBenchmarkRecord: (id: string) => void;
}
