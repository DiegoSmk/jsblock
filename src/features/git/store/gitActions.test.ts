// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useStore } from '../../../store/useStore';
import { initialGitState } from './initialState';
import type { ElectronAPI } from '../../../types/electron';

describe('Git Network Actions', () => {
    beforeEach(() => {
        useStore.setState({
            git: { ...initialGitState, isRepo: true, currentBranch: 'main' },
            openedFolder: '/test/repo'
        });

        // Mock window.electron
        window.electron = {
            gitCommand: vi.fn().mockResolvedValue({ stdout: '' }),
            fileSystem: {
                readFile: vi.fn(),
                writeFile: vi.fn(),
            }
        } as unknown as ElectronAPI;
    });

    it('should call git fetch', async () => {
        const { gitFetch } = useStore.getState();
        await gitFetch();
        expect(window.electron.gitCommand).toHaveBeenCalledWith('/test/repo', ['fetch', '--all']);
    });

    it('should call git pull with rebase', async () => {
        const { gitPull } = useStore.getState();
        await gitPull();
        expect(window.electron.gitCommand).toHaveBeenCalledWith('/test/repo', ['pull', '--rebase', 'origin', 'main']);
    });

    it('should call git push', async () => {
        const { gitPush } = useStore.getState();
        await gitPush();
        expect(window.electron.gitCommand).toHaveBeenCalledWith('/test/repo', ['push', 'origin', 'main']);
    });

    it('should call git sync (pull then push)', async () => {
        const { gitSync } = useStore.getState();
        await gitSync();

        const calls = (window.electron.gitCommand as Mock).mock.calls;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        const args = calls.map(c => c[1]);

        // Check for pull
        expect(args).toEqual(expect.arrayContaining([
            ['pull', '--rebase', 'origin', 'main']
        ]));

        // Check for push
        expect(args).toEqual(expect.arrayContaining([
            ['push', 'origin', 'main']
        ]));
    });
});

describe('Git Diff Actions', () => {
    beforeEach(() => {
        useStore.setState({
            git: { ...initialGitState, isRepo: true, currentBranch: 'main' },
            openedFolder: '/test/repo'
        });

        window.electron = {
            gitCommand: vi.fn().mockResolvedValue({ stdout: '' }),
            fileSystem: {
                readFile: vi.fn(),
            }
        } as unknown as ElectronAPI;
    });

    it('should select diff file', () => {
        const { selectGitDiffFile } = useStore.getState();
        selectGitDiffFile('src/test.ts');
        expect(useStore.getState().git.selectedDiffFile).toBe('src/test.ts');
    });

    it('should close diff file', () => {
        const { closeGitDiffFile } = useStore.getState();
        useStore.setState({ git: { ...initialGitState, selectedDiffFile: 'src/test.ts' } });

        closeGitDiffFile();
        expect(useStore.getState().git.selectedDiffFile).toBeNull();
    });

    it('should get file content from ref', async () => {
        const { getGitFileContent } = useStore.getState();
        (window.electron.gitCommand as Mock).mockResolvedValue({ stdout: 'content' });

        // eslint-disable-next-line no-restricted-syntax
        const content = await getGitFileContent('src/test.ts', 'HEAD');
        expect(content).toBe('content');
        expect(window.electron.gitCommand).toHaveBeenCalledWith('/test/repo', ['show', 'HEAD:src/test.ts']);
    });
});
