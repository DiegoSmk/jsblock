import { BaseAdapter } from '../BaseAdapter.js';
import path from 'path';
import fs from 'fs';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DenoAdapter extends BaseAdapter {
    id = 'deno';

    private async resolveExecutable(): Promise<string> {
        try {
            await execAsync('deno --version');
            return 'deno';
        } catch {
            const localPath = path.join(process.env.HOME ?? '', '.deno/bin/deno');
            if (fs.existsSync(localPath)) {
                return localPath;
            }
            return 'deno';
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await execAsync('deno --version');
            return true;
        } catch {
            // Check common local install path on Linux
            const localPath = path.join(process.env.HOME ?? '', '.deno/bin/deno');
            if (fs.existsSync(localPath)) {
                return true;
            }
            return false;
        }
    }

    async execute(code: string, filePath: string): Promise<void> {
        let runnerPath = path.resolve(__dirname, '../../runners/mcp-runner.js');

        // Fallback for dev environment if needed
        if (!fs.existsSync(runnerPath)) {
            runnerPath = path.resolve(process.cwd(), 'electron/runners/mcp-runner.ts');
        }

        // Deno needs permissions to run the runner
        const finalCommand = await this.resolveExecutable();
        const finalArgs = [
            'run',
            '--allow-read',
            '--allow-env',
            '--allow-run',
            '--allow-net', // Needed for MCP communication if using sockets (internal)
            '--allow-sys', // Needed for some Node APIs in Deno
            '--unstable-node-globals', // Ensure setImmediate/process are better handled
            runnerPath
        ];

        await this.spawnProcess(finalCommand, finalArgs);

        if (this.mcpClient) {
            await this.mcpClient.request(
                {
                    method: 'tools/call',
                    params: {
                        name: 'start_execution',
                        arguments: { filePath }
                    }
                },
                CallToolResultSchema
            );
        }
    }
}
