import { fork, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow } from 'electron';
import { Instrumenter } from './Instrumenter';
import { transform, Message } from 'esbuild';

export class ExecutionManager {
    private runnerProcess: ChildProcess | null = null;
    private mainWindow: BrowserWindow | null = null;
    private executionTimeout: NodeJS.Timeout | null = null;

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
    }

    async startExecution(code: string, originalPath?: string) {
        this.stopExecution();

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('execution:clear');
        }

        let filePath: string;
        if (originalPath) {
            const tempDir = path.dirname(originalPath);
            const fileName = path.basename(originalPath);
            filePath = path.join(tempDir, `.exec.${fileName.replace(/\.(ts|tsx|js|jsx)$/, '')}.js`);
        } else {
            const userDataPath = app.getPath('userData');
            const tempDir = path.join(userDataPath, 'temp_execution');
            if (!fs.existsSync(tempDir)) await fs.promises.mkdir(tempDir, { recursive: true });
            filePath = path.join(tempDir, 'user_script.js');
        }

        let instrumentedCode = Instrumenter.instrumentCode(code);

        try {
            const result = await transform(instrumentedCode, {
                loader: 'tsx',
                format: 'cjs',
                target: 'node18'
            });
            instrumentedCode = result.code;
        } catch (e: any) {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                const error = (e.errors as Message[])?.[0];
                let message = error?.text ?? e.message ?? 'Transpilation failed';

                if (message.includes('Expected ";" but found')) {
                    const codeSnippet = code.split('\n')[(error?.location?.line ?? 1) - 1];
                    if (codeSnippet?.includes('cont ')) {
                        message = "Syntax Error: Did you mean 'const'? (Found 'cont')";
                    }
                }

                this.mainWindow.webContents.send('execution:error', {
                    message,
                    line: error?.location?.line ?? 0,
                    column: error?.location?.column ?? 0
                });
            }
            return;
        }

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('execution:started');
        }

        await fs.promises.writeFile(filePath, instrumentedCode, 'utf-8');

        let runnerPath = path.join(__dirname, '../runners/runner.js');
        if (!fs.existsSync(runnerPath)) {
            runnerPath = path.resolve(process.cwd(), 'electron/runners/runner.js');
        }

        try {
            this.runnerProcess = fork(runnerPath, [], {
                stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
                env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
            });

            this.executionTimeout = setTimeout(() => {
                if (this.runnerProcess && !this.runnerProcess.killed) {
                    this.stopExecution();
                    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                        this.mainWindow.webContents.send('execution:error', {
                            message: 'Execution Timed Out (Possible Infinite Loop)',
                            line: 0
                        });
                    }
                }
            }, 5000);

            this.runnerProcess.on('message', (msg: any) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    if (msg.type === 'execution:log' || msg.type === 'execution:value' || msg.type === 'execution:coverage') {
                        this.mainWindow.webContents.send('execution:log', msg);
                    } else if (msg.type === 'execution:error') {
                        this.mainWindow.webContents.send('execution:error', msg);
                    } else if (msg.type === 'execution:done') {
                        // Main execution finished, clear the timeout!
                        this.stopCleanup();
                    }
                }
            });

            this.runnerProcess.on('exit', () => {
                this.stopCleanup();
            });

            this.runnerProcess.on('error', (err: Error) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('execution:error', err.message);
                }
            });

            this.runnerProcess.send({ type: 'execution:start', filePath });
        } catch (e) {
            if (this.mainWindow) {
                const err = e as Error;
                this.mainWindow.webContents.send('execution:error', `Failed to spawn runner: ${err.message}`);
            }
        }
    }

    private stopCleanup() {
        if (this.executionTimeout) {
            clearTimeout(this.executionTimeout);
            this.executionTimeout = null;
        }
    }

    stopExecution() {
        this.stopCleanup();
        if (this.runnerProcess) {
            try { this.runnerProcess.kill(); } catch { /**/ }
            this.runnerProcess = null;
        }
    }
}
