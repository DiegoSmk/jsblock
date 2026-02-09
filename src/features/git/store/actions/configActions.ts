import type { AppState } from '../../../../types/store';
import type { GitSlice, GitAuthor, GitProfile } from '../../types';

export const createConfigActions = (set: (nextState: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void, get: () => AppState): Partial<GitSlice> => ({
    gitInit: async (author?: GitAuthor, isGlobal = false) => {
        const { openedFolder, refreshGit, setGitConfig } = get();
        if (!openedFolder) return;

        await window.electron.gitCommand(openedFolder, ['init']);

        if (author) {
            await setGitConfig(author, isGlobal);
        }

        await refreshGit();
    },

    setGitConfig: async (author: GitAuthor, isGlobal: boolean) => {
        const { openedFolder, fetchGitConfig, addToast } = get();
        if (!window.electron) return;

        const dir = openedFolder ?? '.';

        if (isGlobal) {
            const argsBase = ['config', '--global'];
            try {
                if (author.name) await window.electron.gitCommand(dir, [...argsBase, 'user.name', author.name]);
                if (author.email) await window.electron.gitCommand(dir, [...argsBase, 'user.email', author.email]);

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
                    await window.electron.gitCommand(dir, ['config', '--local', 'user.name', author.name]);
                }
                if (author.email) {
                    await window.electron.gitCommand(dir, ['config', '--local', 'user.email', author.email]);
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
        if (!window.electron || !openedFolder) return;

        try {
            await window.electron.gitCommand(openedFolder, ['config', '--local', '--unset', 'user.name']);
            await window.electron.gitCommand(openedFolder, ['config', '--local', '--unset', 'user.email']);

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
        if (!window.electron) return;

        const baseDir = openedFolder ?? '.';

        try {
            const gName = await window.electron.gitCommand(baseDir, ['config', '--global', 'user.name']);
            const gEmail = await window.electron.gitCommand(baseDir, ['config', '--global', 'user.email']);

            const globalAuthor = {
                name: gName.stdout.trim(),
                email: gEmail.stdout.trim()
            };

            let projectAuthor = null;
            if (openedFolder) {
                const lName = await window.electron.gitCommand(openedFolder, ['config', '--local', 'user.name']);
                const lEmail = await window.electron.gitCommand(openedFolder, ['config', '--local', 'user.email']);

                if (lName.stdout.trim() || lEmail.stdout.trim()) {
                    projectAuthor = {
                        name: lName.stdout.trim(),
                        email: lEmail.stdout.trim()
                    };
                }
            }

            set((state: AppState) => ({
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

    // Initialization State Setters
    setConfigLevel: (level: 'global' | 'local') => {
        set((state: AppState) => ({
            git: { ...state.git, configLevel: level }
        }));
    },

    setAuthorBuffer: (buffer: GitAuthor) => {
        set((state: AppState) => ({
            git: { ...state.git, authorBuffer: buffer }
        }));
    },

    setIsEditingAuthor: (editing: boolean) => {
        set((state: AppState) => ({
            git: { ...state.git, isEditingAuthor: editing }
        }));
    },

    setShowProfileManager: (show: boolean) => {
        set((state: AppState) => ({
            git: { ...state.git, showProfileManager: show }
        }));
    },

    setNewProfile: (profile: Omit<GitProfile, 'id'> | GitProfile) => {
        // cast to any to avoid complex Omit/interface mismatch in the setter itself
        set((state: AppState) => ({
            git: { ...state.git, newProfile: profile as any }
        }));
    },

    startInit: async () => {
        const { git, gitInit, setAuthorBuffer, setConfigLevel } = get();
        const { configLevel, authorBuffer, globalAuthor } = git;

        set((state: AppState) => ({ git: { ...state.git, isLoading: true } }));

        try {
            if (configLevel === 'local' && authorBuffer.name && authorBuffer.email) {
                await gitInit(authorBuffer, false);
            } else if (configLevel === 'global' && globalAuthor) {
                await gitInit();
            }
        } finally {
            set((state: AppState) => ({ git: { ...state.git, isLoading: false } }));
        }
    },

    handleSaveGlobalConfig: async () => {
        const { git, setGitConfig, setIsEditingAuthor } = get();
        const { authorBuffer } = git;

        await setGitConfig(authorBuffer, true);
        setIsEditingAuthor(false);
    },

    handleAddProfile: () => {
        const { git, addGitProfile, setNewProfile } = get();
        const { newProfile } = git;

        if (!newProfile.name || !newProfile.email) return;
        addGitProfile(newProfile);
        setNewProfile({ name: '', email: '', tag: 'personal', customTagName: '' });
    },
});
