import type { StateCreator } from 'zustand';
import type { AppState, PluginManifest } from '../../types/store';

export interface ExtensionSlice {
    plugins: PluginManifest[];
    selectedPluginId: string | null;
    discoverPlugins: () => Promise<void>;
    togglePlugin: (id: string, enabled: boolean) => Promise<void>;
    installPlugin: () => Promise<void>;
    uninstallPlugin: (id: string) => Promise<void>;
    setSelectedPluginId: (id: string | null) => void;
}

export const createExtensionSlice: StateCreator<AppState, [], [], ExtensionSlice> = (set, get) => ({
    plugins: [],
    selectedPluginId: null,

    discoverPlugins: async () => {
        if (!window.electron) return;
        const plugins = await window.electron.discoverPlugins();
        set({ plugins });
    },

    togglePlugin: async (id, enabled) => {
        if (!window.electron) return;
        await window.electron.togglePlugin(id, enabled);
        await get().discoverPlugins();
    },

    installPlugin: async () => {
        if (!window.electron) return;
        await window.electron.installPlugin();
        await get().discoverPlugins();
    },

    uninstallPlugin: async (id) => {
        if (!window.electron) return;
        await window.electron.uninstallPlugin(id);
        await get().discoverPlugins();
    },

    setSelectedPluginId: (id) => set({ selectedPluginId: id })
});
