export interface RunnerMessage {
    type: 'execution:value' | 'execution:log' | 'execution:coverage' | 'execution:error' | 'execution:done';
    line?: number;
    column?: number;
    value?: string;
    valueType?: 'spy' | 'log';
    level?: 'log' | 'info' | 'warn' | 'error' | 'data';
    args?: unknown[];
    message?: string;
}

export interface ExecutionError {
    message: string;
    line: number;
    column: number;
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

export interface IExecutionAdapter {
    id: string;
    isAvailable(): Promise<boolean>;
    execute(code: string, filePath: string): Promise<void>;
    stop(): void;
    onMessage(callback: (msg: RunnerMessage) => void): void;
    onError(callback: (err: ExecutionError) => void): void;
    onDone(callback: () => void): void;
}
