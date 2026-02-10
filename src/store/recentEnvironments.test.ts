import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from './useStore';
import type { ElectronAPI } from '../types/electron';

// Mock window.electron
const checkExistsMock = vi.fn();
const checkPathsExistsMock = vi.fn();

const mockElectron = {
    fileSystem: {
        checkExists: vi.fn(),
        checkPathsExists: vi.fn(),
        checkExistsForRecents: checkExistsMock,
        checkPathsExistsForRecents: checkPathsExistsMock,
    },
} as unknown as ElectronAPI;

describe('validateRecents Performance', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        window.electron = mockElectron;
        useStore.setState({
            recentEnvironments: [
                { path: '/path/to/repo1', lastOpened: Date.now() },
                { path: '/path/to/repo2', lastOpened: Date.now() },
                { path: '/path/to/repo3', lastOpened: Date.now() },
            ],
        });
    });

    afterEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (window as any).electron;
    });

    it('should call checkPathsExists ONCE (Bulk check)', async () => {
        // Setup mock to return true for all paths
        checkPathsExistsMock.mockResolvedValue({
            '/path/to/repo1': true,
            '/path/to/repo2': true,
            '/path/to/repo3': true,
        });

        await useStore.getState().validateRecents();

        expect(checkPathsExistsMock).toHaveBeenCalledTimes(1);
        expect(checkExistsMock).not.toHaveBeenCalled();

        // Ensure state is maintained
        const state = useStore.getState();
        expect(state.recentEnvironments).toHaveLength(3);
    });

    it('should filter out non-existent paths', async () => {
        // Setup mock to return false for one path
        checkPathsExistsMock.mockResolvedValue({
            '/path/to/repo1': true,
            '/path/to/repo2': false,
            '/path/to/repo3': true,
        });

        await useStore.getState().validateRecents();

        expect(checkPathsExistsMock).toHaveBeenCalledTimes(1);

        const state = useStore.getState();
        expect(state.recentEnvironments).toHaveLength(2);
        expect(state.recentEnvironments.map(r => r.path)).toEqual(['/path/to/repo1', '/path/to/repo3']);
    });
});
