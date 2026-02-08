import { BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';

export type WindowType = 'terminal' | 'search' | 'execution' | 'debug' | 'git-diff';

export interface WindowOptions {
    width?: number;
    height?: number;
    title?: string;
    alwaysOnTop?: boolean;
    payload?: unknown;
    singleton?: boolean;
}

export class WindowManager {
    private windows = new Map<string, BrowserWindow>();
    private singletonWindows = new Map<WindowType, string>();
    private mainWindow: BrowserWindow | null = null;
    private windowStates: Record<string, { x: number, y: number, width: number, height: number }> = {};
    private readonly statesFilePath: string;

    constructor() {
        this.statesFilePath = path.join(app.getPath('userData'), 'window-states.json');
        this.loadStates();
    }

    private loadStates() {
        try {
            if (fs.existsSync(this.statesFilePath)) {
                const data = fs.readFileSync(this.statesFilePath, 'utf-8');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                this.windowStates = JSON.parse(data);
            }
        } catch (err) {
            console.error('Failed to load window states:', err);
        }
    }

    private saveStates() {
        try {
            fs.writeFileSync(this.statesFilePath, JSON.stringify(this.windowStates, null, 2));
        } catch (err) {
            console.error('Failed to save window states:', err);
        }
    }

    setMainWindow(win: BrowserWindow) {
        this.mainWindow = win;
    }

    openWindow(type: WindowType, options: WindowOptions = {}) {
        // Handle singleton logic
        if (options.singleton) {
            const existingId = this.singletonWindows.get(type);
            if (existingId) {
                const existingWin = this.windows.get(existingId);
                if (existingWin && !existingWin.isDestroyed()) {
                    existingWin.webContents.send('window-update-payload', options.payload);
                    existingWin.focus();
                    return existingId;
                }
            }
        }

        const windowId = `window-${type}-${Date.now()}`;
        const stateKey = `window-state-${type}`;
        const lastState = this.windowStates[stateKey];

        const win = new BrowserWindow({
            width: lastState?.width ?? options.width ?? 800,
            height: lastState?.height ?? options.height ?? 600,
            x: lastState?.x, // Will be undefined if no state, letting Electron center it
            y: lastState?.y,
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            parent: this.mainWindow || undefined,
            title: options.title ?? `JS Blueprints - ${type.toUpperCase()}`,
            transparent: true,
            backgroundColor: '#00000000',
            alwaysOnTop: options.alwaysOnTop ?? false,
            frame: false,
            autoHideMenuBar: true,
            hasShadow: true,
            webPreferences: {
                preload: path.join(__dirname, '../preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            },
        });

        win.setMenuBarVisibility(false);

        const queryParams = new URLSearchParams({
            mode: 'window',
            type: type,
            ...(options.payload ? { payload: JSON.stringify(options.payload) } : {})
        }).toString();

        if (app.isPackaged) {
            void win.loadFile(path.join(__dirname, '../index.html'), {
                query: Object.fromEntries(new URLSearchParams(queryParams)),
                hash: '?' + queryParams
            });
        } else {
            const tryLoad = async (port: number) => {
                try {
                    await win.loadURL(`http://localhost:${port}/?${queryParams}`);
                    return true;
                } catch {
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
            if (options.singleton) {
                this.singletonWindows.delete(type);
            }
        });

        // Window state persistence
        win.on('close', () => {
            if (!win.isDestroyed()) {
                const bounds = win.getBounds();
                this.windowStates[stateKey] = {
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height
                };
                this.saveStates();
            }
        });

        this.windows.set(windowId, win);
        if (options.singleton) {
            this.singletonWindows.set(type, windowId);
        }
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
