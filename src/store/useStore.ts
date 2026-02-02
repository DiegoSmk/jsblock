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
    Settings
} from '../types/store';

// import { v4 as uuidv4 } from 'uuid'; // Removed to avoid dependency check
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

import { parseCodeToFlow } from '../logic/CodeParser';
import { generateCodeFromFlow } from '../logic/CodeGenerator';
import { getLayoutedElements } from '../logic/layout';
import i18n from '../i18n/config';
import { createGitSlice } from './slices/git/slice';

const initialCode = '';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let saveLayoutTimeout: ReturnType<typeof setTimeout> | null = null;

// Worker instance
let runtimeWorker: Worker | null = null;

export const useStore = create<AppState>((set, get, api) => ({
    ...createGitSlice(set, get, api),

    code: initialCode,
    nodes: [],
    edges: [],
    theme: (() => {
        try {
            const saved = localStorage.getItem('settings.json');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.appearance?.theme ?? 'dark';
            }
        } catch { }
        return 'dark';
    })(),
    toasts: [],
    runtimeValues: {},
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
                const parsed = JSON.parse(saved);
                // Migration Logic for Sidebar
                if (parsed.layout?.sidebar && (parsed.layout.sidebar.vanilla || parsed.layout.sidebar.git)) {
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
            const parsed = JSON.parse(json);

            // Sync all states from parsed JSON
            if (parsed.appearance?.theme) {
                set({ theme: parsed.appearance.theme });
            }
            if (parsed.layout?.sidebar?.width) {
                set((state) => ({
                    layout: { ...state.layout, sidebar: { ...state.layout.sidebar, width: parsed.layout.sidebar.width } }
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
                const parsed = JSON.parse(savedSettings);
                // Handle legacy or new format
                const sb = parsed.layout?.sidebar;
                if (typeof sb === 'number') width = sb;
                else if (typeof sb?.width === 'number') width = sb.width;
                else if (typeof sb === 'object') {
                    // Legacy object with vanilla/git keys
                    width = 260;
                }
            }
        } catch { }
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
                const parsed = JSON.parse(get().settingsConfig);
                if (!parsed.layout) parsed.layout = {};
                if (!parsed.layout.sidebar) parsed.layout.sidebar = {};
                parsed.layout.sidebar = { width: newWidth };

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
        };
        try {
            const saved = localStorage.getItem('settings.json');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    terminalCopyOnSelect: parsed.terminal?.copyOnSelect ?? defaultSettings.terminalCopyOnSelect,
                    terminalRightClickPaste: parsed.terminal?.rightClickPaste ?? defaultSettings.terminalRightClickPaste,
                    autoLayoutNodes: parsed.editor?.autoLayoutNodes ?? defaultSettings.autoLayoutNodes,
                    fontSize: parsed.editor?.fontSize ?? defaultSettings.fontSize,
                    showAppBorder: parsed.appearance?.showAppBorder ?? false,
                };
            }
        } catch { }
        return defaultSettings;
    })(),

    updateSettings: (updates: Partial<Settings>) => {
        const current = get().settings;
        const newSettings = { ...current, ...updates };
        set({ settings: newSettings });

        // Sync to JSON
        try {
            const parsed = JSON.parse(get().settingsConfig);
            if (!parsed.editor) parsed.editor = {};
            if (!parsed.terminal) parsed.terminal = {};

            if (updates.fontSize !== undefined) parsed.editor.fontSize = updates.fontSize;
            if (updates.autoLayoutNodes !== undefined) parsed.editor.autoLayoutNodes = updates.autoLayoutNodes;
            if (updates.terminalCopyOnSelect !== undefined) parsed.terminal.copyOnSelect = updates.terminalCopyOnSelect;
            if (updates.terminalRightClickPaste !== undefined) parsed.terminal.rightClickPaste = updates.terminalRightClickPaste;
            if (updates.showAppBorder !== undefined) parsed.appearance.showAppBorder = updates.showAppBorder;

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
                const parsed = JSON.parse(saved);
                return parsed.files?.autoSave ?? false;
            }
        } catch { }
        return false;
    })(),
    isDirty: false,

    toggleAutoSave: () => {
        const newValue = !get().autoSave;
        set({ autoSave: newValue });

        // Sync to JSON
        try {
            const parsed = JSON.parse(get().settingsConfig);
            if (!parsed.files) parsed.files = {};
            parsed.files.autoSave = newValue;

            const newJson = JSON.stringify(parsed, null, 2);
            localStorage.setItem('settings.json', newJson);
            set({ settingsConfig: newJson });
        } catch (e) {
            console.error('Failed to sync autoSave', e);
        }
    },

    setDirty: (dirty: boolean) => set({ isDirty: dirty }),
    recentEnvironments: (JSON.parse(localStorage.getItem('recentEnvironments') ?? '[]') as RecentEnvironment[]),

    addRecent: async (path: string) => {
        const { recentEnvironments } = get();
        // Check if path exists using the new API
        if (window.electronAPI) {
            const exists = await window.electronAPI.checkPathExists(path);
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
        if (!window.electronAPI) return;

        const { recentEnvironments } = get();
        const validRecents = [];

        for (const recent of recentEnvironments) {
            const exists = await window.electronAPI.checkPathExists(recent.path);
            if (exists) {
                validRecents.push(recent);
            }
        }

        if (validRecents.length !== recentEnvironments.length) {
            localStorage.setItem('recentEnvironments', JSON.stringify(validRecents));
            set({ recentEnvironments: validRecents });
        }
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
    setSidebarTab: (tab: 'explorer' | 'library' | 'git' | 'settings' | 'extensions') => set((state) => ({
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

    setCode: (code: string, shouldSetDirty = true) => {
        // Existing logic for parsing and evaluation
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

        // Advanced Sandbox Evaluation
        // SECURITY: Replaced eval with Web Worker
        try {
            // 1. Identify items to capture
            const varNames = nodes
                .filter(n => n.id.startsWith('var-'))
                .map(n => ({ id: n.data.label!, expr: n.data.label! }));

            const callExpressions = nodes
                .filter(n => n.type === 'functionCallNode' && !n.data.isDecl && n.data.expression)
                .map(n => ({ id: n.id, expr: n.data.expression! }));

            const nestedExpressions: { id: string, expr: string }[] = [];
            nodes.forEach(n => {
                const nac = n.data.nestedArgsCall;
                if (nac) {
                    Object.keys(nac).forEach(key => {
                        const call = nac[key];
                        if (call.expression) {
                            nestedExpressions.push({
                                id: `${n.id}-arg-${key}-expr`,
                                expr: call.expression
                            });
                        }
                    });
                }
            });

            const allItems = [...varNames, ...callExpressions, ...nestedExpressions];

            if (allItems.length > 0) {
                // Initialize worker if needed
                if (!runtimeWorker) {
                    runtimeWorker = new Worker(new URL('../workers/runtime.worker.ts', import.meta.url), { type: 'module' });
                    runtimeWorker.onmessage = (e) => {
                        const runtimeValues = e.data;
                        set({ runtimeValues });
                    };
                }

                // Send code to worker
                runtimeWorker.postMessage({ code, items: allItems });
            } else {
                set({ runtimeValues: {} });
            }
        } catch (err) {
            console.warn("Runtime evaluation failed:", err);
        }

        const nodesWithValues = nodes.map(node => {
            if (node.id.startsWith('var-')) {
                return node;
            }
            return node;
        });

        const currentStack = get().navigationStack;
        const currentScopeId = get().activeScopeId;

        const layouted = getLayoutedElements(nodesWithValues, edges);

        const activeNodeExists = currentScopeId === 'root' || layouted.nodes.some(n => n.id === currentScopeId);

        set({
            code,
            nodes: layouted.nodes,
            edges: layouted.edges,
            // runtimeValues is updated asynchronously via worker callback
            navigationStack: activeNodeExists ? currentStack : [{ id: 'root', label: 'Main' }],
            activeScopeId: activeNodeExists ? currentScopeId : 'root'
        });
    },

    onNodesChange: (changes: NodeChange<AppNode>[]) => {
        const nextNodes = applyNodeChanges(changes, get().nodes);
        set({ nodes: nextNodes });
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
        set({ edges: newEdges });

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
            const parsed = JSON.parse(get().settingsConfig);
            if (!parsed.appearance) parsed.appearance = {};
            parsed.appearance.theme = nextTheme;

            const newJson = JSON.stringify(parsed, null, 2);
            localStorage.setItem('settings.json', newJson);
            set({ settingsConfig: newJson });
        } catch (e) {
            console.error('Failed to sync theme', e);
        }
    },

    updateNodeData: (nodeId: string, newData: Partial<AppNodeData>) => {
        const { nodes, code, edges, isBlockFile, autoSave } = get();
        const updatedNodes = nodes.map((n: AppNode) => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n);
        set({ nodes: updatedNodes });

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
            // Regenerate code based on the new data
            const newCode = generateCodeFromFlow(code, updatedNodes, edges);
            get().setCode(newCode);
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

    setOpenedFolder: (path) => {
        set({ openedFolder: path });
        if (path) {
            void get().addRecent(path); // Add to recents when opened
            if (window.electronAPI) {
                void window.electronAPI.ensureProjectConfig(path);
            }
        } else if (get().activeSidebarTab === 'git') {
            // Reset to explorer if closing folder while in git tab
            set({ activeSidebarTab: 'explorer' });
        }
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
            set({ selectedFile: path, isDirty: false });
            await get().loadContentForFile(path);
        } else {
            set({ selectedFile: null, isDirty: false, code: '', nodes: [], edges: [] });
        }
    },

    loadContentForFile: async (path: string | null) => {
        if (path && window.electronAPI) {
            try {
                const content = await window.electronAPI.readFile(path);
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
                    get().setCode(content, false);
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
        if (selectedFile && window.electronAPI) {
            try {
                let contentToSave = code;
                if (isBlockFile) {
                    contentToSave = JSON.stringify({ nodes, edges }, null, 2);
                }
                await window.electronAPI.writeFile(selectedFile, contentToSave);
                set({ isDirty: false });
            } catch (err) {
                console.error('Failed to save file:', err);
            }
        }
    },

    addNoteNode: () => {
        const newNode: Node = {
            id: `note-${Date.now()}`,
            type: 'noteNode',
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: 'Nova Nota', text: '' },
            style: { width: 250, height: 180 }
        };
        set({ nodes: [...get().nodes, newNode] });
        void get().saveFile();
    },

    discoverPlugins: async () => {
        try {
            const plugins = await window.electronAPI.discoverPlugins();
            set({ plugins });
        } catch (err) {
            get().addToast({ type: 'error', message: `Erro ao descobrir plugins: ${String(err)}` });
        }
    },

    togglePlugin: async (id: string, enabled: boolean) => {
        try {
            await window.electronAPI.togglePlugin(id, enabled);
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
            const manifest = await window.electronAPI.installPlugin();
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
            await window.electronAPI.uninstallPlugin(id);
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
                autoLayoutNodes: false,
                fontSize: 14,
                showAppBorder: false
            },
            layout: {
                sidebar: { width: 260, isVisible: true }
            }
        });
        get().addToast({ type: 'info', message: 'Configurações restauradas para o padrão.' });
    },

    addToast: (toast) => {
        const id = generateId();
        const duration = toast.duration ?? 3000;
        set((state: AppState) => ({ toasts: [...state.toasts, { ...toast, id }] }));

        setTimeout(() => {
            get().removeToast(id);
        }, duration);
    },

    removeToast: (id) => {
        set((state: AppState) => ({ toasts: state.toasts.filter((t: Toast) => t.id !== id) }));
    },
}));
