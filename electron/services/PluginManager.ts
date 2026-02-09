import { app, utilityProcess, UtilityProcess, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    entry: string;
    permissions?: string[];
    enabled?: boolean; // UI state
}

interface PluginConfig {
    disabledPlugins: string[];
}

export class PluginManager {
    private plugins = new Map<string, PluginManifest>();
    private worker: UtilityProcess | null = null;
    private pluginsPath: string;
    private configPath: string;
    private mainWindow: BrowserWindow | null = null;

    constructor() {
        this.pluginsPath = path.join(app.getPath('userData'), 'plugins');
        this.configPath = path.join(this.pluginsPath, 'config.json');
        this.ensurePluginsDirectory();
    }

    public setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
    }

    private ensurePluginsDirectory() {
        if (!fs.existsSync(this.pluginsPath)) {
            fs.mkdirSync(this.pluginsPath, { recursive: true });
        }
    }

    public async discoverPlugins(): Promise<PluginManifest[]> {
        try {
            const folders = (await fs.promises.readdir(this.pluginsPath, { withFileTypes: true }))
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            this.plugins.clear();
            const config = this.readConfig();

            await Promise.all(folders.map(async (folder) => {
                const manifestPath = path.join(this.pluginsPath, folder, 'plugin.json');
                try {
                    await fs.promises.access(manifestPath);
                    const manifestContent = await fs.promises.readFile(manifestPath, 'utf8');
                    const manifest = JSON.parse(manifestContent) as PluginManifest;
                    manifest.enabled = !config.disabledPlugins.includes(manifest.id);
                    this.plugins.set(manifest.id, manifest);
                } catch {
                    // Ignore folders without plugin.json or failed reads
                }
            }));
        } catch (err) {
            console.error('Failed to discover plugins:', err);
        }
        return Array.from(this.plugins.values());
    }

    private readConfig(): PluginConfig {
        if (fs.existsSync(this.configPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8')) as PluginConfig;
            } catch {
                return { disabledPlugins: [] };
            }
        }
        return { disabledPlugins: [] };
    }

    private saveConfig(config: PluginConfig) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }

    public togglePlugin(id: string, enabled: boolean) {
        const config = this.readConfig();
        if (enabled) {
            config.disabledPlugins = config.disabledPlugins.filter(p => p !== id);
        } else {
            if (!config.disabledPlugins.includes(id)) {
                config.disabledPlugins.push(id);
            }
        }
        this.saveConfig(config);

        // Update local state
        const plugin = this.plugins.get(id);
        if (plugin) plugin.enabled = enabled;

        // Notify host (requires restart for full effect, but we notify)
        this.broadcast('plugin:state-changed', { id, enabled });
    }

    public async installPlugin(sourcePath: string): Promise<PluginManifest> {
        const tempManifestPath = path.join(sourcePath, 'plugin.json');
        try {
            await fs.promises.access(tempManifestPath);
        } catch {
            throw new Error('Invalid plugin: plugin.json not found');
        }

        const manifestContent = await fs.promises.readFile(tempManifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent) as PluginManifest;
        const targetDir = path.join(this.pluginsPath, manifest.id);

        try {
            await fs.promises.access(targetDir);
            // Update/Overwrites
            await fs.promises.rm(targetDir, { recursive: true, force: true });
        } catch {
            // Target directory doesn't exist, which is fine
        }

        // Recursive copy using fs.promises
        const copyDirAuto = async (src: string, dest: string) => {
            await fs.promises.mkdir(dest, { recursive: true });
            const entries = await fs.promises.readdir(src, { withFileTypes: true });

            await Promise.all(entries.map(async (entry) => {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                if (entry.isDirectory()) {
                    await copyDirAuto(srcPath, destPath);
                } else {
                    await fs.promises.copyFile(srcPath, destPath);
                }
            }));
        };

        await copyDirAuto(sourcePath, targetDir);
        manifest.enabled = true;
        this.plugins.set(manifest.id, manifest);
        return manifest;
    }

    public uninstallPlugin(id: string) {
        const targetDir = path.join(this.pluginsPath, id);
        if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
        }
        this.plugins.delete(id);

        // Cleanup config
        const config = this.readConfig();
        config.disabledPlugins = config.disabledPlugins.filter(p => p !== id);
        this.saveConfig(config);
    }

    public startExtensionHost() {
        if (this.worker) return;

        const workerPath = path.join(__dirname, '../workers/extensionHost.js');
        const activePlugins = Array.from(this.plugins.values()).filter(p => p.enabled);

        this.worker = utilityProcess.fork(workerPath, [], {
            stdio: 'inherit',
            execArgv: ['--enable-source-maps']
        });

        this.worker.on('spawn', () => {
            console.warn('Plugin Extension Host started (UtilityProcess)');
            this.worker?.postMessage({
                type: 'init',
                plugins: activePlugins,
                basePath: this.pluginsPath
            });
        });

        this.worker.on('message', (msg) => {
            this.handleWorkerMessage(msg as { type: string; data: { message: string } });
        });

        this.worker.on('exit', (code) => {
            console.warn(`Plugin Extension Host exited with code ${code}`);
            this.worker = null;
        });
    }

    private handleWorkerMessage(msg: { type: string; data: { message: string } }) {
        if (msg.type === 'ui:notification' && this.mainWindow) {
            this.mainWindow.webContents.send('plugin:notification', msg.data);
        }
    }

    public broadcast(type: string, data: unknown) {
        this.worker?.postMessage({ type, data });
    }
}
