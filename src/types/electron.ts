// Electron API types
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
  readDir: (dirPath: string) => Promise<any[]>;
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

  // Environment (if needed, but not in preload.ts currently)
  getEnvironmentInfo?: () => Promise<{
    platform: string;
    arch: string;
    nodeVersion: string;
    electronVersion: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export { };