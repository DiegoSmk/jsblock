import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from './useStore';
import type { ElectronAPI } from '../types/electron';

// Mock window.electron
const originalElectron = window.electron;

describe('validateRecents Performance Benchmark', () => {
    beforeEach(() => {
        // Reset store
        useStore.setState({ recentEnvironments: [] });
    });

    afterEach(() => {
        window.electron = originalElectron;
    });

    it('measures performance of validateRecents', async () => {
        // Setup 50 recent environments (enough to show delay)
        const count = 50;
        const delayPerCall = 10; // 10ms simulated latency
        const paths = Array.from({ length: count }, (_, i) => `/path/to/project-${i}`);

        useStore.setState({
            recentEnvironments: paths.map(p => ({
                path: p,
                lastOpened: Date.now(),
                isFavorite: false
            }))
        });

        // Mock electron
        window.electron = {
            ...window.electron,
            fileSystem: {
                ...window.electron?.fileSystem,
                checkExists: vi.fn(),
                checkPathsExists: vi.fn(),
                // Old method: 10ms per call
                checkExistsForRecents: vi.fn().mockImplementation(async () => {
                    await new Promise(resolve => setTimeout(resolve, delayPerCall));
                    return true;
                }),
                // New method: 10ms per batch (simulated)
                checkPathsExistsForRecents: vi.fn().mockImplementation(async (ps: string[]) => {
                    await new Promise(resolve => setTimeout(resolve, delayPerCall));
                    return ps.reduce((acc, p) => ({ ...acc, [p]: true }), {});
                })
            } as unknown as ElectronAPI['fileSystem']
        } as unknown as ElectronAPI;

        const start = performance.now();

        await useStore.getState().validateRecents();

        const end = performance.now();
        const duration = end - start;

        // eslint-disable-next-line no-console
        console.log(`[Benchmark] validateRecents took ${duration.toFixed(2)}ms for ${count} items.`);

        // This assertion will help us verify if we are running in the slow or fast mode
        // If slow (iterative), it should be approx count * delayPerCall
        // If fast (bulk), it should be approx delayPerCall
    });
});
