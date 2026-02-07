export type ExecutionPayload =
    | { type: 'execution:log'; level: string; args: unknown[] }
    | { type: 'execution:value'; line: number; value: string; valueType?: 'spy' | 'log' }
    | { type: 'execution:coverage'; line: number }
    | { type: 'execution:started' }
    | { level: 'data'; args: ['canvasData', unknown] };

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

export interface SearchResult {
    file: string;
    line: number;
    text: string;
    matchIndex: number;
}

export interface SearchOptions {
    caseSensitive: boolean;
    regex: boolean;
}
