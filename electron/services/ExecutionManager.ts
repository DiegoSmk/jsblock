import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { ExecutionFactory, RuntimeType } from '../execution/ExecutionFactory.js';
import { IExecutionAdapter, RunnerMessage, ExecutionError } from '../execution/types.js';
import { build, Message } from 'esbuild';
import os from 'os';

export class ExecutionManager {
    private activeAdapter: IExecutionAdapter | null = null;
    private mainWindow: BrowserWindow | null = null;
    private executionTimeout: NodeJS.Timeout | null = null;
    private currentRuntime: RuntimeType = 'node';
    private statsInterval: NodeJS.Timeout | null = null;

    constructor() {
        // IPC handles are now handled in main.ts to avoid double registration
    }

    setMainWindow(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

    setRuntime(runtime: RuntimeType) {
        this.currentRuntime = runtime;
    }


    async checkAvailability(): Promise<Record<RuntimeType, boolean>> {
        const runtimes: RuntimeType[] = ['node', 'bun', 'deno'];
        const results = await Promise.all(
            runtimes.map(async (rt) => {
                const adapter = ExecutionFactory.createAdapter(rt);
                return { rt, available: await adapter.isAvailable() };
            })
        );

        return results.reduce(
            (acc, res) => ({ ...acc, [res.rt]: res.available }),
            {} as Record<RuntimeType, boolean>
        );
    }

    private enhanceErrorWithSuggestion(code: string, error: ExecutionError): ExecutionError {
        // Simple heuristic for common errors
        if (error.message.includes('is not defined')) {
            const match = error.message.match(/(.+) is not defined/);
            if (match) {
                const name = match[1];
                // Check if it's a common typo or missing import
                if (name === 'console' || name === 'Math' || name === 'JSON') return error;

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

    private stripBenchmarkCode(code: string): string {
        const lines = code.split('\n');
        const strippedLines: string[] = [];
        let inBenchmark = false;
        let braceCount = 0;

        for (const line of lines) {
            if (line.includes('//@benchmark')) {
                inBenchmark = true;
                braceCount = 0;
                strippedLines.push(''); // Preserve line number
                continue;
            }

            if (inBenchmark) {
                const openBraces = (line.match(/{/g) || []).length;
                const closeBraces = (line.match(/}/g) || []).length;

                if (braceCount === 0 && openBraces > 0) {
                    braceCount += openBraces - closeBraces;
                } else if (braceCount > 0) {
                    braceCount += openBraces - closeBraces;
                } else if (line.trim() !== '') {
                    // One-liner after //@benchmark
                    inBenchmark = false;
                }

                if (braceCount <= 0 && (line.includes('}') || (openBraces === 0 && closeBraces === 0 && braceCount === 0))) {
                    inBenchmark = false;
                }

                strippedLines.push(''); // Preserve line number
                continue;
            }

            strippedLines.push(line);
        }

        return strippedLines.join('\n');
    }

    private startStatsMonitoring() {
        if (this.statsInterval) clearInterval(this.statsInterval);

        let lastCpus = os.cpus();

        this.statsInterval = setInterval(() => {
            if (!this.mainWindow || this.mainWindow.isDestroyed()) {
                this.stopStatsMonitoring();
                return;
            }

            const currentCpus = os.cpus();
            let totalDiff = 0;
            let idleDiff = 0;

            for (let i = 0; i < currentCpus.length; i++) {
                const last = lastCpus[i].times;
                const current = currentCpus[i].times;

                const lastTotal = last.user + last.nice + last.sys + last.idle + last.irq;
                const currentTotal = current.user + current.nice + current.sys + current.idle + current.irq;

                totalDiff += currentTotal - lastTotal;
                idleDiff += current.idle - last.idle;
            }

            const cpuUsage = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;
            this.mainWindow.webContents.send('system:stats', { cpu: Math.round(cpuUsage) });

            lastCpus = currentCpus;
        }, 1000);
    }

    private stopStatsMonitoring() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('system:stats', { cpu: 0 });
        }
    }

    async startExecution(code: string, originalPath?: string) {
        this.stopExecution();

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('execution:clear');
        }

        // Strip benchmark code for normal execution but PRESERVE line numbers
        const cleanCode = this.stripBenchmarkCode(code);

        const userDataPath = app.getPath('userData');
        const tempDir = path.join(userDataPath, 'temp_runs');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const fileName = originalPath ? path.basename(originalPath) : 'scratch.js';
        const filePath = path.join(tempDir, `run_${Date.now()}_${fileName}`);

        // Try to transpile/instrument if needed
        let instrumentedCode = cleanCode;
        try {
            const result = await build({
                stdin: {
                    contents: cleanCode,
                    resolveDir: process.cwd(),
                    loader: 'ts',
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
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    const enhancedError = this.enhanceErrorWithSuggestion(code, errorData);
                    this.mainWindow.webContents.send('execution:error', enhancedError);
                }
            });

            this.activeAdapter.onDone(() => {
                this.stopCleanup();
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('execution:done');
                }
            });

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

    async startBenchmark(code: string, line: number, originalPath?: string) {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
        this.startStatsMonitoring();

        // 1. Get the host code by stripping ALL benchmark blocks
        const lines = code.split('\n');
        const strippedLines: string[] = [];
        let inCurrentBenchmark = false;
        let inOtherBenchmark = false;
        let braceCount = 0;
        let benchmarkBlock = '';

        for (let i = 0; i < lines.length; i++) {
            const currentLine = lines[i];
            const isTargetLine = (i + 1) === line;

            if (currentLine.includes('//@benchmark')) {
                if (isTargetLine) {
                    inCurrentBenchmark = true;
                    inOtherBenchmark = false;
                    braceCount = 0;
                    strippedLines.push(currentLine);
                } else {
                    inCurrentBenchmark = false;
                    inOtherBenchmark = true;
                    braceCount = 0;
                    strippedLines.push(''); // Replace other benchmarks with empty lines
                }
                continue;
            }

            if (inCurrentBenchmark) {
                benchmarkBlock += currentLine + '\n';
                const openBraces = (currentLine.match(/{/g) || []).length;
                const closeBraces = (currentLine.match(/}/g) || []).length;
                braceCount += openBraces - closeBraces;

                if (braceCount === 0 && openBraces > 0) {
                    // First block start
                } else if (braceCount <= 0 && (currentLine.includes('}') || (openBraces === 0 && closeBraces === 0 && braceCount === 0))) {
                    inCurrentBenchmark = false;
                }
                strippedLines.push(currentLine);
                continue;
            }

            if (inOtherBenchmark) {
                const openBraces = (currentLine.match(/{/g) || []).length;
                const closeBraces = (currentLine.match(/}/g) || []).length;
                braceCount += openBraces - closeBraces;

                if (braceCount <= 0 && (currentLine.includes('}') || (openBraces === 0 && closeBraces === 0 && braceCount === 0))) {
                    inOtherBenchmark = false;
                }
                strippedLines.push('');
                continue;
            }

            strippedLines.push(currentLine);
        }

        const fullBenchmarkCode = strippedLines.join('\n');

        const availability = await this.checkAvailability();
        const runtimes = (Object.keys(availability) as RuntimeType[]).filter(rt => availability[rt]);

        const results: any[] = [];
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // Determine where to save based on Option A
        let tempDir: string;
        if (originalPath && fs.existsSync(path.dirname(originalPath))) {
            tempDir = path.dirname(originalPath);
        } else {
            const userDataPath = app.getPath('userData');
            tempDir = path.join(userDataPath, 'temp_benchmarks');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        }

        await Promise.all(runtimes.map(async (rt) => {
            let output = '';
            const fileName = `.bench_${rt}_${Date.now()}.js`;
            const benchPath = path.join(tempDir, fileName);

            try {
                // Run the WHOLE file but with other benchmarks stripped
                await fs.promises.writeFile(benchPath, fullBenchmarkCode, 'utf-8');

                let command = '';
                if (rt === 'node') {
                    // Check if we need loader for Node
                    const isTs = originalPath?.endsWith('.ts') || originalPath?.endsWith('.tsx');
                    if (isTs) {
                        const loaderPath = path.resolve(process.cwd(), 'node_modules/esbuild-register/loader.mjs');
                        if (fs.existsSync(loaderPath)) {
                            command = `node --loader ${loaderPath} ${benchPath}`;
                        } else {
                            command = `node ${benchPath}`;
                        }
                    } else {
                        command = `node ${benchPath}`;
                    }
                }
                else if (rt === 'bun') command = `bun run ${benchPath}`;
                else if (rt === 'deno') command = `deno run -A ${benchPath}`;

                const execStart = process.hrtime.bigint();
                const { stdout, stderr } = await execAsync(command);
                const execEnd = process.hrtime.bigint();

                const durationMs = Number(execEnd - execStart) / 1_000_000;
                output = stdout + stderr;

                results.push({
                    runtime: rt,
                    avgTime: durationMs,
                    minTime: durationMs,
                    maxTime: durationMs,
                    iterations: 1,
                    output: output.trim().substring(0, 200)
                });
            } catch (e: any) {
                results.push({
                    runtime: rt,
                    avgTime: 0,
                    output: `Error: ${e.message || String(e)}`
                });
            } finally {
                // Clean up Option A temp file
                if (fs.existsSync(benchPath)) {
                    await fs.promises.unlink(benchPath).catch(() => { });
                }
            }
        }));

        const validResults = results.filter(r => r.avgTime > 0).sort((a, b) => a.avgTime - b.avgTime);
        if (validResults.length > 0) {
            validResults[0].isWinner = true;
        }

        this.mainWindow.webContents.send('benchmark:result', results);
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
