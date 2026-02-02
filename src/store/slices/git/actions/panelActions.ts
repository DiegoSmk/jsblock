import type { GitSlice, AppState, GitPanelConfig, QuickCommand } from '../../../../types/store';
import { StateCreator } from 'zustand';

export const createPanelActions = (set: StateCreator<AppState>['setState'], get: StateCreator<AppState>['getState']): Partial<GitSlice> => ({
    updateGitPanelConfig: (updates: Partial<GitPanelConfig>) => {
        const current = get().gitPanelConfig;
        const newValue = { ...current, ...updates };
        localStorage.setItem('gitPanelConfig', JSON.stringify(newValue));
        set({ gitPanelConfig: newValue });
    },

    resetGitPanelConfig: () => {
        const defaultView: GitPanelConfig = {
            sections: [
                { id: 'overview', label: 'Visão Geral', visible: true, expanded: true },
                { id: 'stats', label: 'Estatísticas', visible: true, expanded: true },
                { id: 'weekly', label: 'Atividade Semanal', visible: true, expanded: true },
                { id: 'hourly', label: 'Horários de Pico', visible: true, expanded: true },
                { id: 'contributors', label: 'Colaboradores', visible: true, expanded: true },
                { id: 'tags', label: 'Tags & Versões', visible: true, expanded: true }
            ]
        };
        localStorage.setItem('gitPanelConfig', JSON.stringify(defaultView));
        set({ gitPanelConfig: defaultView });
    },

    addQuickCommand: (cmd: Omit<QuickCommand, 'id'>) => {
        const newCmd = {
            ...cmd,
            id: Date.now().toString(),
            autoExecute: cmd.autoExecute ?? true
        };
        const quickCommands = [...get().quickCommands, newCmd];
        localStorage.setItem('quickCommands', JSON.stringify(quickCommands));
        set({ quickCommands });
    },

    removeQuickCommand: (id: string) => {
        const quickCommands = get().quickCommands.filter((c: QuickCommand) => c.id !== id);
        localStorage.setItem('quickCommands', JSON.stringify(quickCommands));
        set({ quickCommands });
    },
});
