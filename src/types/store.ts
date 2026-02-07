import type {
  Connection,
  Edge,
  EdgeChange,
  NodeChange,
} from '@xyflow/react';

import type {
  AppNode,
  AppNodeData,
  EdgeCustomStyle,
  NodeCustomStyle,
  Scope,
  UtilityType
} from '../features/editor/types';

import type {
  GitSlice,
  GitFileStatus,
  GitLogEntry,
  GitCommitFile,
  GitAuthor,
  GitStashEntry,
  GitProfile,
  GitTag,
  CommitTemplate,
  GitPanelSection,
  GitPanelConfig,
  QuickCommand
} from '../features/git/types';

import type { PluginManifest } from '../features/extensions/types';
import type { RecentEnvironment } from '../features/explorer/types';
import type { Settings, SettingsConfig } from '../features/settings/types';
import type { ExecutionSlice, BenchmarkSlice } from '../features/execution/types';
import type { WorkspaceSlice } from '../features/workspace/types';

// Exporting types for backward compatibility or ease of use
export type {
  AppNode,
  AppNodeData,
  EdgeCustomStyle,
  NodeCustomStyle,
  Scope,
  UtilityType,
  GitSlice,
  GitFileStatus,
  GitLogEntry,
  GitCommitFile,
  GitAuthor,
  GitStashEntry,
  GitProfile,
  GitTag,
  CommitTemplate,
  GitPanelSection,
  GitPanelConfig,
  QuickCommand,
  PluginManifest,
  RecentEnvironment,
  Settings,
  SettingsConfig,
  ExecutionSlice,
  BenchmarkSlice,
  WorkspaceSlice
};

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  timestamp?: number;
}

export interface Notification extends Toast {
  read: boolean;
}

export interface AppState extends GitSlice, ExecutionSlice, BenchmarkSlice, WorkspaceSlice {
  code: string;
  nodes: AppNode[];
  edges: Edge[];
  connectionCache: Map<string, Edge[]>;
  theme: 'light' | 'dark';
  navigationStack: { id: string, label: string }[];
  activeScopeId: string; // 'root' by default

  // File System State
  openedFolder: string | null;
  selectedFile: string | null;
  autoSave: boolean;
  isDirty: boolean;
  projectFiles: Record<string, string>;


  toggleAutoSave: () => void;
  setDirty: (dirty: boolean) => void;

  addCanvasNode: () => void;
  setCode: (code: string, shouldSetDirty?: boolean, debounce?: boolean) => void;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  removeEdges: (edgeIds: string[]) => void;
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
  activeSidebarTab: 'explorer' | 'library' | 'git' | 'settings' | 'extensions' | 'search';
  showCode: boolean;
  showCanvas: boolean;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: (show?: boolean) => void;
  setSidebarTab: (tab: 'explorer' | 'library' | 'git' | 'settings' | 'extensions' | 'search') => void;
  toggleCode: () => void;
  toggleCanvas: () => void;

  // Scope Navigation Actions
  navigateInto: (scopeId: string, label: string) => void;
  navigateBack: () => void;
  navigateToScope: (index: number) => void;

  // Block Note Actions
  addNoteNode: () => void;
  addUtilityNode: (type: UtilityType) => void;
  checkTaskRecurse: (nodeId: string) => void;
  isBlockFile: boolean;

  // File System Actions
  setOpenedFolder: (path: string | null) => void;
  syncProjectFiles: () => Promise<void>;
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

  // Toast & Notification Actions
  toasts: Toast[];
  notifications: Notification[];
  unreadNotificationsCount: number;
  doNotDisturb: boolean;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearNotifications: () => void;
  markNotificationsAsRead: () => void;
  toggleDoNotDisturb: () => void;

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
  getEdgesForNode: (nodeId: string) => Edge[];
  spawnConnectedUtility: (sourceId: string, type: UtilityType, label: string, position: { x: number, y: number }, checked?: boolean) => void;
  spawnMultipleConnectedUtilities: (sourceId: string, utilities: { type: UtilityType, label: string, position: { x: number, y: number }, checked?: boolean }[]) => void;
}
