global.self = global;

try {
    require('esbuild-register');
} catch (e) {
    console.error('Failed to load esbuild-register. Please ensure it is installed: npm install esbuild-register');
    process.exit(1);
}

// Intercept console
function sendLog(level, ...args) {
    if (process.send) {
        const safeArgs = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.parse(JSON.stringify(arg));
                } catch (e) { return '[Object]'; }
            }
            return arg;
        });

        try {
            process.send({
                type: 'execution:log',
                level,
                args: safeArgs
            });
        } catch (e) { /* ignore */ }
    }
}

console.log = (...args) => sendLog('log', ...args);
console.error = (...args) => sendLog('error', ...args);

let activeFilePath = null;

// Helper to send the current state (Variable values + Canvas)
// Helper to send the current state (Variable values + Canvas)
const sendUpdate = (moduleExports) => {
    if (!process.send) return;

    let variables = {};

    // 1. Try to get variables from module.exports
    if (moduleExports && typeof moduleExports === 'object') {
        Object.keys(moduleExports).forEach(key => {
            variables[key] = moduleExports[key];
        });
    }

    // 2. Fallback: check global.__exports if our injection used it
    if (global.__exports && typeof global.__exports === 'object') {
        Object.assign(variables, global.__exports);
    }

    const canvasData = global.canvasData || (moduleExports && moduleExports.canvasData);

    try {
        process.send({
            type: 'execution:result',
            variables,
            canvasData: canvasData || null
        });
    } catch (e) { /* Serialization error */ }
};

// Listen for execution request
process.on('message', (msg) => {
    if (msg && msg.type === 'execution:start' && msg.filePath) {
        activeFilePath = msg.filePath;
        try {
            // Clear cache to allow re-running the file
            try {
                const resolved = require.resolve(msg.filePath);
                delete require.cache[resolved];
            } catch (e) { }

            // Clear previous global exports capture to avoid stale data
            global.__exports = {};
            global.canvasData = null; // Optional: reset canvas on new run? Maybe not if simulating.

            // Execute
            const moduleExports = require(msg.filePath);
            sendUpdate(moduleExports);
        } catch (err) {
            console.error('[Runner Error]', err);
            // Send full error object details
            if (process.send) {
                process.send({
                    type: 'execution:error',
                    message: err.message,
                    stack: err.stack
                });
            }
        }
    }
});

// Support dynamic simulations: poll for changes
setInterval(() => {
    if (!activeFilePath) return;
    try {
        // We need to re-read the exports from the cache or global state
        const resolved = require.resolve(activeFilePath);
        const moduleExports = require.cache[resolved]?.exports;
        sendUpdate(moduleExports);
    } catch (e) { }
}, 100);
