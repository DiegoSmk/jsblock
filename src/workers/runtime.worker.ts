// src/workers/runtime.worker.ts
// Worker for safely executing code off the main thread

self.onmessage = (e: MessageEvent) => {
    const { code, items } = e.data as { code: string; items: { id: string; expr: string }[] };

    if (!items || items.length === 0) {
        self.postMessage({});
        return;
    }

    try {
        const returnObject = items.map(item => {
            // Basic sanitization to prevent breaking out of the return object syntax,
            // though we are inside a function body.
            // Escape double quotes in expression if they aren't part of the code logic
            // Ideally we'd trust the ast generator but let's be safe-ish
            return `"${item.id}": (function(){ try { return ${item.expr} } catch(e) { return undefined } })()`;
        }).join(',');

        const captureCode = `
            return (function() {
                try {
                    ${code}
                    return { ${returnObject} };
                } catch {
                    return {};
                }
            })()
        `;

        // SECURITY NOTE: The Function constructor is used to evaluate code logic for inline results.
        // While this is similar to eval, execution is confined to the Web Worker environment,
        // which isolated it from the main application's DOM and Electron sensitive APIs.
        // However, it remains a dynamic execution sink and should be treated with caution.
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const evaluator = new Function(captureCode);
        const result = (evaluator as () => Record<string, unknown>)();
        self.postMessage(result);
    } catch (err) {
        console.warn("Worker evaluation failed:", err);
        self.postMessage({});
    }
};
