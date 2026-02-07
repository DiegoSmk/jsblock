import type { AppState } from '../../../../types/store';
import type { GitSlice } from '../types';

export const createNetworkActions = (set: (nextState: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void, get: () => AppState): Partial<GitSlice> => ({
    gitFetch: async () => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder || !window.electron) return;

        try {
            await window.electron.gitCommand(openedFolder, ['fetch', '--all']);
            await refreshGit();
        } catch (err) {
            console.error('Git fetch failed:', err);
            throw err;
        }
    },

    gitPull: async () => {
        const { openedFolder, refreshGit, git } = get();
        if (!openedFolder || !window.electron) return;

        const branch = git.currentBranch || 'HEAD';

        try {
            // Pull with rebase by default to keep history clean, or just pull
            await window.electron.gitCommand(openedFolder, ['pull', '--rebase', 'origin', branch]);
            await refreshGit();
        } catch (err) {
            console.error('Git pull failed:', err);
            throw err;
        }
    },

    gitPush: async () => {
        const { openedFolder, refreshGit, git } = get();
        if (!openedFolder || !window.electron) return;

        const branch = git.currentBranch || 'HEAD';

        try {
            await window.electron.gitCommand(openedFolder, ['push', 'origin', branch]);
            await refreshGit();
        } catch (err) {
            console.error('Git push failed:', err);
            throw err;
        }
    },

    gitSync: async () => {
        const { gitPull, gitPush } = get();
        try {
            await gitPull();
            await gitPush();
        } catch (err) {
            console.error('Git sync failed:', err);
            throw err;
        }
    }
});
