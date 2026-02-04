import { fork, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow } from 'electron';
import { Instrumenter } from './Instrumenter';

export class ExecutionManager {
    private runnerProcess: ChildProcess | null = null;
    private mainWindow: BrowserWindow | null = null;

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
    }

    async startExecution(code: string, originalPath?: string) {
        let filePath: string;

        if (originalPath) {
            const tempDir = path.dirname(originalPath);
            const fileName = path.basename(originalPath);
            filePath = path.join(tempDir, `.exec.${fileName}`);
        } else {
            // Write code to temp file
            const userDataPath = app.getPath('userData');
            const tempDir = path.join(userDataPath, 'temp_execution');

            if (!fs.existsSync(tempDir)) {
                await fs.promises.mkdir(tempDir, { recursive: true });
            }

            filePath = path.join(tempDir, 'user_script.ts');
        }

        // Instrument code before writing
        const instrumentedCode = Instrumenter.instrumentCode(code);
        await fs.promises.writeFile(filePath, instrumentedCode, 'utf-8');

        // Reuse process if alive and connected
        if (this.runnerProcess && !this.runnerProcess.killed && this.runnerProcess.connected) {
            try {
                this.runnerProcess.send({
                    type: 'execution:start',
                    filePath
                });
                return;
            } catch (err) {
                console.warn('Failed to send to existing runner, restarting...', err);
                this.stopExecution();
            }
        }

        // Resolve runner path
        // In dev (electron .), __dirname might be 'electron' or 'dist/electron' depending on how it's launched.
        // But usually we run from 'dist/electron' after tsc.
        let runnerPath = path.join(__dirname, '../runners/runner.js');

        // Check if file exists, if not try to resolve relative to source if we are in dev and it wasn't copied
        if (!fs.existsSync(runnerPath)) {
            // Fallback: assume we are in project root/electron/services and want ../runners/runner.js
            // But __dirname is where this file is compiled to.
            // Let's log it if it fails.
            console.warn(`Runner not found at ${runnerPath}, trying development path...`);
            runnerPath = path.resolve(process.cwd(), 'electron/runners/runner.js');
        }

        if (!fs.existsSync(runnerPath)) {
            console.error(`Runner script not found at ${runnerPath}`);
            if (this.mainWindow) {
                this.mainWindow.webContents.send('execution:error', `Runner script not found. Internal Error.`);
            }
            return;
        }

        try {
            this.runnerProcess = fork(runnerPath, [], {
                stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
                env: {
                    ...process.env,
                    // We need to ensure the child process can find node_modules for esbuild-register
                    // It should inherit by default.
                    ELECTRON_RUN_AS_NODE: '1'
                }
            });

            this.runnerProcess.on('message', (msg: any) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    if (msg.type === 'execution:log' || msg.type === 'execution:value') {
                        this.mainWindow.webContents.send('execution:log', msg);
                    } else if (msg.type === 'execution:error') {
                        this.mainWindow.webContents.send('execution:error', msg);
                    }
                }
            });

            this.runnerProcess.on('error', (err) => {
                 console.error('Runner process error:', err);
                 if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('execution:error', err.message);
                }
            });

            // Send start command
            this.runnerProcess.send({
                type: 'execution:start',
                filePath
            });
        } catch (e) {
            console.error('Failed to spawn runner:', e);
            if (this.mainWindow) {
                this.mainWindow.webContents.send('execution:error', `Failed to spawn runner: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
    }

    stopExecution() {
        if (this.runnerProcess) {
            this.runnerProcess.kill();
            this.runnerProcess = null;
        }
    }
}
