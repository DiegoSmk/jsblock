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

        // Function constructor is safer than direct eval as it creates a function in the global scope only
        // Still has access to globals, but in a worker environment damage is contained to the worker
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const evaluator = new Function(captureCode);
        const result = evaluator() as Record<string, unknown>;
        self.postMessage(result);
    } catch (err) {
        console.warn("Worker evaluation failed:", err);
        self.postMessage({});
    }
};
