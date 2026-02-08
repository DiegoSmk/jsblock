import { parseCodeToFlow } from './parser/Parser';
import { getLayoutedElements } from './layout';

interface WorkerMessage {
    code: string;
    id: number;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { code, id } = e.data;

    // Safety check
    if (typeof code !== 'string') {
        return;
    }

    try {
        // 1. Parse AST to Nodes/Edges
        const { nodes, edges } = parseCodeToFlow(code);

        // 2. Compute Layout (expensive operation)
        const layouted = getLayoutedElements(nodes, edges);

        // 3. Return result
        self.postMessage({ ...layouted, id });
    } catch (err) {
        console.error('Worker Parse Error:', err);
        // Return empty on failure to avoid hanging
        self.postMessage({ nodes: [], edges: [], id });
    }
};
