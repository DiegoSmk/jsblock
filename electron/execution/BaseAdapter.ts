import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { EventEmitter } from 'events';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { IExecutionAdapter, RunnerMessage, ExecutionError } from './types.js';

export abstract class BaseAdapter extends EventEmitter implements IExecutionAdapter {
    abstract id: string;
    protected mcpClient: Client | null = null;
    protected transport: Transport | null = null;

    abstract isAvailable(): Promise<boolean>;

    protected async spawnProcess(command: string, args: string[]): Promise<void> {
        this.stop();

        const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

        this.transport = new StdioClientTransport({
            command,
            args,
            env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } as Record<string, string>,
            stderr: 'inherit'
        });

        this.mcpClient = new Client(
            { name: `js-blueprints-executor-${this.id}`, version: '1.0.0' },
            { capabilities: {} }
        );

        // Use fallback handler for custom execution notifications
        this.mcpClient.fallbackNotificationHandler = (notification: { method: string; params?: unknown }) => {
            if (notification.method === 'execution/output') {
                const params = notification.params as { type: string; items?: RunnerMessage[] };
                if (params.type === 'batch' && Array.isArray(params.items)) {
                    params.items.forEach((item: RunnerMessage) => {
                        this.emit('message', item);
                    });
                } else {
                    this.emit('message', params as unknown as RunnerMessage);
                }
            } else if (notification.method === 'execution/status') {
                const params = notification.params as { type: string; error?: ExecutionError };
                if (params.type === 'error' && params.error) {
                    this.emit('error', params.error);
                } else if (params.type === 'done') {
                    this.emit('done');
                }
            }
            return Promise.resolve();
        };

        if (this.mcpClient) {
            await this.mcpClient.connect(this.transport);
        }

        if (this.transport) {
            this.transport.onclose = () => {
                this.emit('done');
            };

            this.transport.onerror = (err: Error) => {
                // eslint-disable-next-line no-restricted-syntax
                const message = err.message.includes('ENOENT')
                    ? `Runtime '${command}' not found. Please install it to use this engine.`
                    : err.message;
                this.emit('error', { message, line: 0, column: 0 });
            };
        }
    }

    abstract execute(code: string, filePath: string): Promise<void>;

    stop(): void {
        if (this.transport) {
            void this.transport.close().catch((_err: unknown) => { /* ignore */ });
            this.transport = null;
        }
        if (this.mcpClient) {
            this.mcpClient = null;
        }
    }

    onMessage(callback: (msg: RunnerMessage) => void): void {
        this.on('message', callback);
    }

    onError(callback: (err: ExecutionError) => void): void {
        this.on('error', callback);
    }

    onDone(callback: () => void): void {
        this.on('done', callback);
    }
}
