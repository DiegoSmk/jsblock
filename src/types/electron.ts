// Electron API types
import type {
  ExecutionPayload,
  ExecutionError,
  BenchmarkResult,
  SearchOptions,
  SearchResult,
  FileNode
} from '../../electron/shared/ipc-types';

export type { ExecutionPayload, ExecutionError, BenchmarkResult, SearchOptions, SearchResult, FileNode };

export interface ElectronAPI {
  // Dialogs & Window
  selectFolder: () => Promise<string | null>;
  openSystemTerminal: (path: string) => Promise<void>;

  // Window operations
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  windowToggleAlwaysOnTop: () => Promise<boolean>;
  appReady: () => void;
  openWindow: (type: string, options?: { width?: number; height?: number; title?: string; alwaysOnTop?: boolean; payload?: unknown; singleton?: boolean }) => Promise<string>;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;

  // File System API (Unified)
  fileSystem: {
    readDir: (path: string) => Promise<{ name: string; isDirectory: boolean; path: string }[]>;
    readFile: (path: string) => Promise<string>;
    readFiles: (paths: string[]) => Promise<Record<string, string>>;
    writeFile: (path: string, content: string) => Promise<void>;
    createFile: (path: string, content?: string) => Promise<void>;
    createDirectory: (path: string) => Promise<boolean>;
    delete: (path: string) => Promise<boolean>;
    move: (source: string, target: string) => Promise<boolean>; // ensure target includes filename if needed, or update consumers
    checkExists: (path: string) => Promise<boolean>;
    checkPathsExists: (paths: string[]) => Promise<Record<string, boolean>>;
    getStats: (path: string) => Promise<{ size: number; mtime: number; isDirectory: boolean }>;
    ensureProjectConfig: (path: string) => Promise<void>;
  };

  // Git operations
  gitCommand: (dirPath: string, args: string[]) => Promise<{ stdout: string; stderr: string }>;

  // Terminal
  terminalCreate: (options: { cwd: string }) => void;
  terminalSendInput: (data: string) => void;
  terminalOnData: (callback: (data: string) => void) => () => void;
  terminalResize: (cols: number, rows: number) => void;
  terminalKill: () => void;

  // Plugins
  discoverPlugins: () => Promise<PluginManifest[]>;
  togglePlugin: (id: string, enabled: boolean) => Promise<boolean>;
  installPlugin: () => Promise<PluginManifest>;
  uninstallPlugin: (id: string) => Promise<boolean>;
  onPluginNotification: (callback: (data: { message: string }) => void) => () => void;

  // Execution
  executionStart: (code: string, filePath?: string) => void;
  executionStop: () => void;
  executionCheckAvailability: () => Promise<Record<'node' | 'bun' | 'deno', boolean>>;
  executionSetRuntime: (runtime: 'node' | 'bun' | 'deno') => void;
  benchmarkStart: (code: string, line: number, filePath?: string) => void;
  onBenchmarkResult: (callback: (results: BenchmarkResult[]) => void) => () => void;
  onExecutionLog: (callback: (data: ExecutionPayload) => void) => () => void;
  onExecutionError: (callback: (error: ExecutionError | string) => void) => () => void;
  onExecutionClear: (callback: () => void) => () => void;
  onExecutionStarted: (callback: () => void) => () => void;
  onExecutionDone: (callback: () => void) => () => void;
  onSystemStats: (callback: (data: { cpu: number }) => void) => () => void;
  mcpSyncState: (state: unknown) => void;

  workspace: {
    openFolder: () => Promise<{ path: string; tree: FileNode[] } | null>;
    getTree: (path: string) => Promise<FileNode[]>;
    onUpdated: (callback: (data: { event: string; path: string; tree: FileNode[] }) => void) => () => void;
    search: (query: string, rootPath: string, options: SearchOptions) => Promise<SearchResult[]>;
    replace: (query: string, replacement: string, rootPath: string, options: SearchOptions) => Promise<void>;
  };
}

import type { PluginManifest } from '../features/extensions/types';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export { };