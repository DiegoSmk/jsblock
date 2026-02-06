// Electron API types
// Electron API types
export type ExecutionPayload =
  | { type: 'execution:log'; level: string; args: unknown[] }
  | { type: 'execution:value'; line: number; value: string; valueType?: 'spy' | 'log' }
  | { type: 'execution:coverage'; line: number }
  | { type: 'execution:started' }
  | { level: 'data'; args: ['canvasData', unknown] };

export interface ExecutionError {
  message: string;
  line: number;
  column?: number;
  errorCode?: string;
  suggestion?: {
    text: string;
    replace: string;
  };
}

export interface ElectronAPI {
  // Dialogs & Window
  selectFolder: () => Promise<string | null>;
  openSystemTerminal: (path: string) => Promise<void>;

  // Window operations
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  appReady: () => void;

  // File System API (Unified)
  fileSystem: {
    readDir: (path: string) => Promise<{ name: string; isDirectory: boolean; path: string }[]>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    createFile: (path: string, content?: string) => Promise<void>;
    createDirectory: (path: string) => Promise<boolean>;
    delete: (path: string) => Promise<boolean>;
    move: (source: string, target: string) => Promise<boolean>; // ensure target includes filename if needed, or update consumers
    checkExists: (path: string) => Promise<boolean>;
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
}

import type { PluginManifest } from '../features/extensions/types';
import type { BenchmarkResult } from '../features/execution/types';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export { };