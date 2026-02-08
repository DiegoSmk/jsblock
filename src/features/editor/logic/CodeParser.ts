import type { AppNode } from '../types';
import type { Edge } from '@xyflow/react';

let worker: Worker | null = null;
let messageId = 0;
const pendingRequests = new Map<number, { resolve: (value: { nodes: AppNode[], edges: Edge[] }) => void, reject: (reason?: unknown) => void }>();

interface WorkerResponse {
    id: number;
    nodes: AppNode[];
    edges: Edge[];
}

const getWorker = () => {
    if (!worker) {
        // Correct path for Vite to pick up the worker
        worker = new Worker(new URL('./parser.worker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { id, nodes, edges } = e.data;
            const request = pendingRequests.get(id);
            if (request) {
                request.resolve({ nodes, edges });
                pendingRequests.delete(id);
            }
        };

        worker.onerror = (err) => {
            console.error('Worker error', err);
            for (const [id, request] of pendingRequests) {
                request.reject(err);
                pendingRequests.delete(id);
            }
        };
    }
    return worker;
};

export const parseCodeToFlowAsync = (code: string): Promise<{ nodes: AppNode[], edges: Edge[] }> => {
    // Check for Worker support (SSR or Test Env)
    if (typeof Worker === 'undefined') {
        console.warn('Web Workers are not supported in this environment. Returning empty flow.');
        return Promise.resolve({ nodes: [], edges: [] });
    }

    const id = ++messageId;
    return new Promise((resolve, reject) => {
        const w = getWorker();
        pendingRequests.set(id, { resolve, reject });
        w.postMessage({ code, id });
    });
};
