import type { StateCreator } from 'zustand';
import type { AppState, GitSlice } from '../../../types/store';
import { initialGitState } from './initialState';
import { createBranchActions } from './actions/branchActions';
import { createCommitActions } from './actions/commitActions';
import { createConfigActions } from './actions/configActions';
import { createLifecycleActions } from './actions/lifecycleActions';
import { createPanelActions } from './actions/panelActions';
import { createStageActions } from './actions/stageActions';
import { createStashActions } from './actions/stashActions';
import { createTagActions } from './actions/tagActions';
import { createViewActions } from './actions/viewActions';

export const createGitSlice: StateCreator<AppState, [], [], GitSlice> = (set, get) => ({
    git: initialGitState,

    // Initial State for Panel Configs (loaded from localStorage in initializers usually, but here defined inline in original file)
    // We need to move the initialization logic here or keep it.
    // The original createGitSlice had inline initialization.
    // I moved the logic to initialGitState for `git` object, but `gitPanelConfig` etc were computed.
    // I should implement them here or in initialState if possible.
    // `gitPanelConfig` relies on localStorage.

    gitPanelConfig: (() => {
        const saved = localStorage.getItem('gitPanelConfig');
        const defaultView = {
            sections: [
                { id: 'overview', label: 'Visão Geral', visible: true, expanded: true },
                { id: 'stats', label: 'Estatísticas', visible: true, expanded: true },
                { id: 'weekly', label: 'Atividade Semanal', visible: true, expanded: true },
                { id: 'hourly', label: 'Horários de Pico', visible: true, expanded: true },
                { id: 'contributors', label: 'Colaboradores', visible: true, expanded: true },
                { id: 'tags', label: 'Tags & Versões', visible: true, expanded: true }
            ]
        };
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as { sections: any[] };
                const sections = [...defaultView.sections];
                parsed.sections.forEach((s) => {
                    const idx = sections.findIndex(def => def.id === s.id);
                    if (idx >= 0) {
                        sections[idx] = { ...sections[idx], ...s };
                    } else {
                        sections.push(s as any);
                    }
                });
                return { sections };
            } catch {
                return defaultView;
            }
        }
        return defaultView;
    })(),

    gitProfiles: JSON.parse(localStorage.getItem('gitProfiles') ?? '[]'),
    commitTemplates: JSON.parse(localStorage.getItem('commitTemplates') ?? '[]'),
    commitDetail: {
        isOpen: false,
        commit: null,
        files: [],
        fullMessage: '',
        stats: undefined
    },
    quickCommands: JSON.parse(localStorage.getItem('quickCommands') ?? '[]'),

    ...createBranchActions(set, get),
    ...createCommitActions(set, get),
    ...createConfigActions(set, get),
    ...createLifecycleActions(set, get),
    ...createPanelActions(set, get),
    ...createStageActions(set, get),
    ...createStashActions(set, get),
    ...createTagActions(set, get),
    ...createViewActions(set, get),
}) as GitSlice;
