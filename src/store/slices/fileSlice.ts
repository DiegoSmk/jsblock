import type { StateCreator } from 'zustand';
import type { Edge } from '@xyflow/react';
import type { AppState, RecentEnvironment, AppNode } from '../../types/store';

export interface FileSlice {
    openedFolder: string | null;
    selectedFile: string | null;
    isDirty: boolean;
    projectFiles: Record<string, string>;
    recentFiles: string[];
    recentEnvironments: RecentEnvironment[];
    isBlockFile: boolean;

    setOpenedFolder: (path: string | null) => void;
    syncProjectFiles: () => Promise<void>;
    setSelectedFile: (path: string | null) => Promise<void>;
    loadContentForFile: (path: string | null) => Promise<void>;
    saveFile: () => Promise<void>;
    addRecentFile: (path: string) => void;
    addRecent: (path: string) => Promise<void>;
    removeRecent: (path: string) => void;
    toggleFavorite: (path: string) => void;
    setRecentLabel: (path: string, label: 'personal' | 'work' | 'fun' | 'other' | undefined) => void;
    validateRecents: () => Promise<void>;
    setDirty: (dirty: boolean) => void;
}

export const createFileSlice: StateCreator<AppState, [], [], FileSlice> = (set, get) => ({
    openedFolder: null,
    selectedFile: null,
    isDirty: false,
    projectFiles: {},
    recentFiles: (JSON.parse(localStorage.getItem('recentFiles') ?? '[]') as string[]),
    recentEnvironments: (JSON.parse(localStorage.getItem('recentEnvironments') ?? '[]') as RecentEnvironment[]),
    isBlockFile: false,

    setOpenedFolder: (path) => set({ openedFolder: path }),

    syncProjectFiles: async () => {
        const { openedFolder } = get();
        if (!openedFolder || !window.electron) return;
        try {
            const files = await window.electron.fileSystem.readDir(openedFolder);
            const projectFiles: Record<string, string> = {};
            files.forEach((f: { isDirectory: boolean, path: string, name: string }) => {
                if (!f.isDirectory) projectFiles[f.path] = f.name;
            });
            set({ projectFiles });
        } catch (err) {
            console.error('Failed to sync project files', err);
        }
    },

    setSelectedFile: async (path) => {
        const { isDirty, setConfirmationModal, selectedFile, saveFile, setDirty, addRecentFile, loadContentForFile } = get();

        if (isDirty && selectedFile) {
            return new Promise<void>((resolve) => {
                setConfirmationModal({
                    isOpen: true,
                    title: 'Salvar alterações?',
                    message: `Você tem alterações não salvas em "${selectedFile.split('/').pop()}". Deseja salvar antes de sair?`,
                    confirmLabel: 'Salvar',
                    cancelLabel: 'Cancelar',
                    discardLabel: 'Descartar',
                    variant: 'warning',
                    onConfirm: async () => {
                        await saveFile();
                        setConfirmationModal(null);
                        set({ selectedFile: path });
                        if (path) {
                            addRecentFile(path);
                            await loadContentForFile(path);
                        }
                        resolve();
                    },
                    onDiscard: async () => {
                        setDirty(false);
                        setConfirmationModal(null);
                        set({ selectedFile: path });
                        if (path) {
                            addRecentFile(path);
                            await loadContentForFile(path);
                        }
                        resolve();
                    },
                    onCancel: () => {
                        setConfirmationModal(null);
                        resolve();
                    }
                });
            });
        }

        set({ selectedFile: path });
        if (path) {
            get().addRecentFile(path);
            await get().loadContentForFile(path);
        }
    },

    loadContentForFile: async (path) => {
        if (!path || !window.electron) return;
        try {
            const content = await window.electron.fileSystem.readFile(path);
            const isBlock = path.endsWith('.block') || path.endsWith('.json');

            if (isBlock) {
                try {
                    interface BlockData {
                        nodes?: AppNode[];
                        edges?: unknown[];
                        viewport?: { x: number; y: number; zoom: number };
                        code?: string;
                    }
                    const json = JSON.parse(content) as BlockData;
                    set({
                        nodes: json.nodes ?? [],
                        edges: (json.edges ?? []) as Edge[],
                        viewport: json.viewport ?? { x: 0, y: 0, zoom: 1 },
                        code: json.code ?? ''
                    });
                    set({ isBlockFile: true, isDirty: false });
                } catch (e) {
                    console.error('Failed to parse block file', e);
                    get().addToast({ type: 'error', message: 'Erro ao abrir arquivo de bloco' });
                    // Safe fallback
                    set({ nodes: [], edges: [], isBlockFile: true, isDirty: false });
                }
            } else {
                get().setCode(content, false, false);
                set({ isBlockFile: false, isDirty: false });
            }
        } catch (err) {
            console.error('Failed to load file content', err);
        }
    },

    saveFile: async () => {
        const { selectedFile, code, nodes, edges, isBlockFile, viewport } = get();
        if (!selectedFile || !window.electron) return;
        try {
            let content = code;
            if (isBlockFile) {
                const json = {
                    nodes,
                    edges,
                    viewport,
                    code
                };
                content = JSON.stringify(json, null, 2);
            }

            await window.electron.fileSystem.writeFile(selectedFile, content);
            set({ isDirty: false });
            get().addToast({ type: 'success', message: 'Arquivo salvo com sucesso' });
        } catch (err) {
            console.error('Failed to save file', err);
            get().addToast({ type: 'error', message: 'Erro ao salvar arquivo' });
        }
    },

    addRecentFile: (path) => {
        const { recentFiles } = get();
        const newRecents = [path, ...recentFiles.filter(f => f !== path)].slice(0, 20);
        localStorage.setItem('recentFiles', JSON.stringify(newRecents));
        set({ recentFiles: newRecents });
    },

    addRecent: async (path) => {
        const { recentEnvironments } = get();
        if (window.electron) {
            const exists = await window.electron.fileSystem.checkExists(path);
            if (!exists) return;
        }

        const now = Date.now();
        const existingIndex = recentEnvironments.findIndex((r) => r.path === path);
        const newRecents = [...recentEnvironments];
        if (existingIndex >= 0) {
            newRecents[existingIndex] = { ...newRecents[existingIndex], lastOpened: now };
        } else {
            newRecents.push({ path, lastOpened: now });
        }

        localStorage.setItem('recentEnvironments', JSON.stringify(newRecents));
        set({ recentEnvironments: newRecents });
    },

    removeRecent: (path) => {
        const newRecents = get().recentEnvironments.filter((r) => r.path !== path);
        localStorage.setItem('recentEnvironments', JSON.stringify(newRecents));
        set({ recentEnvironments: newRecents });
    },

    toggleFavorite: (path) => {
        const newRecents = get().recentEnvironments.map((r) =>
            r.path === path ? { ...r, isFavorite: !r.isFavorite } : r
        );
        localStorage.setItem('recentEnvironments', JSON.stringify(newRecents));
        set({ recentEnvironments: newRecents });
    },

    setRecentLabel: (path, label) => {
        const newRecents = get().recentEnvironments.map((r) =>
            r.path === path ? { ...r, label } : r
        );
        localStorage.setItem('recentEnvironments', JSON.stringify(newRecents));
        set({ recentEnvironments: newRecents });
    },

    validateRecents: async () => {
        if (!window.electron) return;
        const { recentEnvironments } = get();
        const paths = recentEnvironments.map((r) => r.path);
        try {
            const existenceMap = await window.electron.fileSystem.checkPathsExists(paths);
            const validRecents = recentEnvironments.filter((r) => existenceMap[r.path]);
            if (validRecents.length !== recentEnvironments.length) {
                localStorage.setItem('recentEnvironments', JSON.stringify(validRecents));
                set({ recentEnvironments: validRecents });
            }
        } catch (err) {
            console.error('Failed to validate recents:', err);
        }
    },

    setDirty: (dirty) => set({ isDirty: dirty })
});
