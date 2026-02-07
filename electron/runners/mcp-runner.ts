import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Fallback for setImmediate which is not standard in all runtimes (Deno)
const safeSetImmediate = (fn: (...args: unknown[]) => void): void => {
    const globalObj = globalThis as unknown as { setImmediate: (fn: (...args: unknown[]) => void) => void };
    if (typeof globalObj.setImmediate !== 'undefined') {
        globalObj.setImmediate(fn);
        return;
    }
    setTimeout(fn, 0);
};

// Safe way to get require in both CJS and ESM environments for the runner
const getRequire = (): any => {
    try {
        // @ts-ignore
        if (typeof require !== 'undefined') return require;
    } catch (e) {
        // Ignore
    }

    try {
        // Fallback for ESM environments (Deno/Bun with node: compatibility)
        // Using runnerMetadata.require if available (which should be the global require in CJS)
        const nodeModule = (runnerMetadata as any).require ? (runnerMetadata as any).require('node:module') : null;
        if (nodeModule?.createRequire) {
            return nodeModule.createRequire(eval('import.meta.url'));
        }
    } catch (e) {
        // Ignore
    }

    throw new Error('Runtime does not support "require" - needed for synchronous execution of instrumented code.');
};

const runnerMetadata = {
    // @ts-ignore - require might be global
    require: typeof require !== 'undefined' ? require : (null as any)
};

// Safe stringify to handle circular refs and basic types
function safeStringify(obj: unknown): string {
    if (obj === undefined) return 'undefined';
    if (obj === null) return 'null';
    if (typeof obj === 'function') return '[Function]';
    if (obj instanceof Promise) return '[Promise]';
    if (obj instanceof Error) return obj.message;

    try {
        const json = JSON.stringify(obj, (_key, value) => {
            if (typeof value === 'function') return '[Function]';
            if (value instanceof Promise) return '[Promise]';
            return value;
        });
        // Truncate long strings to prevent IPC bloat
        return json.length > 1000 ? json.substring(0, 1000) + '... [truncated]' : json;
    } catch (e) {
        return String(obj);
    }
}

const server = new Server(
    { name: 'js-blueprints-mcp-runner', version: '1.0.0' },
    { capabilities: { tools: {} } }
);

// Sampling and Batching state
let notificationBuffer: unknown[] = [];
let totalNotificationsSent = 0;
const MAX_NOTIFICATIONS = 50000;
const BATCH_INTERVAL_MS = 50;
let batchTimeout: NodeJS.Timeout | null = null;
let isExecutionLimitReached = false;

// Intelligent Sampling state
const lineHitCounts = new Map<number, number>();
const lineLatestValues = new Map<number, unknown>();
const INITIAL_SAMPLING_LIMIT = 5;

function flushNotifications() {
    if (notificationBuffer.length === 0 && lineLatestValues.size === 0) return;

    // Add latest values for sampled lines to the buffer
    for (const [line, payload] of lineLatestValues.entries()) {
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

// Helper to send notifications back to the Electron Client
function sendOutputNotification(payload: { line?: string | number } & Record<string, unknown>) {
    if (isExecutionLimitReached) return;

    // Handle non-execution messages (logs, status) normally
    if (!payload.line) {
        notificationBuffer.push(payload);
        batchTimeout ??= setTimeout(flushNotifications, BATCH_INTERVAL_MS);
        return;
    }

    const lineNum = Number(payload.line);
    const hitCount = (lineHitCounts.get(lineNum) ?? 0) + 1;
    lineHitCounts.set(lineNum, hitCount);

    if (hitCount <= INITIAL_SAMPLING_LIMIT) {
        // First 5 hits: Send immediately (batched)
        totalNotificationsSent++;
        notificationBuffer.push(payload);
    } else {
        // Hit > 5: Only keep the latest value for this line
        // This doesn't increase totalNotificationsSent because we only send ONE per batch
        lineLatestValues.set(lineNum, payload);
    }

    if (totalNotificationsSent > MAX_NOTIFICATIONS) {
        isExecutionLimitReached = true;
        flushNotifications(); // Send what's left
        sendStatusNotification('error', {
            error: {
                message: `Event Limit Reached: Too many execution updates (${MAX_NOTIFICATIONS}). Try a simpler version of the code.`,
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
    // Flush any pending notifications before status
    flushNotifications();

    void server.notification({
        method: 'execution/status',
        params: { type, ...data }
    });
}

// Global Spy Function (injected by Instrumenter)
(globalThis as unknown as { __spy: unknown }).__spy = (val: unknown, line: number, type = 'spy') => {
    sendOutputNotification({
        type: 'execution:value',
        line,
        value: safeStringify(val),
        valueType: type
    });
    return val;
};

// Global Coverage Function
(globalThis as unknown as { __coverage: unknown }).__coverage = (line: number) => {
    sendOutputNotification({
        type: 'execution:coverage',
        line
    });
};

// Intercept console
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

(console as unknown as Record<string, (...args: unknown[]) => void>).log = (...args: unknown[]) => sendLogNotification('log', ...args);
(console as unknown as Record<string, (...args: unknown[]) => void>).info = (...args: unknown[]) => sendLogNotification('info', ...args);
(console as unknown as Record<string, (...args: unknown[]) => void>).warn = (...args: unknown[]) => sendLogNotification('warn', ...args);
(console as unknown as Record<string, (...args: unknown[]) => void>).error = (...args: unknown[]) => sendLogNotification('error', ...args);

// MCP Tools Setup
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
            // Clear cache to allow re-running
            const resolved = runnerRequire.resolve(filePath);
            delete runnerRequire.cache[resolved];

            safeSetImmediate(() => {
                try {
                    runnerRequire(filePath);
                    sendStatusNotification('done');
                } catch (err: unknown) {
                    let line = 0;
                    let column = 0;

                    if (err instanceof Error && err.stack) {
                        const stackLines = (err.stack).split('\n');
                        const fileLine = stackLines.find((l: string) => l.includes(filePath));
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

            return Promise.resolve({ content: [{ type: 'text', text: 'Execution triggered successfully' }] });
        } catch (err: unknown) {
            return Promise.resolve({
                isError: true,
                content: [{ type: 'text', text: `Failed to resolve script: ${err instanceof Error ? err.message : String(err)}` }]
            });
        }
    }
    throw new Error('Tool not found');
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
