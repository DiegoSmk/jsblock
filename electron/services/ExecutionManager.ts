import { fork, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow } from 'electron';
import { Instrumenter } from './Instrumenter';
import { transform } from 'esbuild';

export class ExecutionManager {
    private runnerProcess: ChildProcess | null = null;
    private mainWindow: BrowserWindow | null = null;
    private executionTimeout: NodeJS.Timeout | null = null;

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
    }

    async startExecution(code: string, originalPath?: string) {
        // 1. FORCE KILL previous process to prevent infinite loops
        this.stopExecution();

        let filePath: string;

        if (originalPath) {
            const tempDir = path.dirname(originalPath);
            const fileName = path.basename(originalPath);
            // Always use .js extension for the execution file to avoid loader issues
            filePath = path.join(tempDir, `.exec.${fileName.replace(/\.(ts|tsx|js|jsx)$/, '')}.js`);
        } else {
            // Write code to temp file
            const userDataPath = app.getPath('userData');
            const tempDir = path.join(userDataPath, 'temp_execution');

            if (!fs.existsSync(tempDir)) {
                await fs.promises.mkdir(tempDir, { recursive: true });
            }

            filePath = path.join(tempDir, 'user_script.js');
        }

        // Instrument code before writing
        let instrumentedCode = Instrumenter.instrumentCode(code);

        // Transpile to JS using esbuild
        try {
            const result = await transform(instrumentedCode, {
                loader: 'tsx',
                format: 'cjs',
                target: 'node18'
            });
            instrumentedCode = result.code;
        } catch (e: any) {
            console.error('[ExecutionManager] Transpilation failed:', e);
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                const error = e.errors?.[0];
                this.mainWindow.webContents.send('execution:error', {
                    message: error?.text || e.message || 'Transpilation failed',
                    line: error?.location?.line || 0,
                    column: error?.location?.column || 0
                });
            }
            return;
        }

        // Success signal: Transpilation passed
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('execution:started');
        }

        await fs.promises.writeFile(filePath, instrumentedCode, 'utf-8');

        // Resolve runner path
        let runnerPath = path.join(__dirname, '../runners/runner.js');
        if (!fs.existsSync(runnerPath)) {
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
                    ELECTRON_RUN_AS_NODE: '1'
                }
            });

            // 2. SET TIMEOUT (5 seconds failsafe)
            this.executionTimeout = setTimeout(() => {
                const isAlive = this.runnerProcess && !this.runnerProcess.killed;
                if (isAlive) {
                    console.warn('[ExecutionManager] Execution timed out (5s). Killing process.');
                    this.stopExecution();
                    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                        this.mainWindow.webContents.send('execution:error', {
                            message: 'Execution Timed Out (Infinite Loop Detected?)',
                            line: 0
                        });
                    }
                }
            }, 5000);

            this.runnerProcess.on('message', (msg: { type: string, [key: string]: unknown }) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    if (msg.type === 'execution:log' || msg.type === 'execution:value' || msg.type === 'execution:coverage') {
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
        if (this.executionTimeout) {
            clearTimeout(this.executionTimeout);
            this.executionTimeout = null;
        }

        if (this.runnerProcess) {
            try {
                this.runnerProcess.kill();
            } catch { /* ignore */ }
            this.runnerProcess = null;
        }
    }
}
