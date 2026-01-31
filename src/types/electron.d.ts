export interface ElectronAPI {
    selectFolder: () => Promise<string | null>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    checkPathExists: (path: string) => Promise<boolean>;
    gitCommand: (cwd: string, args: string[]) => Promise<{ stdout: string; stderr: string }>;
    appReady: () => void;
    windowMinimize: () => void;
    windowMaximize: () => void;
    windowClose: () => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
