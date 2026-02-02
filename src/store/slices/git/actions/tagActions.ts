import type { GitSlice, AppState, GitTag } from '../../../../types/store';
import { StateCreator } from 'zustand';

export const createTagActions = (set: StateCreator<AppState>['setState'], get: StateCreator<AppState>['getState']): Partial<GitSlice> => ({
    fetchTags: async () => {
        const { openedFolder } = get();
        if (!openedFolder || !window.electronAPI) return;
        try {
            const res = await window.electronAPI.gitCommand(openedFolder, [
                'for-each-ref',
                '--sort=-creatordate',
                '--format=%(refname:short)|||%(objectname)|||%(contents:subject)|||%(creatordate:iso8601)',
                'refs/tags'
            ]);

            const tags: GitTag[] = res.stdout.split('\n')
                .filter((l: string) => l.trim())
                .map((line: string): GitTag | null => {
                    const parts = line.split('|||');
                    if (parts.length >= 2) {
                        return {
                            name: parts[0],
                            hash: parts[1],
                            message: parts[2] || undefined,
                            date: parts[3] || undefined
                        };
                    }
                    return null;
                })
                .filter((tag): tag is GitTag => tag !== null);

            set((state: AppState) => ({ git: { ...state.git, tags } }));
        } catch (err) {
            console.error('Error fetching tags', err);
        }
    },

    gitCreateTag: async (name: string, hash: string, message?: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            const args = ['tag'];
            if (message) {
                args.push('-a', name, '-m', message, hash);
            } else {
                args.push(name, hash);
            }
            await window.electronAPI.gitCommand(openedFolder, args);
            await refreshGit();
            addToast({ type: 'success', message: `Tag ${name} criada com sucesso!` });
        } catch (err) {
            console.error(err);
            addToast({ type: 'error', message: `Erro ao criar tag ${name}` });
        }
    },

    gitDeleteTag: async (name: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['tag', '-d', name]);
            await refreshGit();
            addToast({ type: 'success', message: `Tag ${name} deletada.` });
        } catch {
            addToast({ type: 'error', message: `Erro ao deletar tag ${name}` });
        }
    },
});
