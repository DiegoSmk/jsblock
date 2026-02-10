
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { createWorkspaceSlice } from './workspaceSlice';
import type { AppState } from '../../../types/store';
import type { FileNode } from '../types';

// Mock Electron API
const mockOpenFromPath = vi.fn();
const mockEnsureProjectConfig = vi.fn();

// Mock store pieces
const mockAddRecent = vi.fn();
const mockSyncProjectFiles = vi.fn();
const mockRefreshGit = vi.fn();
const mockRemoveRecent = vi.fn();
const mockAddToast = vi.fn();

// Setup minimal store
const createMockStore = () => createStore<AppState>((set, get, api) => ({
    ...createWorkspaceSlice(set, get, api),
    refreshGit: mockRefreshGit,
    addRecent: mockAddRecent,
    removeRecent: mockRemoveRecent,
    syncProjectFiles: mockSyncProjectFiles,
    addToast: mockAddToast,
    // Add other required slices mock implementations if needed by types, 
    // but for workspaceSlice isolation these should be enough if casted
} as unknown as AppState));

describe('workspaceSlice', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock window.electron
        window.electron = {
            workspace: {
                openFromPath: mockOpenFromPath,
                openFolder: vi.fn(),
                getTree: vi.fn(),
                onUpdated: vi.fn(),
                search: vi.fn(),
                replace: vi.fn()
            },
            fileSystem: {
                ensureProjectConfig: mockEnsureProjectConfig
            }
        } as any;
    });

    it('should open a project successfully from a path', async () => {
        const store = createMockStore();
        const testPath = '/path/to/project';
        const testTree: FileNode[] = [{ name: 'file.txt', isDirectory: false, path: '/path/to/project/file.txt' }];

        mockOpenFromPath.mockResolvedValue({ path: testPath, tree: testTree });

        await store.getState().openProject(testPath);

        expect(store.getState().workspace.isLoading).toBe(false);
        expect(store.getState().workspace.rootPath).toBe(testPath);
        expect(store.getState().workspace.fileTree).toEqual(testTree);
        expect(store.getState().openedFolder).toBe(testPath);

        expect(mockOpenFromPath).toHaveBeenCalledWith(testPath);
        expect(mockEnsureProjectConfig).toHaveBeenCalledWith(testPath);
        expect(mockAddRecent).toHaveBeenCalledWith(testPath);
        expect(mockSyncProjectFiles).toHaveBeenCalled();
        expect(mockRefreshGit).toHaveBeenCalled();
    });

    it('should handle failure when opening a project', async () => {
        const store = createMockStore();
        const testPath = '/path/to/nonexistent';

        mockOpenFromPath.mockResolvedValue(null);

        await store.getState().openProject(testPath);

        expect(store.getState().workspace.isLoading).toBe(false);
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
        expect(mockRemoveRecent).toHaveBeenCalledWith(testPath);

        // Should not update workspace state
        expect(store.getState().workspace.rootPath).toBeNull();
    });

    it('should handle errors during open process', async () => {
        const store = createMockStore();
        const testPath = '/path/to/error';

        mockOpenFromPath.mockRejectedValue(new Error('Access denied'));

        await store.getState().openProject(testPath);

        expect(store.getState().workspace.isLoading).toBe(false);
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
        // Should NOT remove recent on generic error (might be temporary)
        expect(mockRemoveRecent).not.toHaveBeenCalled();
    });
});
