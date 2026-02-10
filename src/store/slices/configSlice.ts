import type { StateCreator } from 'zustand';
import type { AppState, Settings, SettingsConfig } from '../../types/store';

export interface ConfigSlice {
    theme: 'light' | 'dark';
    settingsConfig: string;
    settings: Settings;
    autoSave: boolean;
    updateSettingsConfig: (json: string) => void;
    updateSettings: (updates: Partial<Settings>) => void;
    toggleAutoSave: () => void;
    toggleTheme: () => void;
    resetSettings: () => void;
}

export const createConfigSlice: StateCreator<AppState, [], [], ConfigSlice> = (set, get) => ({
    theme: (() => {
        try {
            const saved = localStorage.getItem('settings.json');
            if (saved) {
                const parsed = JSON.parse(saved) as SettingsConfig;
                const theme = parsed.appearance?.theme;
                if (theme === 'dark' || theme === 'light') return theme;
            }
        } catch { /* Handle missing or corrupt theme settings */ }
        return 'dark' as 'dark' | 'light';
    })(),

    settingsConfig: (() => {
        const defaults = {
            appearance: {
                theme: 'dark',
                showAppBorder: false,
                windowTransparency: 0.85,
                windowBackground: '#0f172a',
                windowAlwaysOnTop: false
            },
            layout: { sidebar: { width: 260 } },
            editor: { fontSize: 14, autoLayoutNodes: false },
            terminal: { copyOnSelect: true, rightClickPaste: true },
            files: { autoSave: false }
        };
        const saved = localStorage.getItem('settings.json');
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as SettingsConfig;
                const sb = parsed.layout?.sidebar as Record<string, unknown> | undefined;
                if (parsed.layout && sb && (sb.vanilla || sb.git)) {
                    parsed.layout.sidebar = { width: 260 };
                    return JSON.stringify(parsed, null, 2);
                }
                return saved;
            } catch {
                return JSON.stringify(defaults, null, 2);
            }
        }
        return JSON.stringify(defaults, null, 2);
    })(),

    settings: (() => {
        const defaultSettings = {
            terminalCopyOnSelect: true,
            terminalRightClickPaste: true,
            autoLayoutNodes: false,
            fontSize: 14,
            showAppBorder: false,
            showDebugHandles: false,
            windowTransparency: 0.85,
            windowBackground: '#0f172a',
            windowAlwaysOnTop: false,
            searchMaxDepth: 10,
            searchMaxFileSize: 5
        };
        try {
            const saved = localStorage.getItem('settings.json');
            if (saved) {
                const parsed = JSON.parse(saved) as SettingsConfig;
                return {
                    terminalCopyOnSelect: parsed.terminal?.copyOnSelect ?? defaultSettings.terminalCopyOnSelect,
                    terminalRightClickPaste: parsed.terminal?.rightClickPaste ?? defaultSettings.terminalRightClickPaste,
                    autoLayoutNodes: parsed.editor?.autoLayoutNodes ?? defaultSettings.autoLayoutNodes,
                    fontSize: parsed.editor?.fontSize ?? defaultSettings.fontSize,
                    showAppBorder: parsed.appearance?.showAppBorder ?? false,
                    showDebugHandles: parsed.developer?.showDebugHandles ?? defaultSettings.showDebugHandles,
                    windowTransparency: parsed.appearance?.windowTransparency ?? 0.85,
                    windowBackground: parsed.appearance?.windowBackground ?? (parsed.appearance?.theme === 'light' ? '#f8fbfc' : '#0f172a'),
                    windowAlwaysOnTop: parsed.appearance?.windowAlwaysOnTop ?? false,
                    searchMaxDepth: parsed.search?.maxDepth ?? defaultSettings.searchMaxDepth,
                    searchMaxFileSize: parsed.search?.maxFileSize ?? defaultSettings.searchMaxFileSize
                };
            }
        } catch { /* Ignore missing or corrupt settings */ }
        return defaultSettings;
    })(),

    autoSave: (() => {
        try {
            const saved = localStorage.getItem('settings.json');
            if (saved) {
                const parsed = JSON.parse(saved) as SettingsConfig;
                return parsed.files?.autoSave ?? false;
            }
        } catch { /* Default to no auto-save */ }
        return false;
    })(),

    updateSettingsConfig: (json: string) => {
        localStorage.setItem('settings.json', json);
        set({ settingsConfig: json });

        try {
            const parsed = JSON.parse(json) as SettingsConfig;
            if (parsed.appearance?.theme) {
                set({ theme: parsed.appearance.theme });
            }
            if (parsed.layout?.sidebar?.width) {
                const width = parsed.layout.sidebar.width;
                set((state) => ({
                    layout: { ...state.layout, sidebar: { ...state.layout.sidebar, width } }
                }));
            }
            if (parsed.files?.autoSave !== undefined) {
                set({ autoSave: parsed.files.autoSave });
            }

            const newSettings = { ...get().settings };
            if (parsed.editor?.fontSize !== undefined) newSettings.fontSize = parsed.editor.fontSize;
            if (parsed.editor?.autoLayoutNodes !== undefined) newSettings.autoLayoutNodes = parsed.editor.autoLayoutNodes;
            if (parsed.terminal?.copyOnSelect !== undefined) newSettings.terminalCopyOnSelect = parsed.terminal.copyOnSelect;
            if (parsed.terminal?.rightClickPaste !== undefined) newSettings.terminalRightClickPaste = parsed.terminal.rightClickPaste;
            if (parsed.appearance?.showAppBorder !== undefined) newSettings.showAppBorder = parsed.appearance.showAppBorder;
            if (parsed.appearance?.windowTransparency !== undefined) newSettings.windowTransparency = parsed.appearance.windowTransparency;
            if (parsed.appearance?.windowBackground !== undefined) newSettings.windowBackground = parsed.appearance.windowBackground;
            if (parsed.appearance?.windowAlwaysOnTop !== undefined) newSettings.windowAlwaysOnTop = parsed.appearance.windowAlwaysOnTop;

            set({ settings: newSettings });
        } catch { /* Silently ignore parse errors while typing */ }
    },

    updateSettings: (updates: Partial<Settings>) => {
        const current = get().settings;
        const newSettings = { ...current, ...updates };
        set({ settings: newSettings });

        try {
            const parsed = JSON.parse(get().settingsConfig) as SettingsConfig;
            parsed.editor ??= {};
            parsed.terminal ??= {};
            parsed.appearance ??= {};

            if (updates.fontSize !== undefined) parsed.editor.fontSize = updates.fontSize;
            if (updates.autoLayoutNodes !== undefined) parsed.editor.autoLayoutNodes = updates.autoLayoutNodes;
            if (updates.terminalCopyOnSelect !== undefined) parsed.terminal.copyOnSelect = updates.terminalCopyOnSelect;
            if (updates.terminalRightClickPaste !== undefined) parsed.terminal.rightClickPaste = updates.terminalRightClickPaste;
            if (updates.showAppBorder !== undefined) parsed.appearance.showAppBorder = updates.showAppBorder;
            if (updates.windowTransparency !== undefined) parsed.appearance.windowTransparency = updates.windowTransparency;
            if (updates.windowBackground !== undefined) parsed.appearance.windowBackground = updates.windowBackground;
            if (updates.windowAlwaysOnTop !== undefined) parsed.appearance.windowAlwaysOnTop = updates.windowAlwaysOnTop;

            parsed.developer ??= {};
            if (updates.showDebugHandles !== undefined) parsed.developer.showDebugHandles = updates.showDebugHandles;

            const newJson = JSON.stringify(parsed, null, 2);
            localStorage.setItem('settings.json', newJson);
            set({ settingsConfig: newJson });
        } catch (e) {
            console.error('Failed to sync settings', e);
        }
    },

    toggleAutoSave: () => {
        const newValue = !get().autoSave;
        set({ autoSave: newValue });

        try {
            const parsed = JSON.parse(get().settingsConfig) as SettingsConfig;
            parsed.files ??= {};
            parsed.files.autoSave = newValue;

            const newJson = JSON.stringify(parsed, null, 2);
            localStorage.setItem('settings.json', newJson);
            set({ settingsConfig: newJson });
        } catch (e) {
            console.error('Failed to sync autoSave', e);
        }
    },

    toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        const nextBg = nextTheme === 'dark' ? '#0f172a' : '#f8fafc';

        set({ theme: nextTheme });
        set(state => ({
            settings: {
                ...state.settings,
                windowBackground: nextBg
            }
        }));

        try {
            const parsed = JSON.parse(get().settingsConfig) as SettingsConfig;
            parsed.appearance ??= {};
            parsed.appearance.theme = nextTheme;
            parsed.appearance.windowBackground = nextBg;

            const newJson = JSON.stringify(parsed, null, 2);
            localStorage.setItem('settings.json', newJson);
            set({ settingsConfig: newJson });
        } catch (e) {
            console.error('Failed to sync theme', e);
        }
    },

    resetSettings: () => {
        const defaults = {
            appearance: {
                theme: 'dark',
                showAppBorder: false,
                windowTransparency: 0.85,
                windowBackground: '#0f172a',
                windowAlwaysOnTop: false
            },
            layout: { sidebar: { width: 260 } },
            editor: { fontSize: 14, autoLayoutNodes: false },
            terminal: { copyOnSelect: true, rightClickPaste: true },
            files: { autoSave: false }
        };
        const json = JSON.stringify(defaults, null, 2);
        get().updateSettingsConfig(json);
    }
});
