import { IExecutionAdapter } from './types.js';
import { NodeAdapter } from './adapters/NodeAdapter.js';
import { BunAdapter } from './adapters/BunAdapter.js';
import { DenoAdapter } from './adapters/DenoAdapter.js';

export type RuntimeType = 'node' | 'bun' | 'deno';

export class ExecutionFactory {
    static createAdapter(type: RuntimeType): IExecutionAdapter {
        switch (type) {
            case 'node':
                return new NodeAdapter();
            case 'bun':
                return new BunAdapter();
            case 'deno':
                return new DenoAdapter();
            default:
                throw new Error(`Unsupported runtime type: ${type as string}`);
        }
    }
}
