// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../useStore';

describe('Git Slice', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock Electron API
    (window as any).electronAPI = {
      gitCommand: vi.fn(),
      checkPathExists: vi.fn(),
    };
    useStore.setState({
      git: {
        isRepo: false,
        currentBranch: '',
        changes: [],
        log: [],
        rawLog: '',
        globalAuthor: null,
        projectAuthor: null,
        activeView: 'status',
        sidebarView: 'info',
        branches: [],
        stashes: [],
        stats: { fileCount: 0, repoSize: '', projectSize: '' },
        tags: [],
        isInitialized: false
      },
      openedFolder: '/test/repo'
    });
  });

  it('should set git view', () => {
    const { setGitView } = useStore.getState();
    setGitView('graph');
    expect(useStore.getState().git.activeView).toBe('graph');
  });

  it('should initialize git if repo', async () => {
    const { refreshGit } = useStore.getState();
    const mockGit = (window as any).electronAPI.gitCommand;

    mockGit.mockImplementation((path: string, args: string[]) => {
      if (args[0] === 'rev-parse' && args[1] === '--is-inside-work-tree') return Promise.resolve({ stdout: 'true' });
      if (args[0] === 'rev-parse' && args[1] === '--abbrev-ref') return Promise.resolve({ stdout: 'main' });
      if (args[0] === 'branch') return Promise.resolve({ stdout: 'main\n' });
      if (args[0] === 'status') return Promise.resolve({ stdout: '' });
      if (args[0] === 'log') return Promise.resolve({ stdout: '' });
      if (args[0] === 'stash') return Promise.resolve({ stdout: '' });
      if (args[0] === 'for-each-ref') return Promise.resolve({ stdout: '' });
      if (args[0] === 'ls-files') return Promise.resolve({ stdout: '' });
      if (args[0] === 'count-objects') return Promise.resolve({ stdout: '' });
      if (args[0] === 'ls-tree') return Promise.resolve({ stdout: '' });
      return Promise.resolve({ stdout: '' });
    });

    await refreshGit();

    expect(useStore.getState().git.isRepo).toBe(true);
    expect(useStore.getState().git.currentBranch).toBe('main');
  });
});
