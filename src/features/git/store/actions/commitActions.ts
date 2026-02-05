import type { AppState } from '../../../../types/store';
import type { GitSlice, CommitTemplate } from '../../types';

const gitHead = 'Head';
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const createCommitActions = (set: (nextState: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void, get: () => AppState): Partial<GitSlice> => ({
    gitCommit: async (message: string, isAmend = false) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        const args = ['commit', '-m', message];
        if (isAmend) {
            args.push('--amend');
        }
        await window.electronAPI.gitCommand(openedFolder, args);
        await refreshGit();
    },

    gitUndoLastCommit: async () => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['reset', '--soft', `${gitHead}~1`]);
            await refreshGit();
            addToast({ type: 'success', message: 'Último commit desfeito (Soft Reset).' });
        } catch {
            addToast({ type: 'error', message: 'Erro ao desfazer commit.' });
        }
    },

    getCommitFiles: async (hash: string) => {
        const { openedFolder } = get();
        if (!openedFolder || !window.electronAPI) return [];

        try {
            const res = await window.electronAPI.gitCommand(openedFolder, ['show', '--name-status', '--pretty=format:', hash]);
            return res.stdout.split('\n')
                .filter((line: string) => line.trim() !== '')
                .map((line: string) => {
                    const parts = line.split(/\t/);
                    const status = parts[0];
                    const path = parts[1] || "";
                    return { status, path };
                });
        } catch (err) {
            console.error('Failed to get commit files:', err);
            return [];
        }
    },

    addCommitTemplate: (template: Omit<CommitTemplate, 'id'>) => {
        const id = generateId();
        const newTemplates = [...get().commitTemplates, { ...template, id }];
        localStorage.setItem('commitTemplates', JSON.stringify(newTemplates));
        set({ commitTemplates: newTemplates });
    },

    removeCommitTemplate: (id: string) => {
        const newTemplates = get().commitTemplates.filter((t: CommitTemplate) => t.id !== id);
        localStorage.setItem('commitTemplates', JSON.stringify(newTemplates));
        set({ commitTemplates: newTemplates });
    },
});
