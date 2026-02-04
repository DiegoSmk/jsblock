const { register } = require('esbuild-register/dist/node');

// Register esbuild to handle .ts files
register({
  target: 'node18'
});

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

console.log = (...args) => sendLog('log', ...args);
console.info = (...args) => sendLog('info', ...args);
console.warn = (...args) => sendLog('warn', ...args);
console.error = (...args) => sendLog('error', ...args);

// Listen for execution request
process.on('message', (msg) => {
    if (msg && msg.type === 'execution:start' && msg.filePath) {
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
            console.error(err);
        }
    }
});
