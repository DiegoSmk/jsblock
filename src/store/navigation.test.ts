// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from './useStore';

describe('Navigation & Recent Files', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({
      recentFiles: [],
      selectedFile: null,
      projectFiles: {},
      workspace: {
        rootPath: '/root',
        fileTree: [],
        isWatching: false,
        isLoading: false
      }
    });
    vi.clearAllMocks();
  });

  it('should add recent file', () => {
    const { addRecentFile } = useStore.getState();
    addRecentFile('/path/to/file.ts');
    expect(useStore.getState().recentFiles).toEqual(['/path/to/file.ts']);
  });

  it('should move existing file to top', () => {
    const { addRecentFile } = useStore.getState();
    addRecentFile('/path/to/file1.ts');
    addRecentFile('/path/to/file2.ts');
    addRecentFile('/path/to/file1.ts');

    expect(useStore.getState().recentFiles).toEqual(['/path/to/file1.ts', '/path/to/file2.ts']);
  });

  it('should limit recent files to 20', () => {
    const { addRecentFile } = useStore.getState();
    for (let i = 0; i < 25; i++) {
      addRecentFile(`/path/to/file${i}.ts`);
    }
    const recents = useStore.getState().recentFiles;
    expect(recents.length).toBe(20);
    expect(recents[0]).toBe('/path/to/file24.ts');
    expect(recents[19]).toBe('/path/to/file5.ts');
  });

  it('should add recent file when selecting a file', async () => {
    const { setSelectedFile } = useStore.getState();

    // Mock window.electron.fileSystem.readFile
    window.electron = {
        ...window.electron,
        fileSystem: {
            ...window.electron?.fileSystem,
            readFile: vi.fn().mockResolvedValue('content'),
            checkExists: vi.fn().mockResolvedValue(true)
        }
    } as any;

    await setSelectedFile('/path/to/selected.ts');
    expect(useStore.getState().recentFiles).toContain('/path/to/selected.ts');
    expect(useStore.getState().recentFiles[0]).toBe('/path/to/selected.ts');
  });
});
