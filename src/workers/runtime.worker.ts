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
            return `"${item.id}": (function(){ try { return ${item.expr} } catch(e) { return undefined } })()`;
        }).join(',');

        // We use a Function constructor instead of direct eval where possible,
        // but here we need to execute the user's code which might be anything.
        // Running it inside a worker isolates the main thread.
        // For further security, one should use a JS interpreter in WASM (like QuickJS).
        // For this refactor, we are moving to a Worker as requested.

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

        const evaluator = new Function(captureCode);
        const result = evaluator();
        self.postMessage(result);
    } catch (err) {
        console.warn("Worker evaluation failed:", err);
        self.postMessage({});
    }
};
