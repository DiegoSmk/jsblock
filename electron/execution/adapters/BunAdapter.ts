import { BaseAdapter } from '../BaseAdapter.js';
import path from 'path';
import fs from 'fs';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BunAdapter extends BaseAdapter {
    id = 'bun';

    private async resolveExecutable(): Promise<string> {
        try {
            await execAsync('bun --version');
            return 'bun';
        } catch {
            const localPath = path.join(process.env.HOME ?? '', '.bun/bin/bun');
            if (fs.existsSync(localPath)) {
                return localPath;
            }
            return 'bun';
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await execAsync('bun --version');
            return true;
        } catch {
            // Check common local install path on Linux
            const localPath = path.join(process.env.HOME ?? '', '.bun/bin/bun');
            if (fs.existsSync(localPath)) {
                return true;
            }
            return false;
        }
    }

    async execute(code: string, filePath: string): Promise<void> {
        let runnerPath = path.join(__dirname, '../../runners/mcp-runner.js');

        // Fallback for development where __dirname might be in dist/
        if (!fs.existsSync(runnerPath)) {
            runnerPath = path.resolve(process.cwd(), 'electron/runners/mcp-runner.ts');
        }

        // Bun can run TS files directly without loaders
        const finalCommand = await this.resolveExecutable();
        const finalArgs = ['run', runnerPath];

        await this.spawnProcess(finalCommand, finalArgs);

        if (this.mcpClient) {
            // Start execution via MCP Tool
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
