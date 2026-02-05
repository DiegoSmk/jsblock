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
    isInitialized: false
};
