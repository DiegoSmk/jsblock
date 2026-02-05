import type { AppState } from '../../../../types/store';
import type { GitSlice, GitStashEntry } from '../../types';

export const createStashActions = (set: (nextState: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void, get: () => AppState): Partial<GitSlice> => ({
    gitStash: async (message?: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            const args = ['stash', 'push', '-u'];
            if (message) {
                args.push('-m', message);
            } else {
                args.push('-m', `Rascunho: ${new Date().toLocaleTimeString()} em ${get().git.currentBranch}`);
            }
            await window.electron.gitCommand(openedFolder, args);
            await refreshGit();
            addToast({ type: 'success', message: 'Alterações salvas na gaveta (Stash).' });
        } catch (e: unknown) {
            console.error('Stash error:', e);
            const error = e as { stderr?: string; message?: string };
            const msg = error.stderr ?? error.message ?? '';
            if (msg.includes('No local changes to save')) {
                addToast({ type: 'info', message: 'Nada para guardar no stash.' });
            } else {
                addToast({ type: 'error', message: 'Erro ao salvar stash.' });
            }
        }
    },

    gitPopStash: async (index = 0) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electron.gitCommand(openedFolder, ['stash', 'pop', `stash@{${index}}`]);
            await refreshGit();
            addToast({ type: 'success', message: 'Gaveta recuperada com sucesso.' });
        } catch {
            addToast({ type: 'error', message: 'Erro ao recuperar stash (pode haver conflitos).' });
        }
    },

    gitApplyStash: async (index: number) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electron.gitCommand(openedFolder, ['stash', 'apply', `stash@{${index}}`]);
            await refreshGit();
            addToast({ type: 'success', message: 'Alterações aplicadas com sucesso.' });
        } catch {
            addToast({ type: 'error', message: 'Erro ao aplicar stash (pode haver conflitos).' });
        }
    },

    gitDropStash: async (index: number) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electron.gitCommand(openedFolder, ['stash', 'drop', `stash@{${index}}`]);
            await refreshGit();
            addToast({ type: 'success', message: 'Gaveta removida.' });
        } catch {
            addToast({ type: 'error', message: 'Erro ao remover stash.' });
        }
    },

    fetchStashes: async () => {
        const { openedFolder } = get();
        if (!openedFolder) return;
        try {
            const res = await window.electron.gitCommand(openedFolder, ['stash', 'list']);
            const output = res.stdout || '';
            const stashes: GitStashEntry[] = output.split('\n')
                .filter((l: string) => l.trim())
                .map((line: string, index: number) => {
                    const match = /stash@{(\d+)}: (On [^:]+): (.*)/.exec(line);
                    if (match) {
                        return {
                            index: parseInt(match[1]),
                            branch: match[2].replace('On ', ''),
                            message: match[3],
                            description: line
                        };
                    }
                    return { index, branch: '?', message: line, description: line };
                });
            set((state: AppState) => ({ git: { ...state.git, stashes } }) as Partial<AppState>);
        } catch (err) {
            console.error('Error fetching stashes', err);
        }
    },
});
