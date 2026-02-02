import type { GitSlice, AppState } from '../../../../types/store';
import { StateCreator } from 'zustand';

export const createBranchActions = (set: StateCreator<AppState>['setState'], get: StateCreator<AppState>['getState']): Partial<GitSlice> => ({
    changeBranch: async (branch: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['checkout', branch]);
            await refreshGit();
            addToast({ type: 'success', message: `Mudou para o branch ${branch}` });
        } catch {
            addToast({ type: 'error', message: `Erro ao mudar para o branch ${branch}` });
        }
    },

    createBranch: async (branch: string, startPoint?: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            const args = ['checkout', '-b', branch];
            if (startPoint) args.push(startPoint);
            await window.electronAPI.gitCommand(openedFolder, args);
            await refreshGit();
            addToast({ type: 'success', message: `Branch ${branch} criado com sucesso!` });
        } catch {
            addToast({ type: 'error', message: `Erro ao criar branch ${branch}` });
        }
    },

    deleteBranch: async (branch: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['branch', '-D', branch]);
            await refreshGit();
            addToast({ type: 'success', message: `Branch ${branch} deletado.` });
        } catch {
            addToast({ type: 'error', message: `Erro ao deletar branch ${branch}` });
        }
    },

    checkoutCommit: async (hash: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['checkout', hash]);
            await refreshGit();
        } catch {
            addToast({ type: 'error', message: `Erro ao mudar para a versão ${hash}` });
        }
    },
});
