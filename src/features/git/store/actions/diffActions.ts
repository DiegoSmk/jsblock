import type { AppState } from '../../../../types/store';
import type { GitSlice } from '../types';

export const createDiffActions = (set: (nextState: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void, get: () => AppState): Partial<GitSlice> => ({
    selectGitDiffFile: (path: string) => {
        set((state: AppState) => ({
            git: {
                ...state.git,
                selectedDiffFile: path
            }
        }));
    },

    closeGitDiffFile: () => {
        set((state: AppState) => ({
            git: {
                ...state.git,
                selectedDiffFile: null
            }
        }));
    },

    getGitFileContent: async (path: string, ref: string) => {
        const { openedFolder } = get();
        if (!openedFolder || !window.electron) return '';

        try {
            // Use git show to get content at a specific ref
            const result = await window.electron.gitCommand(openedFolder, ['show', `${ref}:${path}`]);
            return result.stdout;
        } catch (err) {
            console.error(`Failed to get content for ${path} at ${ref}:`, err);
            return '';
        }
    }
});
