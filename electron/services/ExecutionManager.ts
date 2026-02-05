import { fork, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow } from 'electron';
import { Instrumenter } from './Instrumenter';
import { transform, Message } from 'esbuild';

export interface ExecutionError {
    message: string;
    line: number;
    column: number;
    suggestion?: {
        text: string;
        replace: string;
    };
}

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
                const originalMessage = error?.text ?? e.message ?? 'Transpilation failed';
                let message = originalMessage;
                const errorData: ExecutionError = {
                    message,
                    line: error?.location?.line ?? 0,
                    column: error?.location?.column ?? 0
                };

                const lines = code.split('\n');
                const lineIdx = (error?.location?.line ?? 1) - 1;
                const codeLine = lines[lineIdx] ?? '';

                // --- UNIVERSAL TYPO DETECTOR ---
                const keywords = [
                    { typo: /\bcont\b/, correct: 'const' },
                    { typo: /\bfunctio\b|\bfuntion\b|\bfunc\b/, correct: 'function' },
                    { typo: /\bretun\b|\bretunr\b/, correct: 'return' },
                    { typo: /\bimpor\b|\bimportt\b/, correct: 'import' },
                    { typo: /\bexpor\b/, correct: 'export' },
                    { typo: /\basyn\b|\basny\b/, correct: 'async' }
                ];

                for (const item of keywords) {
                    if (item.typo.test(codeLine)) {
                        errorData.message = `Syntax Error: Did you mean '${item.correct}'?`;
                        errorData.suggestion = {
                            text: `Change to ${item.correct}`,
                            replace: codeLine.replace(item.typo, item.correct)
                        };
                        break; // Capture only the first match per line
                    }
                }

                this.mainWindow.webContents.send('execution:error', errorData);
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
                            line: 1,
                            column: 1
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
                        this.stopCleanup();
                    }
                }
            });

            this.runnerProcess.on('exit', () => {
                this.stopCleanup();
            });

            this.runnerProcess.on('error', (err: Error) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('execution:error', { message: err.message, line: 1, column: 1 });
                }
            });

            this.runnerProcess.send({ type: 'execution:start', filePath });
        } catch (e) {
            if (this.mainWindow) {
                const err = e as Error;
                this.mainWindow.webContents.send('execution:error', { message: `Failed to spawn runner: ${err.message}`, line: 1, column: 1 });
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
