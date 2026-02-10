
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
import type { ConfigSlice } from '../store/slices/configSlice';
import type { FlowSlice } from '../store/slices/flowSlice';
import type { UISlice } from '../store/slices/uiSlice';
import type { FileSlice } from '../store/slices/fileSlice';
import type { ExtensionSlice } from '../store/slices/extensionSlice';
import type { ActionSlice } from '../store/slices/actionSlice';

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

export interface AppState extends GitSlice, ExecutionSlice, BenchmarkSlice, WorkspaceSlice, ConfigSlice, FlowSlice, UISlice, FileSlice, ExtensionSlice, ActionSlice {
  // Any specific combined state if necessary
}
