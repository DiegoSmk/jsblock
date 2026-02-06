import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { Instrumenter } from './Instrumenter.js';
import { transform, Message } from 'esbuild';
import { ExecutionFactory, RuntimeType } from '../execution/ExecutionFactory.js';
import { IExecutionAdapter, RunnerMessage, ExecutionError } from '../execution/types.js';

export class ExecutionManager {
    private activeAdapter: IExecutionAdapter | null = null;
    private mainWindow: BrowserWindow | null = null;
    private executionTimeout: NodeJS.Timeout | null = null;
    private currentRuntime: RuntimeType = 'node';
    private availabilityCache: { data: Record<RuntimeType, boolean>; timestamp: number } | null = null;
    private readonly CACHE_TTL = 10000; // 10 seconds

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
    }

    setRuntime(type: RuntimeType) {
        this.currentRuntime = type;
    }

    async checkAvailability(): Promise<Record<RuntimeType, boolean>> {
        const now = Date.now();
        if (this.availabilityCache && (now - this.availabilityCache.timestamp < this.CACHE_TTL)) {
            return this.availabilityCache.data;
        }

        const runtimes: RuntimeType[] = ['node', 'bun', 'deno'];
        const availability: Record<string, boolean> = {};

        // Run checks in parallel
        await Promise.all(runtimes.map(async (rt) => {
            try {
                const adapter = ExecutionFactory.createAdapter(rt);
                availability[rt] = await adapter.isAvailable();
            } catch {
                availability[rt] = false;
            }
        }));

        this.availabilityCache = { data: availability as Record<RuntimeType, boolean>, timestamp: now };
        return availability as Record<RuntimeType, boolean>;
    }

    private enhanceErrorWithSuggestion(code: string, errorData: ExecutionError): ExecutionError {
        const lines = code.split('\n');
        const lineIdx = (errorData.line || 1) - 1;
        const codeLine = lines[lineIdx] ?? '';

        const keywords = [
            { typo: /\bcont\b/, correct: 'const' },
            { typo: /\bfunctio\b|\bfuntion\b|\bfunc\b/, correct: 'function' },
            { typo: /\bretun\b|\bretunr\b/, correct: 'return' },
            { typo: /\bswich\b|\bswtch\b/, correct: 'switch' },
            { typo: /\bcsoe\b|\bcaes\b/, correct: 'case' },
            { typo: /\bbraek\b|\bbreek\b/, correct: 'break' },
            { typo: /\bwihle\b|\bwhie\b/, correct: 'while' },
            { typo: /\bdefualt\b/, correct: 'default' },
            { typo: /\bcacth\b/, correct: 'catch' },
            { typo: /\bfinalyl\b|\bfinaly\b/, correct: 'finally' },
            { typo: /\bthow\b|\btrhow\b/, correct: 'throw' },
            { typo: /\basyn\b|\basny\b/, correct: 'async' },
            { typo: /\bawiat\b|\bauait\b/, correct: 'await' },
            { typo: /\bimpor\b|\bimportt\b/, correct: 'import' },
            { typo: /\bexpor\b/, correct: 'export' },
            { typo: /\bclas\b|\bcalss\b|\bclss\b/, correct: 'class' },
            { typo: /\biterface\b|\binterfce\b|\binteface\b/, correct: 'interface' },
            { typo: /\btypeoff\b|\btypeo\b|\btypof\b/, correct: 'typeof' },
            { typo: /\bintanceof\b|\binstancof\b/, correct: 'instanceof' },
            { typo: /\bconsoel\b|\bconsol\b|\bcnsole\b/, correct: 'console' },
            { typo: /\blenght\b|\blengh\b/, correct: 'length' },
            { typo: /\bundefind\b|\bundifined\b/, correct: 'undefined' },
            { typo: /\bdebuger\b/, correct: 'debugger' }
        ];

        for (const item of keywords) {
            if (item.typo.test(codeLine)) {
                errorData.message = `Syntax Error: Did you mean '${item.correct}'?`;
                errorData.suggestion = {
                    text: `Change to ${item.correct}`,
                    replace: codeLine.replace(item.typo, item.correct)
                };
                break;
            }
        }
        return errorData;
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
        } catch (e: unknown) {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                const err = e as { errors?: Message[]; message?: string };
                const error = err.errors?.[0];
                const originalMessage = error?.text ?? err.message ?? 'Transpilation failed';
                const errorData: ExecutionError = {
                    message: originalMessage,
                    line: error?.location?.line ?? 0,
                    column: error?.location?.column ?? 0
                };
                const enhancedError = this.enhanceErrorWithSuggestion(code, errorData);
                this.mainWindow.webContents.send('execution:error', enhancedError);
            }
            return;
        }

        // Check availability before execution
        const availability = await this.checkAvailability();
        if (!availability[this.currentRuntime]) {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('execution:error', {
                    message: `Runtime '${this.currentRuntime}' not found. Please install it to use this engine.`,
                    line: 1,
                    column: 1
                });
            }
            return;
        }

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('execution:started');
        }

        await fs.promises.writeFile(filePath, instrumentedCode, 'utf-8');

        try {
            this.activeAdapter = ExecutionFactory.createAdapter(this.currentRuntime);

            this.activeAdapter.onMessage((msg: RunnerMessage) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('execution:log', msg);
                }
            });

            this.activeAdapter.onError((errorData: ExecutionError) => {
                this.stopCleanup(); // Stop timeout immediately on error
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    const enhancedError = this.enhanceErrorWithSuggestion(code, errorData);
                    this.mainWindow.webContents.send('execution:error', enhancedError);
                }
            });

            this.activeAdapter.onDone(() => {
                this.stopCleanup(); // Script finished successfully
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('execution:done');
                }
            });

            // Default timeout 5s, but support // @timeout 10000 override
            const timeoutMatch = code.match(/\/\/\s*@timeout\s+(\d+)/);
            const customTimeout = timeoutMatch ? parseInt(timeoutMatch[1], 10) : 5000;

            this.executionTimeout = setTimeout(() => {
                if (this.activeAdapter) {
                    this.stopExecution();
                    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                        const nextTimeout = customTimeout * 2;
                        const hasTimeoutComment = code.match(/\/\/\s*@timeout\s+\d+/);

                        this.mainWindow.webContents.send('execution:error', {
                            message: `Execution Timed Out (${customTimeout}ms). Tip: Click or CTRL+ENTER to increase limit`,
                            line: 1,
                            column: 1,
                            errorCode: 'EXEC_TIMEOUT',
                            suggestion: {
                                text: `Increase timeout to ${nextTimeout}ms`,
                                replace: hasTimeoutComment
                                    ? code.split('\n')[0].replace(/\/\/\s*@timeout\s+\d+/, `// @timeout ${nextTimeout}`)
                                    : `// @timeout ${nextTimeout}\n${code.split('\n')[0]}`
                            }
                        });
                    }
                }
            }, customTimeout);

            await this.activeAdapter.execute(instrumentedCode, filePath);

        } catch (e) {
            this.stopCleanup();
            if (this.mainWindow) {
                const err = e as Error;
                this.mainWindow.webContents.send('execution:error', { message: `Execution failed: ${err.message}`, line: 1, column: 1 });
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
        if (this.activeAdapter) {
            this.activeAdapter.stop();
            this.activeAdapter = null;
        }
    }
}
