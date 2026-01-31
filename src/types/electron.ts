// Electron API types
export interface ElectronAPI {
  // File operations
  openFile: () => Promise<{ filePath: string; content: string } | null>;
  saveFile: (filePath: string, content: string) => Promise<void>;
  saveFileAs: (content: string) => Promise<string | null>;
  
  // Directory operations
  openDirectory: () => Promise<string | null>;
  selectFolder: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<string[]>;
  createFile: (filePath: string, content: string) => Promise<void>;
  createDirectory: (dirPath: string) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  deleteDirectory: (dirPath: string) => Promise<void>;
  
  // Git operations
  executeGitCommand: (command: string, cwd?: string) => Promise<{ stdout: string; stderr: string }>;
  
  // System operations
  showItemInFolder: (filePath: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  
  // Window operations
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  
  // App lifecycle
  appReady: () => Promise<void>;
  
  // Environment
  getEnvironmentInfo: () => Promise<{
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

export {};