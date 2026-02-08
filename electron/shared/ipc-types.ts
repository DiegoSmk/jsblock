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

export interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
}

export interface IpcEvents {
    'terminal-data': (data: string) => void;
    'plugin:notification': (data: { message: string }) => void;
    'benchmark:result': (results: BenchmarkResult[]) => void;
    'execution:log': (data: ExecutionPayload) => void;
    'execution:error': (error: ExecutionError | string) => void;
    'execution:clear': () => void;
    'execution:started': () => void;
    'execution:done': () => void;
    'system:stats': (data: { cpu: number }) => void;
    'workspace:updated': (data: { event: string; path: string; tree: FileNode[] }) => void;
}
