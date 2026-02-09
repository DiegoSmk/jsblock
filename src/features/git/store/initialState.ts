import type { GitSlice } from '../types';

export const initialGitState: GitSlice['git'] = {
    isRepo: false,
    currentBranch: '',
    changes: [],
    log: [],
    rawLog: '',
    globalAuthor: null,
    projectAuthor: null,
    activeView: 'status',
    sidebarView: 'info',
    branches: [],
    stashes: [],
    stats: {
        fileCount: 0,
        repoSize: '',
        projectSize: ''
    },
    tags: [],
    isInitialized: false,
    selectedDiffFile: null,
    isLoading: false,
    configLevel: 'local',
    authorBuffer: { name: '', email: '' },
    isEditingAuthor: false,
    showProfileManager: false,
    newProfile: { name: '', email: '', tag: 'personal' as const, customTagName: '' }
};
