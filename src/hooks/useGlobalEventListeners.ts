import { useEffect } from 'react';
import { useStore } from '../store/useStore';

/**
 * Global event listeners extracted from App.tsx.
 * Handles storage sync, keyboard shortcuts, and unhandled promise rejections.
 */
export const useGlobalEventListeners = () => {
    // Storage sync: listen for cross-tab settings changes
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'settings.json' && e.newValue) {
                try {
                    useStore.getState().updateSettingsConfig(e.newValue);
                } catch (err) {
                    console.error('Failed to sync settings from storage event', err);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Keyboard shortcuts: Ctrl+S (save), Ctrl+Shift+F (search)
    useEffect(() => {
        const { setSidebarTab, saveFile, layout, toggleSidebar } = useStore.getState();

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S: Save
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && !e.shiftKey) {
                e.preventDefault();
                saveFile().catch(console.error);
                return;
            }

            // Ctrl+Shift+F: Search
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                setSidebarTab('search');
                if (!layout.sidebar.isVisible) {
                    toggleSidebar();
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Silence harmless unhandled promise rejections (Monaco cancelation errors)
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reasonStr = String(event.reason);
            if (
                (event.reason && typeof event.reason === 'object' && (event.reason as Record<string, unknown>).type === 'cancelation') ||
                reasonStr.includes('no diff result available') ||
                reasonStr.includes('canceled')
            ) {
                event.preventDefault();
                return;
            }
            console.warn('Unhandled Promise Rejection:', event.reason);
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        const timer = setTimeout(() => {
            // Use the new window.electron pattern
        }, 200);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            clearTimeout(timer);
        };
    }, []);
};
