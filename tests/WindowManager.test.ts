
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
    return {
        loadFile: vi.fn(),
        loadURL: vi.fn(),
        on: vi.fn(),
        setMenuBarVisibility: vi.fn(),
        getBounds: vi.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
        focus: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        webContentsSend: vi.fn(),
        appGetPath: vi.fn().mockReturnValue('/mock/user/data'),
        appIsPackaged: { value: false } // Wrap in object to mutate
    };
});

vi.mock('electron', () => {
    const BrowserWindow = vi.fn().mockImplementation(() => ({
        loadFile: mocks.loadFile,
        loadURL: mocks.loadURL,
        on: mocks.on,
        setMenuBarVisibility: mocks.setMenuBarVisibility,
        getBounds: mocks.getBounds,
        focus: mocks.focus,
        isDestroyed: mocks.isDestroyed,
        webContents: {
            send: mocks.webContentsSend
        }
    }));

    return {
        BrowserWindow,
        app: {
            getPath: mocks.appGetPath,
            get isPackaged() { return mocks.appIsPackaged.value; }
        }
    };
});

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn().mockReturnValue(false),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn()
    }
}));

// Now import
import { WindowManager } from '../electron/services/WindowManager';

describe('WindowManager', () => {
    let windowManager: WindowManager;

    beforeEach(() => {
        vi.clearAllMocks();
        windowManager = new WindowManager();
        mocks.appIsPackaged.value = false;
    });

    it('should open a window with loadFile and hash in packaged mode', () => {
        // Simulate packaged mode
        mocks.appIsPackaged.value = true;

        const payload = { some: 'data' };
        windowManager.openWindow('git-diff', { payload });

        // Check calls
        expect(mocks.loadFile).toHaveBeenCalled();

        const callArgs = mocks.loadFile.mock.calls[0];
        const filePath = callArgs[0] as string;
        const options = callArgs[1] as { query?: Record<string, string>; hash?: string };

        expect(filePath).toContain('index.html');
        expect(options).toHaveProperty('query');

        const query = options.query!;
        expect(query).toMatchObject({
            mode: 'window',
            type: 'git-diff'
        });

        // Payload should be encoded in query
        expect(query.payload).toBeDefined();
        expect(JSON.parse(query.payload)).toEqual(payload);
    });
});
