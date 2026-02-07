import { BrowserWindow, app } from 'electron';
import path from 'path';

export type WindowType = 'terminal' | 'search' | 'execution' | 'debug';

export interface WindowOptions {
    width?: number;
    height?: number;
    title?: string;
    payload?: any;
}

export class WindowManager {
    private windows: Map<string, BrowserWindow> = new Map();
    private mainWindow: BrowserWindow | null = null;

    setMainWindow(win: BrowserWindow) {
        this.mainWindow = win;
    }

    openWindow(type: WindowType, options: WindowOptions = {}) {
        const windowId = `window-${type}-${Date.now()}`;

        const win = new BrowserWindow({
            width: options.width || 800,
            height: options.height || 600,
            title: options.title || `JS Blueprints - ${type.toUpperCase()}`,
            transparent: true,
            backgroundColor: '#00000000',
            frame: false,
            autoHideMenuBar: true,
            hasShadow: true,
            webPreferences: {
                preload: path.join(__dirname, '../preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            },
        });

        win.setMenuBarVisibility(false); // Extra guarantee for Linux/Windows

        const queryParams = new URLSearchParams({
            mode: 'window',
            type: type,
            ...(options.payload ? { payload: JSON.stringify(options.payload) } : {})
        }).toString();

        if (app.isPackaged) {
            void win.loadFile(path.join(__dirname, '../index.html'), { query: { mode: 'window', type } });
        } else {
            // Try multiple ports in dev mode
            const tryLoad = async (port: number) => {
                try {
                    await win.loadURL(`http://localhost:${port}/?${queryParams}`);
                    return true;
                } catch (e) {
                    return false;
                }
            };

            void (async () => {
                if (await tryLoad(5173)) return;
                await tryLoad(5174);
            })();
        }

        win.on('closed', () => {
            this.windows.delete(windowId);
        });

        this.windows.set(windowId, win);
        return windowId;
    }

    closeAllWindows() {
        this.windows.forEach(win => {
            if (!win.isDestroyed()) win.close();
        });
        this.windows.clear();
    }
}

export const windowManager = new WindowManager();
