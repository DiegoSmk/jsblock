import { describe, it, expect } from 'vitest';
import { ExecutionFactory } from '../electron/execution/ExecutionFactory';
import { Instrumenter } from '../electron/services/Instrumenter';

describe('Multi-Runtime Basic Validation', () => {
    const runtimes = ['node', 'bun', 'deno'] as const;

    runtimes.forEach(runtime => {
        describe(`Runtime: ${runtime}`, () => {
            it('should be detectable if installed', async () => {
                const adapter = ExecutionFactory.createAdapter(runtime);
                const isAvailable = await adapter.isAvailable();
                expect(typeof isAvailable).toBe('boolean');
            });

            it('should generate valid instrumented code', () => {
                const code = 'const x = 10 + 5;'; // Complex expression to ensure spy
                const instrumented = Instrumenter.instrumentCode(code);

                // Should contain coverage and spy
                expect(instrumented).toContain('__coverage');
                expect(instrumented).toContain('__spy');
                expect(instrumented).toContain('global');
            });
        });
    });
});
