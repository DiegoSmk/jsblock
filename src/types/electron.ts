// Electron API types
export type ExecutionPayload =
  | { type: 'execution:log'; level: string; args: unknown[] }
  | { type: 'execution:value'; line: number; value: string; valueType?: 'spy' | 'log' }
  | { type: 'execution:coverage'; line: number }
  | { level: 'data'; args: ['canvasData', unknown] };

export interface ElectronAPI {
  // File operations
  openFile: () => Promise<{ filePath: string; content: string } | null>;
  saveFile: (filePath: string, content: string) => Promise<void>;
  saveFileAs: (content: string) => Promise<string | null>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;

  // Directory operations
  openDirectory: () => Promise<string | null>;
  selectFolder: () => Promise<string | null>;
  readDir: (dirPath: string) => Promise<unknown[]>;
  createDirectory: (dirPath: string) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  deleteDirectory: (dirPath: string) => Promise<void>;
  checkPathExists: (path: string) => Promise<boolean>;
  moveFile: (sourcePath: string, targetPath: string) => Promise<void>;
  ensureProjectConfig: (path: string) => Promise<void>;

  // Git operations
  gitCommand: (dirPath: string, args: string[]) => Promise<{ stdout: string; stderr: string }>;

  // Terminal
  terminalCreate: (options: { cwd: string }) => void;
  terminalSendInput: (data: string) => void;
  terminalOnData: (callback: (data: string) => void) => () => void;
  terminalResize: (cols: number, rows: number) => void;
  terminalKill: () => void;
  openSystemTerminal: (path: string) => Promise<void>;

  // System operations
  showItemInFolder: (filePath: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;

  // Window operations
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;

  // App lifecycle
  appReady: () => void;

  // Plugins
  discoverPlugins: () => Promise<PluginManifest[]>;
  togglePlugin: (id: string, enabled: boolean) => Promise<boolean>;
  installPlugin: () => Promise<PluginManifest>;
  uninstallPlugin: (id: string) => Promise<boolean>;
  onPluginNotification: (callback: (data: { message: string }) => void) => () => void;

  // Execution
  executionStart: (code: string, filePath?: string) => void;
  executionStop: () => void;
  onExecutionLog: (callback: (data: ExecutionPayload) => void) => () => void;
  onExecutionError: (callback: (error: string | { line: number; message: string }) => void) => () => void;
  mcpSyncState: (state: unknown) => void;

  // Environment (if needed, but not in preload.ts currently)
  getEnvironmentInfo?: () => Promise<{
    platform: string;
    arch: string;
    nodeVersion: string;
    electronVersion: string;
  }>;
}

import type { PluginManifest } from './store';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export { };