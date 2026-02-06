import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Fallback for setImmediate which is not standard in all runtimes (Deno)
const safeSetImmediate = (fn: (...args: any[]) => void) => {
    if (typeof (globalThis as any).setImmediate !== 'undefined') {
        return (globalThis as any).setImmediate(fn);
    }
    return setTimeout(fn, 0);
};

// Safe way to get require in both CJS and ESM environments for the runner
const getRequire = () => {
    try {
        // @ts-ignore
        if (typeof require !== 'undefined') return require;
    } catch (e) {
        // Ignore
    }

    try {
        // Fallback for ESM environments (Deno/Bun with node: compatibility)
        // Using runnerMetadata.require if available (which should be the global require in CJS)
        const nodeModule = runnerMetadata.require ? runnerMetadata.require('node:module') : null;
        if (nodeModule && nodeModule.createRequire) {
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
let notificationBuffer: any[] = [];
let totalNotificationsSent = 0;
const MAX_NOTIFICATIONS = 50000;
const BATCH_INTERVAL_MS = 50;
let batchTimeout: NodeJS.Timeout | null = null;
let isExecutionLimitReached = false;

// Intelligent Sampling state
const lineHitCounts = new Map<number, number>();
const lineLatestValues = new Map<number, any>();
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
        } as any
    });

    notificationBuffer = [];
    if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
    }
}

// Helper to send notifications back to the Electron Client
function sendOutputNotification(payload: any) {
    if (isExecutionLimitReached) return;

    // Handle non-execution messages (logs, status) normally
    if (!payload.line) {
        notificationBuffer.push(payload);
        return;
    }

    const lineNum = Number(payload.line);
    const hitCount = (lineHitCounts.get(lineNum) || 0) + 1;
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
    } else if (!batchTimeout) {
        batchTimeout = setTimeout(flushNotifications, BATCH_INTERVAL_MS);
    }
}

function sendStatusNotification(type: 'done' | 'error', data?: any) {
    // Flush any pending notifications before status
    flushNotifications();

    void server.notification({
        method: 'execution/status',
        params: { type, ...data }
    });
}

// Global Spy Function (injected by Instrumenter)
(globalThis as any).__spy = (val: any, line: number, type = 'spy') => {
    sendOutputNotification({
        type: 'execution:value',
        line,
        value: safeStringify(val),
        valueType: type
    });
    return val;
};

// Global Coverage Function
(globalThis as any).__coverage = (line: number) => {
    sendOutputNotification({
        type: 'execution:coverage',
        line
    });
};

// Intercept console
function sendLogNotification(level: string, ...args: any[]) {
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

console.log = (...args) => sendLogNotification('log', ...args);
console.info = (...args) => sendLogNotification('info', ...args);
console.warn = (...args) => sendLogNotification('warn', ...args);
console.error = (...args) => sendLogNotification('error', ...args);

// MCP Tools Setup
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
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
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'start_execution') {
        const filePath = request.params.arguments?.filePath as string;

        try {
            const runnerRequire = getRequire();
            // Clear cache to allow re-running
            const resolved = runnerRequire.resolve(filePath);
            delete runnerRequire.cache[resolved];

            // Defer execution to allow Tool Call response to be sent (avoids MCP Timeout)
            safeSetImmediate(() => {
                try {
                    runnerRequire(filePath);
                    sendStatusNotification('done');
                } catch (err: any) {
                    let line = 0;
                    let column = 0;

                    if (err.stack) {
                        const stackLines = (err.stack as string).split('\n');
                        const fileLine = stackLines.find((l: string) => l.includes(filePath));
                        if (fileLine) {
                            const match = fileLine.match(/:(\d+):(\d+)\)/) || fileLine.match(/:(\d+):(\d+)/);
                            if (match) {
                                line = parseInt(match[1], 10);
                                column = parseInt(match[2], 10);
                            }
                        }
                    }

                    sendStatusNotification('error', {
                        error: {
                            message: err.message,
                            line,
                            column
                        }
                    });
                }
            });

            return { content: [{ type: 'text', text: 'Execution triggered successfully' }] };
        } catch (err: any) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Failed to resolve script: ${err.message as string}` }]
            };
        }
    }
    throw new Error('Tool not found');
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
