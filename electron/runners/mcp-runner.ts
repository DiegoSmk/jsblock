import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Professional Type Augmentation
 * Defines our custom globals so we don't use 'any'
 */
declare global {
    var __spy: (val: unknown, line: number, type?: string) => unknown;
    var __coverage: (line: number) => void;
}

// Fallback for setImmediate which is not standard in all runtimes (Deno)
const safeSetImmediate = (fn: (...args: unknown[]) => void): void => {
    const globalObj = globalThis as unknown as { setImmediate: (fn: (...args: unknown[]) => void) => void };
    if (typeof globalObj.setImmediate !== 'undefined') {
        globalObj.setImmediate(fn);
        return;
    }
    setTimeout(fn, 0);
};

interface RunnerRequire extends NodeRequire {
    cache: NodeJS.Dict<NodeModule>;
}

// Safe way to get require in both CJS and ESM environments for the runner
const getRequire = (): RunnerRequire => {
    if (typeof require !== 'undefined') {
        return require as RunnerRequire;
    }

    const runnerMeta = runnerMetadata as unknown as { require?: (id: string) => unknown };
    if (runnerMeta.require) {
        try {
            const nodeModule = (runnerMeta.require as (id: string) => unknown)('node:module') as { createRequire?: (url: string) => RunnerRequire };
            if (nodeModule?.createRequire) {
                return nodeModule.createRequire(String(eval('import.meta.url')));
            }
        } catch {
            // Fallback handled below
        }
    }

    throw new Error('Runtime does not support "require" - needed for synchronous execution of instrumented code.');
};

const runnerMetadata = {
    require: typeof require !== 'undefined' ? require : null
};

// Safe stringify to handle circular refs and basic types
function safeStringify(obj: unknown): string {
    if (obj === undefined) return 'undefined';
    if (obj === null) return 'null';
    if (typeof obj === 'function') return '[Function]';
    if (obj instanceof Promise) return '[Promise]';
    if (obj instanceof Error) return obj.message;

    try {
        const json = JSON.stringify(obj, (_key, value: unknown) => {
            if (typeof value === 'function') return '[Function]';
            if (value instanceof Promise) return '[Promise]';
            return value;
        });
        // Truncate long strings to prevent IPC bloat
        return json.length > 1000 ? json.substring(0, 1000) + '... [truncated]' : json;
    } catch {
        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || obj === null || obj === undefined) {
            return String(obj);
        }
        return '[Object]';
    }
}

const server = new Server(
    { name: 'js-blueprints-mcp-runner', version: '1.0.0' },
    { capabilities: { tools: {} } }
);

// Sampling and Batching state
let notificationBuffer: unknown[] = [];
const MAX_NOTIFICATIONS = 50000;
const BATCH_INTERVAL_MS = 50;
let batchTimeout: NodeJS.Timeout | null = null;
let isExecutionLimitReached = false;
let totalNotificationsSent = 0;

// Intelligent Sampling state
const lineHitCounts = new Map<number, number>();
const lineLatestValues = new Map<number, unknown>();
const INITIAL_SAMPLING_LIMIT = 5;

function flushNotifications() {
    if (notificationBuffer.length === 0 && lineLatestValues.size === 0) return;

    for (const payload of lineLatestValues.values()) {
        notificationBuffer.push(payload);
    }
    lineLatestValues.clear();

    if (notificationBuffer.length === 0) return;

    void server.notification({
        method: 'execution/output',
        params: {
            type: 'batch',
            items: notificationBuffer
        }
    });

    notificationBuffer = [];
    if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
    }
}

function sendOutputNotification(payload: { line?: string | number } & Record<string, unknown>) {
    if (isExecutionLimitReached) return;

    if (!payload.line) {
        notificationBuffer.push(payload);
        batchTimeout ??= setTimeout(flushNotifications, BATCH_INTERVAL_MS);
        return;
    }

    const lineNum = Number(payload.line);
    const hitCount = (lineHitCounts.get(lineNum) ?? 0) + 1;
    lineHitCounts.set(lineNum, hitCount);

    if (hitCount <= INITIAL_SAMPLING_LIMIT) {
        totalNotificationsSent++;
        notificationBuffer.push(payload);
    } else {
        lineLatestValues.set(lineNum, payload);
    }

    if (totalNotificationsSent > MAX_NOTIFICATIONS) {
        isExecutionLimitReached = true;
        flushNotifications();
        sendStatusNotification('error', {
            error: {
                message: `Event Limit Reached: Too many execution updates (${MAX_NOTIFICATIONS}).`,
                line: 1,
                column: 1
            }
        });
        return;
    }

    if (notificationBuffer.length >= 100) {
        flushNotifications();
    } else {
        batchTimeout ??= setTimeout(flushNotifications, BATCH_INTERVAL_MS);
    }
}

function sendStatusNotification(type: 'done' | 'error', data?: Record<string, unknown>) {
    flushNotifications();
    void server.notification({
        method: 'execution/status',
        params: { type, ...data }
    });
}

// Global instrumentation functions (properly typed via declare global above)
globalThis.__spy = (val: unknown, line: number, type = 'spy') => {
    sendOutputNotification({
        type: 'execution:value',
        line,
        value: safeStringify(val),
        valueType: type
    });
    return val;
};

globalThis.__coverage = (line: number) => {
    sendOutputNotification({
        type: 'execution:coverage',
        line
    });
};

function sendLogNotification(level: string, ...args: unknown[]) {
    const safeArgs = args.map(arg => {
        if (typeof arg === 'function') return '[Function]';
        if (arg instanceof Promise) return '[Promise]';
        if (arg instanceof Error) return { message: arg.message, stack: arg.stack, name: arg.name };
        return arg;
    });

    sendOutputNotification({
        type: 'execution:log',
        level,
        args: safeArgs
    });
}

const typedConsole = console as unknown as Record<string, (...args: unknown[]) => void>;
typedConsole.log = (...args) => sendLogNotification('log', ...args);
typedConsole.info = (...args) => sendLogNotification('info', ...args);
typedConsole.warn = (...args) => sendLogNotification('warn', ...args);
typedConsole.error = (...args) => sendLogNotification('error', ...args);

server.setRequestHandler(ListToolsRequestSchema, () => {
    return Promise.resolve({
        tools: [
            {
                name: 'start_execution',
                description: 'Starts execution of a specific file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filePath: { type: 'string' }
                    },
                    required: ['filePath']
                }
            }
        ]
    });
});

server.setRequestHandler(CallToolRequestSchema, (request) => {
    if (request.params.name === 'start_execution') {
        const filePath = request.params.arguments?.filePath as string;

        try {
            const runnerRequire = getRequire();
            const resolved = runnerRequire.resolve(filePath);
            const cache = runnerRequire.cache;
            if (cache?.[resolved]) {
                delete cache[resolved];
            }

            safeSetImmediate(() => {
                try {
                    runnerRequire(filePath);
                    sendStatusNotification('done');
                } catch (err: unknown) {
                    let line = 0;
                    let column = 0;

                    if (err instanceof Error && err.stack) {
                        const stackLines = err.stack.split('\n');
                        const fileLine = stackLines.find(l => l.includes(filePath));
                        if (fileLine) {
                            const match = (/:(\d+):(\d+)\)/.exec(fileLine)) ?? (/:(\d+):(\d+)/.exec(fileLine));
                            if (match) {
                                line = parseInt(match[1], 10);
                                column = parseInt(match[2], 10);
                            }
                        }
                    }

                    sendStatusNotification('error', {
                        error: {
                            message: err instanceof Error ? err.message : String(err),
                            line,
                            column
                        }
                    });
                }
            });

            return Promise.resolve({ content: [{ type: 'text', text: 'Execution triggered' }] });
        } catch (err: unknown) {
            return Promise.resolve({
                isError: true,
                content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }]
            });
        }
    }
    throw new Error('Tool not found');
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(error => {
    const err = error as Error;
    sendLogNotification('error', 'Main Loop Error', err.message);
});
