import { create } from 'zustand';
import type {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
} from '@xyflow/react';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';

import type {
    AppNodeData,
    AppNode,
    RecentEnvironment,
    AppState,
    Toast,
    Settings,
    SettingsConfig
} from '../types/store';

// import { v4 as uuidv4 } from 'uuid'; // Removed to avoid dependency check
const getUUID = (prefix = 'id') => {
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
    return `${prefix}-${uuid}`;
};

import { parseCodeToFlow } from '../features/editor/logic/CodeParser';
import { generateCodeFromFlow } from '../features/editor/logic/CodeGenerator';
import { getLayoutedElements } from '../features/editor/logic/layout';
import i18n from '../i18n/config';
import { createGitSlice } from '../features/git/store/slice';
import { createExecutionSlice } from '../features/execution/store/executionSlice';
import { createBenchmarkSlice } from '../features/execution/store/benchmarkSlice';
import { createWorkspaceSlice } from '../features/workspace/store/workspaceSlice';
import { getUtilityDefinition, type UtilityType } from '../registry/utilities';
import { validateConnection } from '../features/editor/logic/connectionLogic';

const initialCode = '';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let saveLayoutTimeout: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<AppState>((set, get, api) => ({
    ...createGitSlice(set, get, api),
    ...createExecutionSlice(set, get, api),
    ...createBenchmarkSlice(set, get, api),
    ...createWorkspaceSlice(set, get, api),

    code: initialCode,
    nodes: [],
    edges: [],
    theme: (() => {
        try {
            const saved = localStorage.getItem('settings.json');
            if (saved) {
                const parsed = JSON.parse(saved) as SettingsConfig;
                const theme = parsed.appearance?.theme;
                if (theme === 'dark' || theme === 'light') return theme;
            }
        } catch { /* Handle missing or corrupt theme settings */ }
        return 'dark' as 'dark' | 'light';
    })(),
    toasts: [],
    notifications: [],
    unreadNotificationsCount: 0,
    doNotDisturb: false,
    projectFiles: {},
    connectionCache: new Map(), // Initialize cache
    navigationStack: [{ id: 'root', label: 'Main' }],
    activeScopeId: 'root',
    plugins: [],
    selectedPluginId: null,
    // Settings Configuration
    settingsConfig: (() => {
        const defaults = {
            appearance: { theme: 'dark', showAppBorder: false },
            layout: { sidebar: { width: 260 } },
            editor: { fontSize: 14, autoLayoutNodes: false },
            terminal: { copyOnSelect: true, rightClickPaste: true },
            files: { autoSave: false }
        };
        const saved = localStorage.getItem('settings.json');
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as SettingsConfig;
                // Migration Logic for Sidebar
                const sb = parsed.layout?.sidebar as Record<string, unknown> | undefined;
                if (parsed.layout && sb && (sb.vanilla || sb.git)) {
                    // Legacy structure detected, migrate to simple width
                    parsed.layout.sidebar = { width: 260 };
                    return JSON.stringify(parsed, null, 2);
                }
                return saved;
            } catch {
                return JSON.stringify(defaults, null, 2);
            }
        }
        return JSON.stringify(defaults, null, 2);
    })(),

    updateSettingsConfig: (json: string) => {
        localStorage.setItem('settings.json', json);
        set({ settingsConfig: json });

        try {
            const parsed = JSON.parse(json) as SettingsConfig;

            // Sync all states from parsed JSON
            if (parsed.appearance?.theme) {
                set({ theme: parsed.appearance.theme });
            }
            if (parsed.layout?.sidebar?.width) {
                const width = parsed.layout.sidebar.width;
                set((state) => ({
                    layout: { ...state.layout, sidebar: { ...state.layout.sidebar, width } }
                }));
            }
            if (parsed.files?.autoSave !== undefined) {
                set({ autoSave: parsed.files.autoSave });
            }

            // Sync settings object
            const newSettings = { ...get().settings };
            if (parsed.editor?.fontSize !== undefined) newSettings.fontSize = parsed.editor.fontSize;
            if (parsed.editor?.autoLayoutNodes !== undefined) newSettings.autoLayoutNodes = parsed.editor.autoLayoutNodes;
            if (parsed.terminal?.copyOnSelect !== undefined) newSettings.terminalCopyOnSelect = parsed.terminal.copyOnSelect;
            if (parsed.terminal?.rightClickPaste !== undefined) newSettings.terminalRightClickPaste = parsed.terminal.rightClickPaste;
            if (parsed.appearance?.showAppBorder !== undefined) newSettings.showAppBorder = parsed.appearance.showAppBorder;

            set({ settings: newSettings });
        } catch {
            // Silently ignore parse errors while typing
        }
    },

    // Runtime Layout (Session Only)
    layout: (() => {
        let width = 260;
        try {
            const savedSettings = localStorage.getItem('settings.json');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings) as SettingsConfig;
                // Handle legacy or new format
                const sb = parsed.layout?.sidebar;
                if (typeof sb === 'number') width = sb;
                else if (typeof sb?.width === 'number') width = sb.width;
            }
        } catch { /* Ignore missing or corrupt layout settings */ }
        return {
            sidebar: {
                width: Math.max(200, Math.min(800, width)),
                isVisible: true
            }
        };
    })(),

    setSidebarWidth: (width: number) => {
        const newWidth = Math.max(200, Math.min(800, Math.round(width)));
        set((state) => ({
            layout: { ...state.layout, sidebar: { ...state.layout.sidebar, width: newWidth } }
        }));

        // Debounced Save
        if (saveLayoutTimeout) clearTimeout(saveLayoutTimeout);
        saveLayoutTimeout = setTimeout(() => {
            try {
                const parsed = JSON.parse(get().settingsConfig) as SettingsConfig;
                parsed.layout ??= {};
                parsed.layout.sidebar ??= {};
                parsed.layout.sidebar.width = newWidth;

                const newJson = JSON.stringify(parsed, null, 2);
                localStorage.setItem('settings.json', newJson);
                set({ settingsConfig: newJson });
            } catch (e) {
                console.error('Failed to sync sidebar width', e);
            }
        }, 500);
    },
    confirmationModal: null,

    activeSidebarTab: 'explorer',
    showCode: true,
    showCanvas: true,
    isBlockFile: false,
    openedFolder: null,

    settings: (() => {
        const defaultSettings = {
            terminalCopyOnSelect: true,
            terminalRightClickPaste: true,
            autoLayoutNodes: false,
            fontSize: 14,
            showAppBorder: false,
            showDebugHandles: false
        };
        try {
            const saved = localStorage.getItem('settings.json');
            if (saved) {
                const parsed = JSON.parse(saved) as SettingsConfig;
                return {
                    terminalCopyOnSelect: parsed.terminal?.copyOnSelect ?? defaultSettings.terminalCopyOnSelect,
                    terminalRightClickPaste: parsed.terminal?.rightClickPaste ?? defaultSettings.terminalRightClickPaste,
                    autoLayoutNodes: parsed.editor?.autoLayoutNodes ?? defaultSettings.autoLayoutNodes,
                    fontSize: parsed.editor?.fontSize ?? defaultSettings.fontSize,
                    showAppBorder: parsed.appearance?.showAppBorder ?? false,
                    showDebugHandles: parsed.developer?.showDebugHandles ?? defaultSettings.showDebugHandles
                };
            }
        } catch { /* Ignore missing or corrupt settings */ }
        return defaultSettings;
    })(),

    updateSettings: (updates: Partial<Settings>) => {
        const current = get().settings;
        const newSettings = { ...current, ...updates };
        set({ settings: newSettings });

        // Sync to JSON
        try {
            const parsed = JSON.parse(get().settingsConfig) as SettingsConfig;
            parsed.editor ??= {};
            parsed.terminal ??= {};
            parsed.appearance ??= {};

            if (updates.fontSize !== undefined) parsed.editor.fontSize = updates.fontSize;
            if (updates.autoLayoutNodes !== undefined) parsed.editor.autoLayoutNodes = updates.autoLayoutNodes;
            if (updates.terminalCopyOnSelect !== undefined) parsed.terminal.copyOnSelect = updates.terminalCopyOnSelect;
            if (updates.terminalRightClickPaste !== undefined) parsed.terminal.rightClickPaste = updates.terminalRightClickPaste;
            if (updates.showAppBorder !== undefined) parsed.appearance.showAppBorder = updates.showAppBorder;

            // Developer Settings
            parsed.developer ??= {};
            if (updates.showDebugHandles !== undefined) parsed.developer.showDebugHandles = updates.showDebugHandles;

            const newJson = JSON.stringify(parsed, null, 2);
            localStorage.setItem('settings.json', newJson);
            set({ settingsConfig: newJson });
        } catch (e) {
            console.error('Failed to sync settings', e);
        }
    },

    selectedFile: null,
    autoSave: (() => {
        try {
            const saved = localStorage.getItem('settings.json');
            if (saved) {
                const parsed = JSON.parse(saved) as SettingsConfig;
                return parsed.files?.autoSave ?? false;
            }
        } catch { /* Default to no auto-save */ }
        return false;
    })(),
    isDirty: false,

    toggleAutoSave: () => {
        const newValue = !get().autoSave;
        set({ autoSave: newValue });

        // Sync to JSON
        try {
            const parsed = JSON.parse(get().settingsConfig) as SettingsConfig;
            parsed.files ??= {};
            parsed.files.autoSave = newValue;

            const newJson = JSON.stringify(parsed, null, 2);
            localStorage.setItem('settings.json', newJson);
            set({ settingsConfig: newJson });
        } catch (e) {
            console.error('Failed to sync autoSave', e);
        }
    },

    setDirty: (dirty: boolean) => set({ isDirty: dirty }),

    recentFiles: (JSON.parse(localStorage.getItem('recentFiles') ?? '[]') as string[]),

    addRecentFile: (path: string) => {
        const { recentFiles } = get();
        // Remove if exists to push to top
        const newRecents = [path, ...recentFiles.filter(f => f !== path)].slice(0, 20);
        localStorage.setItem('recentFiles', JSON.stringify(newRecents));
        set({ recentFiles: newRecents });
    },

    recentEnvironments: (JSON.parse(localStorage.getItem('recentEnvironments') ?? '[]') as RecentEnvironment[]),

    addRecent: async (path: string) => {
        const { recentEnvironments } = get();
        // Check if path exists using the new API
        if (window.electron) {
            const exists = await window.electron.fileSystem.checkExists(path);
            if (!exists) return;
        }

        const now = Date.now();
        const existingIndex = recentEnvironments.findIndex((r: RecentEnvironment) => r.path === path);

        const newRecents = [...recentEnvironments];
        if (existingIndex >= 0) {
            newRecents[existingIndex] = { ...newRecents[existingIndex], lastOpened: now };
        } else {
            newRecents.push({ path, lastOpened: now });
        }

        localStorage.setItem('recentEnvironments', JSON.stringify(newRecents));
        set({ recentEnvironments: newRecents });
    },

    removeRecent: (path: string) => {
        const newRecents = get().recentEnvironments.filter((r: RecentEnvironment) => r.path !== path);
        localStorage.setItem('recentEnvironments', JSON.stringify(newRecents));
        set({ recentEnvironments: newRecents });
    },

    toggleFavorite: (path: string) => {
        const newRecents = get().recentEnvironments.map((r: RecentEnvironment) =>
            r.path === path ? { ...r, isFavorite: !r.isFavorite } : r
        );
        localStorage.setItem('recentEnvironments', JSON.stringify(newRecents));
        set({ recentEnvironments: newRecents });
    },

    setRecentLabel: (path: string, label) => {
        const newRecents = get().recentEnvironments.map((r: RecentEnvironment) =>
            r.path === path ? { ...r, label } : r
        );
        localStorage.setItem('recentEnvironments', JSON.stringify(newRecents));
        set({ recentEnvironments: newRecents });
    },

    validateRecents: async () => {
        if (!window.electron) return;

        const { recentEnvironments } = get();
        const validRecents = [];

        for (const recent of recentEnvironments) {
            const exists = await window.electron.fileSystem.checkExists(recent.path);
            if (exists) {
                validRecents.push(recent);
            }
        }

        if (validRecents.length !== recentEnvironments.length) {
            localStorage.setItem('recentEnvironments', JSON.stringify(validRecents));
            set({ recentEnvironments: validRecents });
        }
    },
    addCanvasNode: () => {
        const { nodes, activeScopeId } = get();
        const newNode: AppNode = {
            id: getUUID('canvas'),
            type: 'canvasNode',
            position: { x: 100, y: 100 },
            data: {
                label: 'Canvas Viewer',
                scopeId: activeScopeId
            }
        };
        set({ nodes: [...nodes, newNode] });
    },
    toggleSidebar: (show?: boolean) => set((state) => ({
        layout: {
            ...state.layout,
            sidebar: {
                ...state.layout.sidebar,
                isVisible: show ?? !state.layout.sidebar.isVisible
            }
        }
    })),
    setSidebarTab: (tab) => set((state) => ({
        activeSidebarTab: tab,
        layout: {
            ...state.layout,
            sidebar: {
                ...state.layout.sidebar,
                isVisible: true
            }
        }
    })),
    toggleCode: () => {
        if (get().showCode && !get().showCanvas) return;
        set({ showCode: !get().showCode });
    },
    toggleCanvas: () => {
        if (get().showCanvas && !get().showCode) return;
        set({ showCanvas: !get().showCanvas });
    },
    modal: {
        isOpen: false,
        title: '',
        initialValue: '',
        type: '',
        payload: null,
        onSubmit: () => { /* no-op */ }
    },


    setCode: (code: string, shouldSetDirty = true, debounce = true) => {
        const { nodes, edges } = parseCodeToFlow(code);

        if (saveTimeout) clearTimeout(saveTimeout);

        if (shouldSetDirty) {
            if (get().autoSave) {
                saveTimeout = setTimeout(() => {
                    void get().saveFile();
                }, 1000);
            } else {
                set({ isDirty: true });
            }
        }



        const currentStack = get().navigationStack;
        const currentScopeId = get().activeScopeId;

        const layouted = getLayoutedElements(nodes, edges);
        const activeNodeExists = currentScopeId === 'root' || layouted.nodes.some(n => n.id === currentScopeId);

        // Pattern-based CanvasNode appearance: Check if canvasData is present in code
        const hasCanvasPattern = code.includes('canvasData');
        const hasCanvasNode = layouted.nodes.some(n => n.type === 'canvasNode');

        let finalNodes = layouted.nodes;
        if (hasCanvasPattern && !hasCanvasNode) {
            finalNodes = [
                ...layouted.nodes,
                {
                    id: 'pattern-canvas-node',
                    type: 'canvasNode',
                    position: { x: 500, y: 100 },
                    data: { label: 'Canvas Viewer', scopeId: 'root' }
                }
            ];
        }

        set({
            code,
            nodes: finalNodes,
            edges: layouted.edges,
            navigationStack: activeNodeExists ? currentStack : [{ id: 'root', label: 'Main' }],
            activeScopeId: activeNodeExists ? currentScopeId : 'root'
        });

        if (debounce) {
            get().runExecutionDebounced(code);
        } else {
            get().runExecution(code);
        }
    },

    onNodesChange: (changes: NodeChange<AppNode>[]) => {
        const nextNodes = applyNodeChanges(changes, get().nodes);

        // Optimistic update for connection cache if nodes are deleted
        const deletions = changes.filter(c => c.type === 'remove');
        if (deletions.length > 0) {
            const newCache = new Map(get().connectionCache);
            deletions.forEach(d => newCache.delete(d.id));

            // Also cleanup connected edges
            const deletedIds = new Set(deletions.map(d => d.id));
            const activeEdges = get().edges.filter(edge => !deletedIds.has(edge.source) && !deletedIds.has(edge.target));

            set({ nodes: nextNodes, edges: activeEdges, connectionCache: newCache });
        } else {
            set({ nodes: nextNodes });
        }
        if (get().isBlockFile) {
            if (get().autoSave) {
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    void get().saveFile();
                }, 1000);
            } else {
                set({ isDirty: true });
            }
        }
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        const { nodes, edges, code, isBlockFile, autoSave } = get();
        const newEdges = applyEdgeChanges(changes, edges);

        // Rebuild cache on edge changes (optimized for frequency)
        const newCache = new Map<string, Edge[]>();
        newEdges.forEach(edge => {
            const source = newCache.get(edge.source) ?? [];
            source.push(edge);
            newCache.set(edge.source, source);

            const target = newCache.get(edge.target) ?? [];
            target.push(edge);
            newCache.set(edge.target, target);
        });

        set({ edges: newEdges, connectionCache: newCache });

        if (isBlockFile) {
            if (autoSave) {
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    void get().saveFile();
                }, 1000);
            } else {
                set({ isDirty: true });
            }
        } else {
            const newCode = generateCodeFromFlow(code, nodes, newEdges);
            get().setCode(newCode);
        }
    },
    removeEdges: (edgeIds: string[]) => {
        const { nodes, edges, code, isBlockFile, autoSave } = get();
        const newEdges = edges.filter(e => !edgeIds.includes(e.id));

        // Rebuild cache
        const newCache = new Map<string, Edge[]>();
        newEdges.forEach(edge => {
            const source = newCache.get(edge.source) ?? [];
            source.push(edge);
            newCache.set(edge.source, source);

            const target = newCache.get(edge.target) ?? [];
            target.push(edge);
            newCache.set(edge.target, target);
        });

        set({ edges: newEdges, connectionCache: newCache });

        if (isBlockFile) {
            if (autoSave) {
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    void get().saveFile();
                }, 1000);
            } else {
                set({ isDirty: true });
            }
        } else {
            const newCode = generateCodeFromFlow(code, nodes, newEdges);
            get().setCode(newCode);
        }
    },

    onConnect: (connection: Connection) => {
        if (connection.source === connection.target) return;

        const { nodes, edges, code, isBlockFile, autoSave } = get();

        // Check Logic Domain
        if (!validateConnection(connection, nodes)) {
            return;
        }

        const newEdges = addEdge(connection, edges);
        set({ edges: newEdges });

        if (isBlockFile) {
            if (autoSave) void get().saveFile();
            else set({ isDirty: true });
        } else {
            const newCode = generateCodeFromFlow(code, nodes, newEdges);
            get().setCode(newCode);
        }
    },

    forceLayout: () => {
        const { nodes, edges } = get();
        const layouted = getLayoutedElements(nodes, edges);
        set({ nodes: [...layouted.nodes], edges: [...layouted.edges] });
    },

    toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: nextTheme });

        // Sync to JSON
        try {
            const parsed = JSON.parse(get().settingsConfig) as SettingsConfig;
            parsed.appearance ??= {};
            parsed.appearance.theme = nextTheme;

            const newJson = JSON.stringify(parsed, null, 2);
            localStorage.setItem('settings.json', newJson);
            set({ settingsConfig: newJson });
        } catch (e) {
            console.error('Failed to sync theme', e);
        }
    },

    updateNodeData: (nodeId: string, newData: Partial<AppNodeData>) => {
        set(state => {
            const { code, edges, isBlockFile, autoSave } = state;
            const updatedNodes = state.nodes.map((n: AppNode) =>
                n.id === nodeId ? { ...n, data: { ...n.data, ...newData, updatedAt: Date.now() } } : n
            );

            // Regenerate code if not a block file
            let finalCode = code;
            if (!isBlockFile) {
                finalCode = generateCodeFromFlow(code, updatedNodes, edges);
            }

            return {
                nodes: updatedNodes,
                code: finalCode,
                isDirty: isBlockFile ? !autoSave : state.isDirty
            };
        });

        // Side effects after state is updated
        const { isBlockFile, autoSave } = get();
        if (newData.checked !== undefined) {
            get().checkTaskRecurse(nodeId);
        }

        if (isBlockFile && autoSave) {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                void get().saveFile();
            }, 1000);
        }
    },

    updateEdge: (edgeId, updates) => {
        set(state => {
            const updatedEdges = state.edges.map(e => e.id === edgeId ? { ...e, ...updates } : e);
            return {
                edges: updatedEdges,
                isDirty: state.isBlockFile ? !state.autoSave : state.isDirty
            };
        });

        const { isBlockFile, autoSave } = get();
        if (isBlockFile && autoSave) {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                void get().saveFile();
            }, 1000);
        }
    },

    addFunctionCall: (funcName: string, args: string[] = []) => {
        const { code, setCode } = get();
        const placeholders = args.map(() => 'undefined').join(', ');
        const callCode = `\n${funcName}(${placeholders});`;
        setCode(code + callCode);
    },

    addLogicNode: () => {
        const { code, setCode } = get();
        const logicCode = `\nundefined == undefined;`;
        setCode(code + logicCode);
    },

    addIfNode: () => {
        const { code, setCode } = get();
        // We append a basic if structure. 
        // The parser will pick this up and create the node + empty blocks
        const ifCode = `\nif (false) {\n  \n} else {\n  \n}`;
        setCode(code + ifCode);
    },

    addSwitchNode: () => {
        const { code, setCode } = get();
        const switchCode = `\nswitch (undefined) {\n  case 1:\n    break;\n  default:\n    break;\n}`;
        setCode(code + switchCode);
    },

    addWhileNode: () => {
        const { code, setCode } = get();
        const whileCode = `\nwhile (false) {\n  \n}`;
        setCode(code + whileCode);
    },

    addForNode: () => {
        const { code, setCode } = get();
        const forCode = `\nfor (let i = 0; i < 10; i++) {\n  \n}`;
        setCode(code + forCode);
    },

    promoteToVariable: (literalNodeId: string, literalValue: unknown, type: string) => {
        const { openModal, setCode, nodes, code, edges } = get();

        openModal({
            title: 'Promover para Variável',
            initialValue: '',
            type,
            onSubmit: (varName: string) => {
                // Formatting based on type
                let formattedValue = String(literalValue);
                if (type === 'string' && !formattedValue.startsWith("'") && !formattedValue.startsWith('"')) {
                    formattedValue = `'${formattedValue}'`;
                }

                // Add to TOP of code so it's defined before use
                const baseCode = `const ${varName} = ${formattedValue};\n${code}`;

                // Now we need to tell the generator to replace the literal with this new variable
                // We do this by updating the edges temporarily for the generation
                const newEdges = edges.map((e: Edge) =>
                    e.source === literalNodeId ? { ...e, source: `var-${varName}` } : e
                );

                // We also need to add a "virtual" node for the new variable so generateCodeFromFlow maps it
                const virtualVarNode = {
                    id: `var-${varName}`,
                    type: 'variableNode',
                    data: { label: varName },
                    position: { x: 0, y: 0 }
                } as AppNode;

                const finalCode = generateCodeFromFlow(baseCode, [...nodes, virtualVarNode], newEdges);
                setCode(finalCode);
            }
        });
    },

    promoteCallToVariable: (callNodeId: string) => {
        const { openModal } = get();

        openModal({
            title: 'Atribuir a Nova Variável',
            initialValue: '',
            type: 'function-return',
            onSubmit: (varName: string) => {
                const { code, nodes } = get();

                // 1. Find the call statement we want to promote
                const callNode = nodes.find((n: Node) => n.id === callNodeId);
                if (!callNode) return;

                const originalExpr = (callNode.data).expression;
                if (!originalExpr) return;

                // 2. We need to find the exact line in the code to replace
                // Since this is an expression statement, it should end with ;
                const callStatement = originalExpr + (originalExpr.endsWith(';') ? '' : ';');
                const newDeclaration = `const ${varName} = ${originalExpr};`;

                // Replace the occurrence
                const newCode = code.replace(callStatement, newDeclaration);

                if (newCode !== code) {
                    get().setCode(newCode);
                } else {
                    // Fallback if formatting differs
                    const fallbackCode = `const ${varName} = ${originalExpr};\n` + code.replace(originalExpr, '').replace(/^\s*;\s*$/m, '');
                    get().setCode(fallbackCode);
                }
            }
        });
    },

    openModal: (config) => set({ modal: { ...config, isOpen: true } }),
    closeModal: () => set({ modal: { ...get().modal, isOpen: false } }),
    setConfirmationModal: (config) => set({ confirmationModal: config }),

    navigateInto: (scopeId, label) => {
        const stack = get().navigationStack;
        set({
            navigationStack: [...stack, { id: scopeId, label }],
            activeScopeId: scopeId
        });
    },

    navigateBack: () => {
        const stack = get().navigationStack;
        if (stack.length > 1) {
            const newStack = stack.slice(0, -1);
            set({
                navigationStack: newStack,
                activeScopeId: newStack[newStack.length - 1].id
            });
        }
    },

    navigateToScope: (index) => {
        const stack = get().navigationStack;
        if (index >= 0 && index < stack.length) {
            const newStack = stack.slice(0, index + 1);
            set({
                navigationStack: newStack,
                activeScopeId: newStack[index].id
            });
        }
    },

    syncProjectFiles: async () => {
        const { openedFolder } = get();
        if (!openedFolder || !window.electron) return;

        try {
            const files = await window.electron.fileSystem.readDir(openedFolder) as { name: string, isDirectory: boolean }[];
            const tsFiles = files.filter(f => !f.isDirectory && (f.name.endsWith('.ts') || f.name.endsWith('.js')));

            const contents: Record<string, string> = {};
            for (const file of tsFiles) {
                const fullPath = `${openedFolder}/${file.name}`;
                const content = await window.electron.fileSystem.readFile(fullPath);
                contents[fullPath] = content;
            }

            set({ projectFiles: contents });
        } catch (err) {
            console.error('Failed to sync project files:', err);
        }
    },

    setOpenedFolder: (path) => {
        get().setWorkspaceRoot(path);
    },

    setSelectedFile: async (path) => {
        const previousFile = get().selectedFile;
        const isDirty = get().isDirty;

        if (previousFile && previousFile !== path) {
            if (get().autoSave) {
                await get().saveFile();
                // Continue to change file
            } else if (isDirty) {
                // Return a promise that resolves when user chooses
                // We pause the switching here.
                // NOTE: setSelectedFile effectively becomes async "request".
                // Since react state is synchronous, we can't easily block this call stack.
                // A better approach for "professional" apps is: 
                // RequestSwitch -> Check Dirty -> Dialog -> (Save -> Switch) OR (Discard -> Switch) OR (Cancel -> Do nothing)

                // For this implementation, we will use the Store to trigger the modal, 
                // and the modal's callbacks will trigger the ACTUAL switch.

                const fileName = previousFile.split(/[\\/]/).pop() ?? '';
                get().setConfirmationModal({
                    isOpen: true,
                    title: i18n.t('app.confirm_save.title'),
                    message: i18n.t('app.confirm_save.message', { fileName }),
                    confirmLabel: i18n.t('app.confirm_save.save'),
                    cancelLabel: i18n.t('app.confirm_save.cancel'),
                    discardLabel: i18n.t('app.confirm_save.discard'),
                    onConfirm: async () => {
                        await get().saveFile();
                        get().setConfirmationModal(null);
                        set({ selectedFile: path, isDirty: false });
                        await get().loadContentForFile(path);
                    },
                    onDiscard: async () => {
                        get().setConfirmationModal(null);
                        set({ selectedFile: path, isDirty: false }); // Discarding means we just overwrite/ignore dirty
                        await get().loadContentForFile(path);
                    },
                    onCancel: () => {
                        get().setConfirmationModal(null);
                        // Do not switch file
                    }
                });
                return; // STOP execution here
            }
        }

        if (path) {
            get().addRecentFile(path);
            set({ selectedFile: path, isDirty: false });
            await get().loadContentForFile(path);
        } else {
            set({ selectedFile: null, isDirty: false, code: '', nodes: [], edges: [] });
        }
    },

    loadContentForFile: async (path: string | null) => {
        if (path && window.electron) {
            try {
                const content = await window.electron.fileSystem.readFile(path);
                const isBlock = path.endsWith('.block');
                set({ isBlockFile: isBlock });

                if (isBlock) {
                    try {
                        const data = JSON.parse(content) as { nodes?: AppNode[]; edges?: Edge[] };
                        set({
                            nodes: data.nodes ?? [],
                            edges: data.edges ?? [],
                            showCode: false,
                            showCanvas: true
                        });
                    } catch {
                        // If empty or invalid, start fresh
                        set({
                            nodes: [],
                            edges: [],
                            showCode: false,
                            showCanvas: true
                        });
                    }
                } else {
                    get().setCode(content, false, false);
                    // For code files, we usually want both visible by default or stick to current
                    set({ showCode: true, showCanvas: true });
                }
            } catch (err) {
                console.error('Failed to read file:', err);
            }
        }
    },

    saveFile: async () => {
        const { selectedFile, code, nodes, edges, isBlockFile } = get();
        if (selectedFile && window.electron) {
            try {
                let contentToSave = code;
                if (isBlockFile) {
                    contentToSave = JSON.stringify({ nodes, edges }, null, 2);
                }
                await window.electron.fileSystem.writeFile(selectedFile, contentToSave);
                set({ isDirty: false });
            } catch (err) {
                console.error('Failed to save file:', err);
            }
        }
    },

    addNoteNode: () => {
        if (!get().isBlockFile) return;

        const id = getUUID('note');
        const activeScopeId = get().activeScopeId;
        const newNode: AppNode = {
            id,
            type: 'noteNode',
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: {
                label: 'Nova Nota',
                text: '',
                scopeId: activeScopeId,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            style: { width: 250, height: 180 }
        };
        set(state => ({ nodes: [...state.nodes, newNode], isDirty: true }));
        void get().saveFile();
    },



    checkTaskRecurse: (nodeId: string) => {
        const { nodes, edges } = get();
        // A child changed (nodeId), check its parents
        const parentEdges = edges.filter(e => e.target === nodeId);
        parentEdges.forEach(edge => {
            const parentId = edge.source;
            const parentNode = nodes.find(n => n.id === parentId);

            if (parentNode && parentNode.type === 'utilityNode' && parentNode.data.utilityType === 'task') {
                // Check all children of this parent
                const childEdges = edges.filter(e => e.source === parentId);
                const childrenTasks = childEdges.map(e => nodes.find(n => n.id === e.target)).filter(n => n && n.type === 'utilityNode' && n.data.utilityType === 'task');

                if (childrenTasks.length > 0) {
                    const allDone = childrenTasks.every(n => n?.data.checked);
                    if (parentNode.data.checked !== allDone) {
                        get().updateNodeData(parentId, { checked: allDone });
                    }
                }
            }
        });
    },

    discoverPlugins: async () => {
        try {
            const plugins = await window.electron.discoverPlugins();
            set({ plugins });
        } catch (err) {
            get().addToast({ type: 'error', message: `Erro ao descobrir plugins: ${String(err)}` });
        }
    },

    togglePlugin: async (id: string, enabled: boolean) => {
        try {
            await window.electron.togglePlugin(id, enabled);
            const plugins = get().plugins.map(p => p.id === id ? { ...p, enabled } : p);
            set({ plugins });
            get().addToast({
                type: 'info',
                message: `Plugin ${enabled ? 'ativado' : 'desativado'}. Reinicie para aplicar.`
            });
        } catch (err) {
            get().addToast({ type: 'error', message: `Erro ao alterar estado do plugin: ${String(err)}` });
        }
    },

    installPlugin: async () => {
        try {
            const manifest = await window.electron.installPlugin();
            if (manifest) {
                await get().discoverPlugins();
                get().addToast({ type: 'success', message: `Plugin "${manifest.name}" instalado!` });
            }
        } catch (err) {
            get().addToast({ type: 'error', message: `Erro ao instalar plugin: ${String(err)}` });
        }
    },

    uninstallPlugin: async (id: string) => {
        try {
            await window.electron.uninstallPlugin(id);
            set((state) => ({
                plugins: state.plugins.filter(p => p.id !== id),
                selectedPluginId: state.selectedPluginId === id ? null : state.selectedPluginId
            }));
            get().addToast({ type: 'success', message: 'Plugin removido.' });
        } catch (err) {
            get().addToast({ type: 'error', message: `Erro ao remover plugin: ${String(err)}` });
        }
    },

    setSelectedPluginId: (id: string | null) => set({ selectedPluginId: id }),

    resetSettings: () => {
        const defaults = {
            appearance: { theme: 'dark', showAppBorder: false },
            layout: { sidebar: { width: 260 } },
            editor: { fontSize: 14, autoLayoutNodes: false },
            terminal: { copyOnSelect: true, rightClickPaste: true },
            files: { autoSave: false }
        };
        const json = JSON.stringify(defaults, null, 2);
        localStorage.setItem('settings.json', json);
        set({
            settingsConfig: json,
            settings: {
                terminalCopyOnSelect: true,
                terminalRightClickPaste: true,
                fontSize: 14,
                showAppBorder: false,
                autoLayoutNodes: false,
                showDebugHandles: false
            },
            layout: {
                ...get().layout,
                sidebar: { ...get().layout.sidebar, width: 260 }
            }
        });
        get().addToast({ type: 'info', message: 'Configurações restauradas para o padrão.' });
    },


    getEdgesForNode: (nodeId: string) => {
        return get().connectionCache.get(nodeId) ?? [];
    },

    addUtilityNode: (type: UtilityType) => {
        if (!get().isBlockFile) return;

        const def = getUtilityDefinition(type);
        if (!def) return;

        const newNode: AppNode = {
            id: getUUID('util'),
            type: 'utilityNode',
            position: {
                x: Math.random() * 500,
                y: Math.random() * 400
            },
            data: {
                ...def.defaultData,
                label: def.label
            }
        };

        set(state => ({ nodes: [...state.nodes, newNode] }));
    },

    spawnConnectedUtility: (sourceId, type, label, position, checked) => {
        const { isBlockFile, autoSave } = get();
        const def = getUtilityDefinition(type);
        if (!def) return;

        const newId = getUUID('util');
        const newNode: AppNode = {
            id: newId,
            type: 'utilityNode',
            position,
            data: {
                ...def.defaultData,
                label: label ?? def.label,
                checked: checked ?? false
            }
        };

        const newEdge: Edge = {
            id: `edge-${sourceId}-${newId}`,
            source: sourceId,
            target: newId,
        };

        set(state => ({
            nodes: [...state.nodes, newNode],
            edges: [...state.edges, newEdge]
        }));

        if (isBlockFile) {
            if (autoSave) void get().saveFile();
            else set({ isDirty: true });
        }
    },

    spawnMultipleConnectedUtilities: (sourceId, utilities) => {
        const { isBlockFile, autoSave } = get();
        const newNodes: AppNode[] = [];
        const newEdges: Edge[] = [];

        utilities.forEach(util => {
            const def = getUtilityDefinition(util.type);
            if (!def) return;

            const newId = getUUID('util');
            newNodes.push({
                id: newId,
                type: 'utilityNode',
                position: util.position,
                data: {
                    ...def.defaultData,
                    label: util.label ?? def.label,
                    checked: util.checked ?? false
                }
            });

            newEdges.push({
                id: `edge-${sourceId}-${newId}`,
                source: sourceId,
                target: newId,
            });
        });

        if (newNodes.length === 0) return;

        set(state => ({
            nodes: [...state.nodes, ...newNodes],
            edges: [...state.edges, ...newEdges]
        }));

        if (isBlockFile) {
            if (autoSave) void get().saveFile();
            else set({ isDirty: true });
        }
    },

    addToast: (toast) => {
        const id = getUUID('toast');
        const duration = toast.duration ?? 3000;
        const timestamp = Date.now();
        const newToast = { ...toast, id, timestamp };

        set((state: AppState) => {
            const updates: Partial<AppState> = {
                notifications: [
                    { ...newToast, read: false },
                    ...state.notifications.slice(0, 49)
                ],
                unreadNotificationsCount: state.unreadNotificationsCount + 1
            };

            // Only show ephemeral toast if DND is OFF
            if (!state.doNotDisturb) {
                updates.toasts = [...state.toasts, newToast];
            }

            return updates;
        });

        if (!get().doNotDisturb) {
            setTimeout(() => {
                get().removeToast(id);
            }, duration);
        }
    },

    removeToast: (id) => {
        set((state: AppState) => ({ toasts: state.toasts.filter((t: Toast) => t.id !== id) }));
    },

    clearNotifications: () => {
        set({ notifications: [], unreadNotificationsCount: 0 });
    },

    markNotificationsAsRead: () => {
        set((state) => ({
            unreadNotificationsCount: 0,
            notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
    },

    toggleDoNotDisturb: () => {
        set((state) => ({ doNotDisturb: !state.doNotDisturb }));
    },
}));

// --- MCP State Synchronization ---
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
useStore.subscribe((state) => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        if (window.electron?.mcpSyncState) {
            // Snapshot for MCP Tooling
            const snapshot = {
                selectedFile: state.selectedFile,
                isSimulating: state.isSimulating,
                isBlockFile: state.isBlockFile,
                activeSidebarTab: state.activeSidebarTab,
                nodeCount: state.nodes.length,
                edgeCount: state.edges.length,
                theme: state.theme,
                errors: Array.from(state.executionErrors.entries()),
                // For deep inspection, we can send simplified nodes
                nodes: state.nodes.map(n => ({ id: n.id, type: n.type, label: n.data.label }))
            };
            window.electron.mcpSyncState(snapshot);
        }
    }, 1000); // 1s debounce to prevent IPC congestion
});
