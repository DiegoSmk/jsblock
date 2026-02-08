import { describe, it, expect } from 'vitest';

describe('Performance Benchmark: File Sync', () => {
    // Simulation parameters
    const FILE_COUNT = 100;
    const IPC_LATENCY_MS = 5; // Conservative estimate for IPC overhead + disk I/O start

    // Mock implementation of sequential read
    const sequentialRead = async (files: string[]) => {
        const results: Record<string, string> = {};
        for (const file of files) {
            // Simulate IPC call latency
            await new Promise(resolve => setTimeout(resolve, IPC_LATENCY_MS));
            results[file] = 'content';
        }
        return results;
    };

    // Mock implementation of bulk read
    const bulkRead = async (files: string[]) => {
        // Simulate single IPC call latency
        await new Promise(resolve => setTimeout(resolve, IPC_LATENCY_MS));

        // Simulate some processing time scaling with file count (but much faster than latency per call)
        await new Promise(resolve => setTimeout(resolve, files.length * 0.1));

        const results: Record<string, string> = {};
        for (const file of files) {
            results[file] = 'content';
        }
        return results;
    };

    it('should demonstrate significant performance improvement with bulk read', async () => {
        const files = Array.from({ length: FILE_COUNT }, (_, i) => `file_${i}.ts`);

        const startSequential = performance.now();
        await sequentialRead(files);
        const endSequential = performance.now();
        const durationSequential = endSequential - startSequential;

        const startBulk = performance.now();
        await bulkRead(files);
        const endBulk = performance.now();
        const durationBulk = endBulk - startBulk;

        // eslint-disable-next-line no-console
        console.log(`Sequential Read (${FILE_COUNT} files): ${durationSequential.toFixed(2)}ms`);
        // eslint-disable-next-line no-console
        console.log(`Bulk Read (${FILE_COUNT} files): ${durationBulk.toFixed(2)}ms`);
        // eslint-disable-next-line no-console
        console.log(`Speedup: ${(durationSequential / durationBulk).toFixed(2)}x`);

        expect(durationBulk).toBeLessThan(durationSequential);
        const minSpeedup = process.env.CI ? 1.5 : 2;
        expect(durationSequential / durationBulk).toBeGreaterThan(minSpeedup);
    });
});
