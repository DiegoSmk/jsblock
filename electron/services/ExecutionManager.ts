import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { ExecutionFactory, RuntimeType } from '../execution/ExecutionFactory.js';
import { IExecutionAdapter, RunnerMessage, ExecutionError, BenchmarkResult } from '../execution/types.js';
import { build, Message, Loader } from 'esbuild';
import { Instrumenter } from './Instrumenter.js';
import { TelemetryService } from './TelemetryService.js';
import { CodeUtils } from '../utils/CodeUtils.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class ExecutionManager {
    private activeAdapter: IExecutionAdapter | null = null;
    private mainWindow: BrowserWindow | null = null;
    private executionTimeout: NodeJS.Timeout | null = null;
    private currentRuntime: RuntimeType = 'node';
    private telemetry = new TelemetryService();
    private availabilityCache: Record<RuntimeType, boolean> | null = null;
    private cacheTimestamp = 0;
    private readonly CACHE_TTL = 30000; // 30 seconds

    constructor() {
        // IPC handles are now handled in main.ts to avoid double registration
    }

    setMainWindow(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

    setRuntime(runtime: RuntimeType) {
        this.currentRuntime = runtime;
    }


    async checkAvailability(force = false): Promise<Record<RuntimeType, boolean>> {
        const now = Date.now();
        if (!force && this.availabilityCache && (now - this.cacheTimestamp < this.CACHE_TTL)) {
            return this.availabilityCache;
        }

        const runtimes: RuntimeType[] = ['node', 'bun', 'deno'];
        const results = await Promise.all(
            runtimes.map(async (rt) => {
                const adapter = ExecutionFactory.createAdapter(rt);
                return { rt, available: await adapter.isAvailable() };
            })
        );

        this.availabilityCache = results.reduce(
            (acc, res) => ({ ...acc, [res.rt]: res.available }),
            {} as Record<RuntimeType, boolean>
        );
        this.cacheTimestamp = now;
        return this.availabilityCache;
    }

    private enhanceErrorWithSuggestion(code: string, error: ExecutionError): ExecutionError {
        // Simple heuristic for common errors
        if (error.message.includes('is not defined')) {
            const match = /(.+) is not defined/.exec(error.message);
            if (match) {
                const name = match[1];
                // Check if it's a common typo or missing import
                const technicalTerms = ['console', 'Math', 'Json'.toUpperCase()];
                if (technicalTerms.includes(name)) return error;

                return {
                    ...error,
                    suggestion: {
                        text: `Define '${name}' before using it`,
                        replace: `const ${name} = ...;\n${code.split('\n')[error.line - 1]}`
                    }
                };
            }
        }
        return error;
    }

    private startStatsMonitoring() {
        if (this.mainWindow) {
            this.telemetry.start(this.mainWindow);
        }
    }

    private stopStatsMonitoring() {
        if (this.mainWindow) {
            this.telemetry.stop(this.mainWindow);
        }
    }

    async startExecution(code: string, originalPath?: string) {
        this.stopExecution();

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('execution:clear');
        }

        // Strip benchmark code for normal execution but PRESERVE line numbers
        const cleanCode = CodeUtils.stripBenchmarkCode(code);

        const userDataPath = app.getPath('userData');
        const tempDir = path.join(userDataPath, 'temp_runs');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const originalExtension = originalPath ? path.extname(originalPath) : '.ts';
        const fileName = originalPath ? path.basename(originalPath, originalExtension) : 'scratch';
        // Always use .js for the final run file to avoid resolution issues in node/bun
        const filePath = path.join(tempDir, `run_${Date.now()}_${fileName}.js`);

        // Try to transpile/instrument if needed
        let instrumentedCode = cleanCode;
        try {
            // 1. Instrument code for Live Preview/Coverage
            instrumentedCode = Instrumenter.instrumentCode(cleanCode);

            // 2. Transpile TS/TSX to JS
            const isTsx = originalExtension === '.tsx' || originalExtension === '.jsx' || /import\s+.*from\s+['"]react['"]|React\.createElement|<[a-zA-Z]/.test(cleanCode);
            const loader: Loader = isTsx ? 'tsx' : 'ts';

            const result = await build({
                stdin: {
                    contents: instrumentedCode,
                    resolveDir: process.cwd(),
                    loader: loader,
                },
                bundle: false,
                write: false,
                format: 'cjs',
                target: 'node18'
            });
            instrumentedCode = result.outputFiles[0].text;
        } catch (e: unknown) {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                const err = e as { errors?: Message[]; message?: string };
                const error = err.errors?.[0];
                const originalMessage = error?.text ?? err.message ?? 'Transpilation failed';
                const errorData: ExecutionError = {
                    message: originalMessage,
                    line: error?.location?.line ?? 1,
                    column: error?.location?.column ?? 1
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
            this.startStatsMonitoring();
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
                this.stopCleanup();
                if (fs.existsSync(filePath)) {
                    void fs.promises.unlink(filePath).catch((_err: unknown) => { /* ignore */ });
                }
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    const enhancedError = this.enhanceErrorWithSuggestion(code, errorData);
                    this.mainWindow.webContents.send('execution:error', enhancedError);
                }
            });

            this.activeAdapter.onDone(() => {
                this.stopCleanup();
                if (fs.existsSync(filePath)) {
                    void fs.promises.unlink(filePath).catch((_err: unknown) => { /* ignore */ });
                }
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('execution:done');
                }
            });

            const timeoutMatch = /\/\/\s*@timeout\s+(\d+)/.exec(code);
            const customTimeout = timeoutMatch ? parseInt(timeoutMatch[1], 10) : 5000;

            this.executionTimeout = setTimeout(() => {
                if (this.activeAdapter) {
                    this.stopExecution();
                    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                        const nextTimeout = customTimeout * 2;
                        const hasTimeoutComment = /\/\/\s*@timeout\s+\d+/.exec(code);

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
            // Cleanup on catch too
            if (fs.existsSync(filePath)) {
                void fs.promises.unlink(filePath).catch((_err: unknown) => { /* ignore */ });
            }
        }
    }

    async startBenchmark(code: string, line: number, originalPath?: string) {
        this.stopExecution(); // Ensure no normal execution is running
        if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
        this.startStatsMonitoring();

        const fullBenchmarkCode = CodeUtils.extractBenchmark(code, line);

        const availability = await this.checkAvailability();
        const runtimes = (Object.keys(availability) as RuntimeType[]).filter(rt => availability[rt]);

        const results: BenchmarkResult[] = [];

        // Determine where to save benchmarks
        let tempDir: string;
        if (originalPath && fs.existsSync(path.dirname(originalPath))) {
            tempDir = path.dirname(originalPath);
        } else {
            const userDataPath = app.getPath('userData');
            tempDir = path.join(userDataPath, 'temp_benchmarks');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        }

        // Run benchmarks SEQUENTIALLY to avoid CPU/memory spikes and ensure accurate measurement
        for (const rt of runtimes) {
            const benchPath = path.join(tempDir, `bench_${rt}_${Date.now()}.js`);
            try {
                const adapter = ExecutionFactory.createAdapter(rt);
                const executable = await adapter.resolveExecutable();

                // Run the WHOLE file but with other benchmarks stripped
                await fs.promises.writeFile(benchPath, fullBenchmarkCode, 'utf-8');

                let args: string[] = [];

                if (rt === 'node') {
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    const isTs = originalPath?.endsWith('.ts') || originalPath?.endsWith('.tsx') || originalPath?.endsWith('.jsx');
                    const hasReact = /import\s+.*from\s+['"]react['"]|React\.createElement|<[a-zA-Z]/.test(fullBenchmarkCode);

                    if (isTs || hasReact) {
                        const loaderPath = path.resolve(process.cwd(), 'node_modules/esbuild-register/loader.js');
                        if (fs.existsSync(loaderPath)) {
                            args = ['--loader', loaderPath, benchPath];
                        } else {
                            args = [benchPath];
                        }
                    } else {
                        args = [benchPath];
                    }
                } else if (rt === 'bun') {
                    args = ['run', benchPath];
                } else if (rt === 'deno') {
                    args = ['run', '-A', benchPath];
                }

                const execStart = process.hrtime.bigint();
                const { stdout, stderr } = await execFileAsync(executable, args);
                const execEnd = process.hrtime.bigint();

                const durationMs = Number(execEnd - execStart) / 1_000_000;
                const output = stdout + stderr;

                results.push({
                    runtime: rt,
                    avgTime: durationMs,
                    minTime: durationMs,
                    maxTime: durationMs,
                    iterations: 1,
                    output: output.trim().substring(0, 200)
                });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                results.push({
                    runtime: rt,
                    avgTime: 0,
                    minTime: 0,
                    maxTime: 0,
                    iterations: 0,
                    output: `Error: ${message}`
                });
            } finally {
                if (fs.existsSync(benchPath)) {
                    void fs.promises.unlink(benchPath).catch((_err: unknown) => { /* ignore */ });
                }
            }
        }

        const validResults = results.filter(r => r.avgTime > 0).sort((a, b) => a.avgTime - b.avgTime);
        if (validResults.length > 0) {
            validResults[0].isWinner = true;
        }

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('benchmark:result', results);
        }
        this.stopStatsMonitoring();
    }
    private stopCleanup() {
        this.stopStatsMonitoring();
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
