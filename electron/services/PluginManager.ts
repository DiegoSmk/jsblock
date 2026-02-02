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

    public discoverPlugins(): PluginManifest[] {
        const folders = fs.readdirSync(this.pluginsPath).filter(f =>
            fs.statSync(path.join(this.pluginsPath, f)).isDirectory()
        );
        this.plugins.clear();

        const config = this.readConfig();

        for (const folder of folders) {
            const manifestPath = path.join(this.pluginsPath, folder, 'plugin.json');
            if (fs.existsSync(manifestPath)) {
                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PluginManifest;
                    manifest.enabled = !config.disabledPlugins.includes(manifest.id);
                    this.plugins.set(manifest.id, manifest);
                } catch (e) {
                    console.error(`Failed to load plugin manifest at ${manifestPath}:`, e);
                }
            }
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

    public installPlugin(sourcePath: string): PluginManifest {
        const tempManifestPath = path.join(sourcePath, 'plugin.json');
        if (!fs.existsSync(tempManifestPath)) {
            throw new Error('Invalid plugin: plugin.json not found');
        }

        const manifest = JSON.parse(fs.readFileSync(tempManifestPath, 'utf8')) as PluginManifest;
        const targetDir = path.join(this.pluginsPath, manifest.id);

        if (fs.existsSync(targetDir)) {
            // Update/Overwrites
            fs.rmSync(targetDir, { recursive: true, force: true });
        }

        // Recursive copy
        const copyDir = (src: string, dest: string) => {
            fs.mkdirSync(dest, { recursive: true });
            const entries = fs.readdirSync(src, { withFileTypes: true });
            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                if (entry.isDirectory()) {
                    copyDir(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        };

        copyDir(sourcePath, targetDir);
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
