import type { AppNode } from '../types';
import type { Edge } from '@xyflow/react';

interface WorkerResponse {
    id: number;
    nodes: AppNode[];
    edges: Edge[];
    error?: any;
}

class CodeParserService {
    private worker: Worker | null = null;
    private messageId = 0;
    private pendingRequests = new Map<number, {
        resolve: (value: { nodes: AppNode[], edges: Edge[] }) => void,
        reject: (reason?: unknown) => void
    }>();

    private getWorker(): Worker {
        if (!this.worker) {
            this.worker = new Worker(new URL('./parser.worker.ts', import.meta.url), {
                type: 'module'
            });

            this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                const { id, nodes, edges, error } = e.data;
                const request = this.pendingRequests.get(id);
                if (request) {
                    if (error) request.reject(error);
                    else request.resolve({ nodes, edges });
                    this.pendingRequests.delete(id);
                }
            };

            this.worker.onerror = (err) => {
                console.error('Parser worker error:', err);
                for (const [id, request] of this.pendingRequests) {
                    request.reject(err);
                    this.pendingRequests.delete(id);
                }
            };
        }
        return this.worker;
    }

    public async parseCode(code: string): Promise<{ nodes: AppNode[], edges: Edge[] }> {
        if (typeof Worker === 'undefined') {
            console.warn('Web Workers not supported. Returning empty flow.');
            return { nodes: [], edges: [] };
        }

        const id = ++this.messageId;
        const worker = this.getWorker();

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            worker.postMessage({ id, code });
        });
    }

    public terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

export const codeParser = new CodeParserService();

/** @deprecated Use codeParser.parseCode instead */
export const parseCodeToFlowAsync = (code: string) => codeParser.parseCode(code);
