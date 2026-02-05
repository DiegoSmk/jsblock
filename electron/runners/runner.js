// Runner script for executing instrumented code
// The code is now pre-transpiled by esbuild in the ExecutionManager

// Safe stringify to handle circular refs and basic types
function safeStringify(obj) {
    if (obj === undefined) return 'undefined';
    if (obj === null) return 'null';
    if (typeof obj === 'function') return '[Function]';
    if (obj instanceof Promise) return '[Promise]';
    if (obj instanceof Error) return obj.message;

    try {
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'function') return '[Function]';
            if (value instanceof Promise) return '[Promise]';
            return value;
        });
    } catch (e) {
        return String(obj);
    }
}

// Global Spy Function (injected by Instrumenter)
global.__spy = (val, line, type = 'spy') => {
    if (process.send) {
        process.send({
            type: 'execution:value',
            line,
            value: safeStringify(val),
            valueType: type
        });
    }
    return val;
};

// Global Coverage Function
global.__coverage = (line) => {
    if (process.send) {
        process.send({
            type: 'execution:coverage',
            line
        });
    }
};


// Intercept console
const originalLog = console.log;
const originalError = console.error;

function sendLog(level, ...args) {
    if (process.send) {
        const safeArgs = args.map(arg => {
            if (typeof arg === 'function') return '[Function]';
            if (arg instanceof Promise) return '[Promise]';
            if (arg instanceof Error) return { message: arg.message, stack: arg.stack, name: arg.name };
            return arg;
        });

        try {
            process.send({
                type: 'execution:log',
                level,
                args: safeArgs
            });
        } catch (e) {
            process.send({
                type: 'execution:log',
                level: 'error',
                args: ['[IPC Error: Could not serialize log message]']
            });
        }
    }
}

console.log = (...args) => {
    sendLog('log', ...args);
};
console.info = (...args) => sendLog('info', ...args);
console.warn = (...args) => sendLog('warn', ...args);
console.error = (...args) => sendLog('error', ...args);

// Listen for execution request
process.on('message', (msg) => {
    if (msg && msg.type === 'execution:start' && msg.filePath) {
        console.log(`[RUNNER] Starting execution of: ${msg.filePath}`);
        try {
            // Clear cache to allow re-running
            try {
                // We resolve relative to cwd? Or absolute path provided?
                // The manager should provide absolute path.
                const resolved = require.resolve(msg.filePath);
                delete require.cache[resolved];
            } catch (e) {
                // ignore if not found
            }
            const moduleExports = require(msg.filePath);

            // Check for canvasData to support visualization (UI Regression Mitigation)
            const canvasData = global.canvasData || (moduleExports && moduleExports.canvasData);
            if (canvasData) {
                process.send({
                    type: 'execution:log',
                    level: 'data',
                    args: ['canvasData', canvasData]
                });
            }
        } catch (err) {
            // Error handling with line detection
            if (process.send) {
                let line = 0;
                let column = 0;

                if (err.stack) {
                    // Try to find the line in the instrumented file
                    const stackLines = err.stack.split('\n');
                    // Look for the user script path in the stack
                    const fileLine = stackLines.find(l => l.includes(msg.filePath));
                    if (fileLine) {
                        // Format is usually: at Object.<anonymous> (/path/to/file.ts:line:column)
                        const match = fileLine.match(/:(\d+):(\d+)\)/) || fileLine.match(/:(\d+):(\d+)/);
                        if (match) {
                            line = parseInt(match[1], 10);
                            column = parseInt(match[2], 10);
                        }
                    }
                }

                process.send({
                    type: 'execution:error',
                    message: err.message.replace(/^Transform failed with \d+ error:\s*/, '').replace(new RegExp(msg.filePath + ':(\\d+):(\\d+):\\s*'), ''),
                    line,
                    column
                });
            } else {
                console.error(err);
            }
        }
    }
});
