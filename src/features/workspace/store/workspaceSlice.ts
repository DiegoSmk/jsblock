import type { StateCreator } from 'zustand';
import type { AppState } from '../../../types/store';
import type { WorkspaceSlice, FileNode } from '../types';

export const createWorkspaceSlice: StateCreator<
    AppState,
    [],
    [],
    WorkspaceSlice
> = (set, get) => ({
    workspace: {
        rootPath: null,
        fileTree: [],
        isWatching: false,
        isLoading: false,
    },

    openWorkspace: async () => {
        if (!window.electron) return;

        set((state) => ({
            workspace: { ...state.workspace, isLoading: true }
        }));

        try {
            const result = await window.electron.workspace.openFolder();
            if (result) {
                set((state) => ({
                    workspace: {
                        ...state.workspace,
                        rootPath: result.path,
                        fileTree: result.tree,
                        isWatching: true,
                        isLoading: false
                    },
                    openedFolder: result.path // For backward compatibility
                }));

                // Auto-refresh Git if it's a repo
                if (get().refreshGit) {
                    await get().refreshGit();
                }

                // Ensure side effects for opening a workspace are triggered
                void window.electron.fileSystem.ensureProjectConfig(result.path);
                void get().addRecent(result.path);
                void get().syncProjectFiles();
            } else {
                set((state) => ({
                    workspace: { ...state.workspace, isLoading: false }
                }));
            }
        } catch (error) {
            console.error('Failed to open workspace:', error);
            set((state) => ({
                workspace: { ...state.workspace, isLoading: false }
            }));
        }
    },

    openProject: async (path: string) => {
        if (!window.electron) return;

        set((state) => ({
            workspace: { ...state.workspace, isLoading: true }
        }));

        try {
            const result = await window.electron.workspace.openFromPath(path);
            if (result) {
                set((state) => ({
                    workspace: {
                        ...state.workspace,
                        rootPath: result.path,
                        fileTree: result.tree,
                        isWatching: true,
                        isLoading: false
                    },
                    openedFolder: result.path
                }));

                // Auto-refresh Git if it's a repo
                if (get().refreshGit) {
                    await get().refreshGit();
                }

                // Ensure project config exists
                void window.electron.fileSystem.ensureProjectConfig(result.path);
                void get().addRecent(result.path);
                void get().syncProjectFiles();

            } else {
                set((state) => ({
                    workspace: { ...state.workspace, isLoading: false }
                }));
                get().addToast({ type: 'error', message: 'Projeto não encontrado ou inacessível.' });
                get().removeRecent(path);
            }
        } catch (error) {
            console.error('Failed to open project:', error);
            set((state) => ({
                workspace: { ...state.workspace, isLoading: false }
            }));
            get().addToast({ type: 'error', message: 'Erro ao abrir projeto.' });
        }
    },

    refreshWorkspace: async () => {
        const { rootPath } = get().workspace;
        if (!rootPath || !window.electron) return;

        try {
            const tree = await window.electron.workspace.getTree(rootPath);
            set((state) => ({
                workspace: { ...state.workspace, fileTree: tree }
            }));
        } catch (error) {
            console.error('Failed to refresh workspace:', error);
        }
    },

    setWorkspaceRoot: (path: string | null) => {
        set((state) => ({
            workspace: { ...state.workspace, rootPath: path },
            openedFolder: path // For backward compatibility
        }));

        if (path) {
            void get().addRecent(path); // Add to recents when opened
            void get().syncProjectFiles(); // Sync files when folder is opened
            void get().refreshWorkspace(); // Fetch file tree for the new folder
            if (window.electron) {
                void window.electron.fileSystem.ensureProjectConfig(path);
            }
        } else {
            // Cleanup workspace tree when closing
            set((state) => ({
                workspace: { ...state.workspace, fileTree: [], rootPath: null }
            }));

            if (get().activeSidebarTab === 'git') {
                // Reset to explorer if closing folder while in git tab
                set({ activeSidebarTab: 'explorer' });
            }
        }
    },

    updateFileTree: (tree: FileNode[]) => {
        set((state) => ({
            workspace: { ...state.workspace, fileTree: tree }
        }));
    }
});
