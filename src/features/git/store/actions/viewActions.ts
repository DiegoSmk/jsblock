import type { AppState } from '../../../../types/store';
import type { GitSlice, GitLogEntry } from '../../types';

export const createViewActions = (set: (nextState: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void, get: () => AppState): Partial<GitSlice> => ({
    setGitView: (view: 'status' | 'terminal' | 'graph') => {
        set((state: AppState) => ({
            git: { ...state.git, activeView: view }
        }));
    },

    setGitSidebarView: (view: 'history' | 'graph' | 'info') => {
        set((state: AppState) => ({
            git: { ...state.git, sidebarView: view }
        }));
    },

    openCommitDetail: async (commit: GitLogEntry) => {
        const { openedFolder, getCommitFiles } = get();
        if (!openedFolder || !window.electronAPI) return;

        try {
            const res = await window.electronAPI.gitCommand(openedFolder, ['show', '--pretty=format:%B', '-s', commit.hash]);
            const fullMessage = res.stdout.trim();
            const files = await getCommitFiles(commit.hash);

            let stats = { insertions: 0, deletions: 0, filesChanged: 0 };
            try {
                const statRes = await window.electronAPI.gitCommand(openedFolder, ['show', '--shortstat', '--format=', commit.hash]);
                const statLine = statRes.stdout.trim();
                if (statLine) {
                    const filesMatch = /(\d+) files? changed/.exec(statLine);
                    const insMatch = /(\d+) insertions?\(\+\)/.exec(statLine);
                    const delMatch = /(\d+) deletions?\(-\)/.exec(statLine);

                    stats = {
                        filesChanged: filesMatch ? parseInt(filesMatch[1]) : 0,
                        insertions: insMatch ? parseInt(insMatch[1]) : 0,
                        deletions: delMatch ? parseInt(delMatch[1]) : 0
                    };
                }
            } catch (err) {
                console.warn('Failed to fetch commit stats:', err);
            }

            set((_state: AppState) => ({
                commitDetail: {
                    isOpen: true,
                    commit,
                    files,
                    fullMessage,
                    stats
                }
            }));
        } catch (err) {
            console.error('Failed to open commit detail:', err);
        }
    },

    closeCommitDetail: () => {
        set((_state: AppState) => ({
            commitDetail: {
                isOpen: false,
                commit: null,
                files: [],
                fullMessage: '',
                stats: undefined
            }
        }));
    },
});
