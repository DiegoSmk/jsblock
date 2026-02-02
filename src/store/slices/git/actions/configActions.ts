import type { GitSlice, GitAuthor, GitProfile } from '../../../../types/store';

export const createConfigActions = (set: Function, get: Function): Partial<GitSlice> => ({
    gitInit: async (author?: GitAuthor, isGlobal = false) => {
        const { openedFolder, refreshGit, setGitConfig } = get();
        if (!openedFolder) return;

        await window.electronAPI.gitCommand(openedFolder, ['init']);

        if (author) {
            await setGitConfig(author, isGlobal);
        }

        await refreshGit();
    },

    setGitConfig: async (author: GitAuthor, isGlobal: boolean) => {
        const { openedFolder, fetchGitConfig, addToast } = get();
        if (!window.electronAPI) return;

        const dir = openedFolder ?? '.';

        if (isGlobal) {
            const argsBase = ['config', '--global'];
            try {
                if (author.name) await window.electronAPI.gitCommand(dir, [...argsBase, 'user.name', author.name]);
                if (author.email) await window.electronAPI.gitCommand(dir, [...argsBase, 'user.email', author.email]);

                addToast({
                    type: 'success',
                    message: 'Autor Global atualizado com sucesso!'
                });
            } catch {
                addToast({
                    type: 'error',
                    message: 'Erro ao atualizar Autor Global.'
                });
            }
        } else {
            try {
                if (author.name) {
                    await window.electronAPI.gitCommand(dir, ['config', '--local', 'user.name', author.name]);
                }
                if (author.email) {
                    await window.electronAPI.gitCommand(dir, ['config', '--local', 'user.email', author.email]);
                }

                addToast({
                    type: 'success',
                    message: `Autor Local definido para: ${author.name}`
                });
            } catch {
                addToast({
                    type: 'error',
                    message: 'Erro ao definir Autor Local.'
                });
            }
        }

        await fetchGitConfig();
    },

    resetToGlobal: async () => {
        const { openedFolder, fetchGitConfig, addToast } = get();
        if (!window.electronAPI || !openedFolder) return;

        try {
            await window.electronAPI.gitCommand(openedFolder, ['config', '--local', '--unset', 'user.name']);
            await window.electronAPI.gitCommand(openedFolder, ['config', '--local', '--unset', 'user.email']);

            addToast({
                type: 'info',
                message: 'Usando configuração Global (Local resetado).'
            });
        } catch {
            addToast({
                type: 'error',
                message: 'Erro ao resetar para configuração Global.'
            });
        }
        await fetchGitConfig();
    },

    fetchGitConfig: async () => {
        const { openedFolder } = get();
        if (!window.electronAPI) return;

        const baseDir = openedFolder ?? '.';

        try {
            const gName = await window.electronAPI.gitCommand(baseDir, ['config', '--global', 'user.name']);
            const gEmail = await window.electronAPI.gitCommand(baseDir, ['config', '--global', 'user.email']);

            const globalAuthor = {
                name: gName.stdout.trim(),
                email: gEmail.stdout.trim()
            };

            let projectAuthor = null;
            if (openedFolder) {
                const lName = await window.electronAPI.gitCommand(openedFolder, ['config', '--local', 'user.name']);
                const lEmail = await window.electronAPI.gitCommand(openedFolder, ['config', '--local', 'user.email']);

                if (lName.stdout.trim() || lEmail.stdout.trim()) {
                    projectAuthor = {
                        name: lName.stdout.trim(),
                        email: lEmail.stdout.trim()
                    };
                }
            }

            set((state: any) => ({
                git: {
                    ...state.git,
                    globalAuthor: globalAuthor.name || globalAuthor.email ? globalAuthor : null,
                    projectAuthor
                }
            }));
        } catch (err) {
            console.error('Fetch git config failed:', err);
        }
    },

    addGitProfile: (profile: Omit<GitProfile, 'id'>) => {
        const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newProfiles = [...get().gitProfiles, { ...profile, id }];
        localStorage.setItem('gitProfiles', JSON.stringify(newProfiles));
        set({ gitProfiles: newProfiles });
    },

    removeGitProfile: (id: string) => {
        const newProfiles = get().gitProfiles.filter((p: GitProfile) => p.id !== id);
        localStorage.setItem('gitProfiles', JSON.stringify(newProfiles));
        set({ gitProfiles: newProfiles });
    },

    updateGitProfile: (id: string, updates: Partial<Omit<GitProfile, 'id'>>) => {
        const newProfiles = get().gitProfiles.map((p: GitProfile) =>
            p.id === id ? { ...p, ...updates } : p
        );
        localStorage.setItem('gitProfiles', JSON.stringify(newProfiles));
        set({ gitProfiles: newProfiles });
    },
});
