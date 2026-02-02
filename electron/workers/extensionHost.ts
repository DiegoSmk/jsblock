import fs from 'fs';
import path from 'path';

/**
 * Extension Host Worker
 * This process runs in a UtilityProcess (Electron) or Node process.
 * It is isolated from the Main and Renderer processes.
 */

interface PluginManifest {
    id: string;
    name: string;
    version: string;
    entry: string;
}

class ExtensionHost {
    private plugins = new Map<string, unknown>();
    private api: unknown;

    constructor() {
        this.setupAPI();
        this.setupListeners();
    }

    private setupAPI() {
        // This is the restricted API exposed to plugins
        this.api = {
            notifications: {
                show: (message: string) => {
                    this.sendToMain('ui:notification', { message });
                }
            },
            workspace: {
                // Future: add restricted workspace access
            }
        };

        // Define global JSBlock object for plugins
        (global as unknown as { JSBlock: unknown }).JSBlock = this.api;
    }

    private setupListeners() {
        process.on('message', (msg: { type: string; plugins: PluginManifest[]; basePath: string }) => {
            if (msg.type === 'init') {
                this.loadPlugins(msg.plugins, msg.basePath);
            }
        });
    }

    private loadPlugins(pluginManifests: PluginManifest[], basePath: string) {
        console.warn(`[ExtensionHost] Loading ${pluginManifests.length} plugins...`);

        for (const manifest of pluginManifests) {
            const pluginDir = path.join(basePath, manifest.id);
            const entryPoint = path.join(pluginDir, manifest.entry);

            if (fs.existsSync(entryPoint)) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const plugin = require(entryPoint) as { activate?: (api: unknown) => void };
                    if (plugin && typeof plugin.activate === 'function') {
                        plugin.activate(this.api);
                        this.plugins.set(manifest.id, plugin);
                        console.warn(`[ExtensionHost] Plugin "${manifest.name}" activated.`);
                    }
                } catch (e) {
                    console.error(`[ExtensionHost] Error loading plugin ${manifest.id}:`, e);
                }
            }
        }
    }

    private sendToMain(type: string, data: unknown) {
        if (process.send) {
            process.send({ type, data });
        }
    }
}

new ExtensionHost();
