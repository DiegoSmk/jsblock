import type { StateCreator } from 'zustand';
import type { AppState, SettingsConfig, Toast, Notification } from '../../types/store';

export interface UISlice {
    layout: {
        sidebar: {
            width: number;
            isVisible: boolean;
        };
    };
    activeSidebarTab: 'explorer' | 'library' | 'git' | 'settings' | 'extensions' | 'search';
    showCode: boolean;
    showCanvas: boolean;
    modal: {
        isOpen: boolean;
        title: string;
        initialValue: string;
        type: string;
        placeholder?: string;
        confirmLabel?: string;
        payload?: unknown;
        onSubmit: (name: string) => void;
    };
    confirmationModal: {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void | Promise<void>;
        onCancel: () => void | Promise<void>;
        onDiscard?: () => void | Promise<void>;
        confirmLabel?: string;
        cancelLabel?: string;
        discardLabel?: string;
        variant?: 'danger' | 'warning' | 'info' | 'primary';
        discardVariant?: 'danger' | 'warning' | 'info' | 'primary' | 'secondary';
    } | null;
    toasts: Toast[];
    notifications: Notification[];
    unreadNotificationsCount: number;
    doNotDisturb: boolean;
    saveLayoutTimeout: ReturnType<typeof setTimeout> | null;

    setSidebarWidth: (width: number) => void;
    toggleSidebar: (show?: boolean) => void;
    setSidebarTab: (tab: UISlice['activeSidebarTab']) => void;
    toggleCode: () => void;
    toggleCanvas: () => void;
    openModal: (config: Omit<UISlice['modal'], 'isOpen'>) => void;
    closeModal: () => void;
    setConfirmationModal: (config: UISlice['confirmationModal']) => void;
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearNotifications: () => void;
    markNotificationsAsRead: () => void;
    toggleDoNotDisturb: () => void;
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set, get) => ({
    layout: (() => {
        let width = 260;
        try {
            const savedSettings = localStorage.getItem('settings.json');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings) as SettingsConfig;
                const sb = parsed.layout?.sidebar;
                if (typeof sb === 'number') width = sb;
                else if (typeof sb?.width === 'number') width = sb.width;
            }
        } catch { /* Ignore missing or corrupt layout settings */ }
        return {
            sidebar: {
                width: Math.max(200, Math.min(800, width)),
                isVisible: true
            }
        };
    })(),
    activeSidebarTab: 'explorer',
    showCode: true,
    showCanvas: true,
    modal: {
        isOpen: false,
        title: '',
        initialValue: '',
        type: '',
        payload: null,
        onSubmit: () => { /* no-op */ }
    },
    confirmationModal: null,
    toasts: [],
    notifications: [],
    unreadNotificationsCount: 0,
    doNotDisturb: false,
    saveLayoutTimeout: null,

    setSidebarWidth: (width: number) => {
        const newWidth = Math.max(200, Math.min(800, Math.round(width)));
        set((state) => ({
            layout: { ...state.layout, sidebar: { ...state.layout.sidebar, width: newWidth } }
        }));

        if (get().saveLayoutTimeout) {
            clearTimeout(get().saveLayoutTimeout as unknown as number);
        }
        const timeout = setTimeout(() => {
            try {
                const parsed = JSON.parse(get().settingsConfig) as SettingsConfig;
                parsed.layout ??= {};
                parsed.layout.sidebar ??= {};
                parsed.layout.sidebar.width = newWidth;

                const newJson = JSON.stringify(parsed, null, 2);
                localStorage.setItem('settings.json', newJson);
                set({ settingsConfig: newJson });
            } catch (e) {
                console.error('Failed to sync sidebar width', e);
            }
        }, 500);
        set({ saveLayoutTimeout: timeout as unknown as ReturnType<typeof setTimeout> });
    },

    toggleSidebar: (show?: boolean) => set((state) => ({
        layout: {
            ...state.layout,
            sidebar: {
                ...state.layout.sidebar,
                isVisible: show ?? !state.layout.sidebar.isVisible
            }
        }
    })),

    setSidebarTab: (tab) => set((state) => ({
        activeSidebarTab: tab,
        layout: {
            ...state.layout,
            sidebar: {
                ...state.layout.sidebar,
                isVisible: true
            }
        }
    })),

    toggleCode: () => {
        if (get().showCode && !get().showCanvas) return;
        set({ showCode: !get().showCode });
    },

    toggleCanvas: () => {
        if (get().showCanvas && !get().showCode) return;
        set({ showCanvas: !get().showCanvas });
    },

    openModal: (config) => set({ modal: { ...config, isOpen: true } }),
    closeModal: () => set((state) => ({ modal: { ...state.modal, isOpen: false } })),
    setConfirmationModal: (config) => set({ confirmationModal: config }),

    addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id, timestamp: Date.now() };
        set((state) => ({
            toasts: [...state.toasts, newToast],
            notifications: state.doNotDisturb ? state.notifications : [
                { ...newToast, read: false },
                ...state.notifications
            ].slice(0, 50),
            unreadNotificationsCount: state.doNotDisturb ? state.unreadNotificationsCount : state.unreadNotificationsCount + 1
        }));

        if (toast.duration !== 0) {
            setTimeout(() => get().removeToast(id), toast.duration ?? 3000);
        }
    },

    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
    })),

    clearNotifications: () => set({ notifications: [], unreadNotificationsCount: 0 }),
    markNotificationsAsRead: () => set({ unreadNotificationsCount: 0, notifications: get().notifications.map(n => ({ ...n, read: true })) }),
    toggleDoNotDisturb: () => set((state) => ({ doNotDisturb: !state.doNotDisturb }))
});
