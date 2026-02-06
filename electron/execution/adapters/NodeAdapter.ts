import { BaseAdapter } from '../BaseAdapter.js';
import path from 'path';
import fs from 'fs';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class NodeAdapter extends BaseAdapter {
    id = 'node';

    async isAvailable(): Promise<boolean> {
        try {
            await execAsync('node --version');
            return true;
        } catch {
            return false;
        }
    }

    async execute(code: string, filePath: string): Promise<void> {
        let runnerPath = path.join(__dirname, '../../runners/mcp-runner.js');

        // Fallback for development where __dirname might be in dist/
        if (!fs.existsSync(runnerPath)) {
            runnerPath = path.resolve(process.cwd(), 'electron/runners/mcp-runner.ts');
        }

        const isTs = runnerPath.endsWith('.ts');

        // Ensure we are using 'node' with esbuild-register for runtime execution
        const finalCommand = 'node';
        const finalArgs = isTs
            ? ['--loader', 'esbuild-register/loader', runnerPath]
            : [runnerPath];

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
