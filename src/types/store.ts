import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from '@xyflow/react';

export interface Scope {
  id: string;
  label: string;
}

export interface NodeCustomStyle {
  borderColor?: string;
  borderOpacity?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface EdgeCustomStyle {
  type?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  animated?: boolean;
}

export interface AppNodeData {
  label?: string;
  expression?: string;
  value?: unknown;
  scopeId?: string;
  isDecl?: boolean;
  isStandalone?: boolean;
  hasReturn?: boolean;
  usageCount?: number;
  connectedValues?: Record<string | number, string>;
  type?: string;
  name?: string;
  args?: string[];
  nestedArgsCall?: Record<string, { expression: string }>;
  nestedCall?: { name: string, args: string[] };
  scopes?: Record<string, { id: string; label: string }>;
  fallenIndex?: number;
  text?: string;
  customStyle?: NodeCustomStyle;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

export type AppNode = Node<AppNodeData>;

export interface RecentEnvironment {
  path: string;
  lastOpened: number; // timestamp
  label?: 'personal' | 'work' | 'fun' | 'other';
  isFavorite?: boolean;
}

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

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  entry: string;
  permissions?: string[];
  enabled?: boolean;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface Settings {
  terminalCopyOnSelect: boolean;
  terminalRightClickPaste: boolean;
  autoLayoutNodes: boolean;
  fontSize: number;
  showAppBorder: boolean;
}

export interface SettingsConfig {
  appearance?: {
    theme?: 'light' | 'dark';
    showAppBorder?: boolean;
  };
  layout?: {
    sidebar?: {
      width?: number;
    };
  };
  editor?: {
    fontSize?: number;
    autoLayoutNodes?: boolean;
  };
  terminal?: {
    copyOnSelect?: boolean;
    rightClickPaste?: boolean;
  };
  files?: {
    autoSave?: boolean;
  };
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
}

export interface AppState extends GitSlice {
  code: string;
  nodes: AppNode[];
  edges: Edge[];
  theme: 'light' | 'dark';
  runtimeValues: Record<string, unknown>;

  navigationStack: { id: string, label: string }[];
  activeScopeId: string; // 'root' by default

  // File System State
  openedFolder: string | null;
  selectedFile: string | null;
  autoSave: boolean;
  isDirty: boolean;

  toggleAutoSave: () => void;
  setDirty: (dirty: boolean) => void;

  setCode: (code: string, shouldSetDirty?: boolean) => void;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  forceLayout: () => void;
  toggleTheme: () => void;
  updateNodeData: (nodeId: string, newData: Partial<AppNodeData>) => void;
  updateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  addFunctionCall: (funcName: string, args?: string[]) => void;
  addLogicNode: () => void;
  addIfNode: () => void;
  addSwitchNode: () => void;
  addWhileNode: () => void;
  addForNode: () => void;
  promoteToVariable: (literalNodeId: string, literalValue: unknown, type: string) => void;
  promoteCallToVariable: (callNodeId: string, funcName: string) => void;

  // Modal State
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
  openModal: (config: Omit<AppState['modal'], 'isOpen'>) => void;
  closeModal: () => void;
  setConfirmationModal: (config: AppState['confirmationModal']) => void;

  // Settings (JSON)
  settingsConfig: string; // The raw JSON string
  updateSettingsConfig: (json: string) => void;

  // Runtime Layout (Session Only)
  layout: {
    sidebar: {
      width: number;
      isVisible: boolean;
    };
  };
  activeSidebarTab: 'explorer' | 'library' | 'git' | 'settings' | 'extensions';
  showCode: boolean;
  showCanvas: boolean;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: (show?: boolean) => void;
  setSidebarTab: (tab: 'explorer' | 'library' | 'git' | 'settings' | 'extensions') => void;
  toggleCode: () => void;
  toggleCanvas: () => void;

  // Scope Navigation Actions
  navigateInto: (scopeId: string, label: string) => void;
  navigateBack: () => void;
  navigateToScope: (index: number) => void;

  // Block Note Actions
  addNoteNode: () => void;
  isBlockFile: boolean;

  // File System Actions
  setOpenedFolder: (path: string | null) => void;
  setSelectedFile: (path: string | null) => Promise<void>;
  loadContentForFile: (path: string | null) => Promise<void>;
  saveFile: () => Promise<void>;

  // Recent Environments
  recentEnvironments: RecentEnvironment[];
  addRecent: (path: string) => Promise<void>;
  removeRecent: (path: string) => void;
  toggleFavorite: (path: string) => void;
  setRecentLabel: (path: string, label: 'personal' | 'work' | 'fun' | 'other' | undefined) => void;
  validateRecents: () => Promise<void>;

  // Toast Actions
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Settings
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;

  // Plugins
  plugins: PluginManifest[];
  selectedPluginId: string | null;
  discoverPlugins: () => Promise<void>;
  togglePlugin: (id: string, enabled: boolean) => Promise<void>;
  installPlugin: () => Promise<void>;
  uninstallPlugin: (id: string) => Promise<void>;
  setSelectedPluginId: (id: string | null) => void;

  resetSettings: () => void;
}
