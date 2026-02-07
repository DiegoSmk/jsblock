export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged';
  index: string;
  workingTree: string;
}

export interface GitLogEntry {
  hash: string;
  author: string;
  date: string;
  message: string;
  graph?: string;
  refs?: string;
  isGraphOnly?: boolean;
}

export interface GitCommitFile {
  path: string;
  status: string;
}

export interface GitAuthor {
  name: string;
  email: string;
}

export interface GitStashEntry {
  index: number;
  branch: string;
  message: string;
  description: string;
}

export interface GitProfile {
  id: string;
  name: string;
  email: string;
  tag: 'work' | 'personal' | 'ai' | 'custom';
  customTagName?: string;
}

export interface GitTag {
  name: string;
  hash: string;
  message?: string;
  date?: string;
}

export interface CommitTemplate {
  id: string;
  name: string;
  content: string;
}

export interface GitPanelSection {
  id: string;
  label: string;
  visible: boolean;
  expanded?: boolean;
}

export interface GitPanelConfig {
  sections: GitPanelSection[];
}

export interface QuickCommand {
  id: string;
  label: string;
  command: string;
  autoExecute: boolean;
}

export interface GitSlice {
  git: {
    isRepo: boolean;
    currentBranch: string;
    changes: GitFileStatus[];
    log: GitLogEntry[];
    rawLog: string;
    globalAuthor: GitAuthor | null;
    projectAuthor: GitAuthor | null;
    activeView: 'status' | 'terminal' | 'graph';
    sidebarView: 'history' | 'graph' | 'info';
    branches: string[];
    stashes: GitStashEntry[];
    stats: {
      fileCount: number;
      repoSize: string;
      projectSize: string;
    };
    tags: GitTag[];
    isInitialized: boolean;
    selectedDiffFile: string | null;
  };
  gitProfiles: GitProfile[];
  commitTemplates: CommitTemplate[];
  commitDetail: {
    isOpen: boolean;
    commit: GitLogEntry | null;
    files: GitCommitFile[];
    fullMessage: string;
    stats?: {
      insertions: number;
      deletions: number;
      filesChanged: number;
    };
  };
  quickCommands: QuickCommand[];
  gitPanelConfig: GitPanelConfig;

  // Actions
  setGitView: (view: 'status' | 'terminal' | 'graph') => void;
  setGitSidebarView: (view: 'history' | 'graph' | 'info') => void;
  openCommitDetail: (commit: GitLogEntry) => Promise<void>;
  closeCommitDetail: () => void;
  refreshGit: () => Promise<void>;
  fetchGitConfig: () => Promise<void>;
  changeBranch: (branch: string) => Promise<void>;
  createBranch: (branch: string, startPoint?: string) => Promise<void>;
  deleteBranch: (branch: string) => Promise<void>;
  checkoutCommit: (hash: string) => Promise<void>;
  gitStage: (path: string) => Promise<void>;
  gitStageAll: () => Promise<void>;
  gitUnstage: (path: string) => Promise<void>;
  gitUnstageAll: () => Promise<void>;
  gitDiscard: (path: string) => Promise<void>;
  gitDiscardAll: () => Promise<void>;
  gitCommit: (message: string, isAmend?: boolean) => Promise<void>;
  gitStash: (message?: string) => Promise<void>;
  gitPopStash: (index?: number) => Promise<void>;
  gitApplyStash: (index: number) => Promise<void>;
  gitDropStash: (index: number) => Promise<void>;
  fetchStashes: () => Promise<void>;
  gitUndoLastCommit: () => Promise<void>;
  gitInit: (author?: GitAuthor, isGlobal?: boolean) => Promise<void>;
  setGitConfig: (author: GitAuthor, isGlobal: boolean) => Promise<void>;
  addGitProfile: (profile: Omit<GitProfile, 'id'>) => void;
  removeGitProfile: (id: string) => void;
  updateGitProfile: (id: string, updates: Partial<Omit<GitProfile, 'id'>>) => void;
  resetToGlobal: () => Promise<void>;
  getCommitFiles: (hash: string) => Promise<GitCommitFile[]>;

  // Tags
  gitCreateTag: (name: string, hash: string, message?: string) => Promise<void>;
  gitDeleteTag: (name: string) => Promise<void>;
  gitClean: () => Promise<void>;
  gitIgnore: (pattern: string) => Promise<void>;
  fetchTags: () => Promise<void>;

  // Commit Templates
  addCommitTemplate: (template: Omit<CommitTemplate, 'id'>) => void;
  removeCommitTemplate: (id: string) => void;

  // Quick Commands
  addQuickCommand: (cmd: Omit<QuickCommand, 'id'>) => void;
  removeQuickCommand: (id: string) => void;

  // Git Panel Configuration
  updateGitPanelConfig: (updates: Partial<GitPanelConfig>) => void;
  resetGitPanelConfig: () => void;

  // Network
  gitFetch: () => Promise<void>;
  gitPull: () => Promise<void>;
  gitPush: () => Promise<void>;
  gitSync: () => Promise<void>;

  // Diff
  selectGitDiffFile: (path: string) => void;
  closeGitDiffFile: () => void;
  getGitFileContent: (path: string, ref: string) => Promise<string>;
}
