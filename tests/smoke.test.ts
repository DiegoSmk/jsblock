import { describe, it, expect } from 'vitest';
import { ExecutionFactory } from '../electron/execution/ExecutionFactory';
import { Instrumenter } from '../electron/services/Instrumenter';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Multi-Runtime Basic Validation', () => {
    const runtimes = ['node', 'bun', 'deno'] as const;

    runtimes.forEach(runtime => {
        describe(`Runtime: ${runtime}`, () => {
            it('should be detectable and resolve executable', async () => {
                const adapter = ExecutionFactory.createAdapter(runtime);
                const isAvailable = await adapter.isAvailable();
                expect(typeof isAvailable).toBe('boolean');

                if (isAvailable) {
                    const executable = await adapter.resolveExecutable();
                    expect(executable).toBeDefined();
                    expect(executable.length).toBeGreaterThan(0);
                }
            });

            it('should generate valid instrumented code', () => {
                const code = 'const x = 10 + 5;';
                const instrumented = Instrumenter.instrumentCode(code);

                // Should contain coverage and spy
                expect(instrumented).toContain('__coverage');
                expect(instrumented).toContain('__spy');
                expect(instrumented).toContain('global');
            });
        });
    });

    it('should have the esbuild loader available for Node transpilation', () => {
        const loaderPath = path.resolve(process.cwd(), 'node_modules/esbuild-register/loader.js');
        expect(fs.existsSync(loaderPath)).toBe(true);
    });

    it('should execute real instrumented code in Node', async () => {
        const adapter = ExecutionFactory.createAdapter('node');
        const isAvailable = await adapter.isAvailable();
        if (!isAvailable) return;

        const code = `
            const x = 40 + 2;
            console.log("HELLO_WORLD");
        `;
        const instrumented = Instrumenter.instrumentCode(code);

        // We need a temporary file for the adapter to read
        const tempFile = path.join(os.tmpdir(), `test_exec_${Date.now()}.js`);
        fs.writeFileSync(tempFile, instrumented);

        return new Promise<void>((resolve, reject) => {
            let logReceived = false;
            let valueReceived = false;

            const timeout = setTimeout(() => {
                adapter.stop();
                reject(new Error('Test timed out waiting for MCP messages'));
            }, 10000);

            adapter.onMessage((msg) => {
                if (msg.type === 'execution:log' && msg.args?.includes('HELLO_WORLD')) {
                    logReceived = true;
                }
                if (msg.type === 'execution:value' && msg.value === '42') {
                    valueReceived = true;
                }
            });

            adapter.onError((err) => {
                clearTimeout(timeout);
                adapter.stop();
                reject(new Error(`Execution error: ${err.message}`));
            });

            adapter.onDone(() => {
                void (async () => {
                    // Give a tiny bit of time for any final concurrent messages
                    await new Promise(r => setTimeout(r, 200));

                    clearTimeout(timeout);
                    adapter.stop();
                    try {
                        expect(logReceived).toBe(true);
                        expect(valueReceived).toBe(true);
                        resolve();
                    } catch (e) {
                        reject(e instanceof Error ? e : new Error(String(e)));
                    } finally {
                        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    }
                })();
            });

            adapter.execute(instrumented, tempFile).catch(err => reject(err instanceof Error ? err : new Error(String(err))));
        });
    }, 20000);

    it('should handle execution timeouts correctly', async () => {
        const adapter = ExecutionFactory.createAdapter('node');
        const isAvailable = await adapter.isAvailable();
        if (!isAvailable) return;

        const infiniteLoopCode = 'while(true) {}';
        const tempFile = path.join(os.tmpdir(), `test_timeout_${Date.now()}.js`);
        fs.writeFileSync(tempFile, infiniteLoopCode);

        // This test simulates the logic inside ExecutionManager since the adapter doesn't have its own timeout logic
        // But we want to ensure we can stop it.
        return new Promise<void>((resolve, reject) => {
            adapter.execute(infiniteLoopCode, tempFile).catch(err => reject(err instanceof Error ? err : new Error(String(err))));

            // Force stop after 500ms
            setTimeout(() => {
                try {
                    adapter.stop();
                    // If we made it here without crashing, it's good
                    resolve();
                } catch (e) {
                    reject(e instanceof Error ? e : new Error(String(e)));
                } finally {
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                }
            }, 500);
        });
    });
});
