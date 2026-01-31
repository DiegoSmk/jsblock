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

export interface AppNodeData {
    label?: string;
    expression?: string;
    value?: any;
    scopeId?: string;
    isDecl?: boolean;
    type?: string;
    name?: string;
    args?: any[];
    nestedArgsCall?: Record<string, any>;
    [key: string]: any;
}

export type AppNode = Node<AppNodeData>;

// import { v4 as uuidv4 } from 'uuid'; // Removed to avoid dependency check
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
import { parseCodeToFlow } from '../logic/CodeParser';
import { generateCodeFromFlow } from '../logic/CodeGenerator';
import { getLayoutedElements } from '../logic/layout';
import i18n from '../i18n/config';

interface RecentEnvironment {
    path: string;
    lastOpened: number; // timestamp
    label?: 'personal' | 'work' | 'fun' | 'other';
    isFavorite?: boolean;
}

interface GitFileStatus {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged';
    index: string;
    workingTree: string;
}

interface GitLogEntry {
    hash: string;
    author: string;
    date: string;
    message: string;
    graph?: string;
}

interface GitCommitFile {
    path: string;
    status: string;
}

interface GitAuthor {
    name: string;
    email: string;
}

interface GitStashEntry {
    index: number;
    branch: string;
    message: string;
    description: string;
}

interface GitProfile {
    id: string;
    name: string;
    email: string;
    tag: 'work' | 'personal' | 'ai' | 'custom';
    customTagName?: string;
}

interface GitTag {
    name: string;
    hash: string;
    message?: string;
    date?: string;
}

interface CommitTemplate {
    id: string;
    name: string;
    content: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

export interface Settings {
    terminalCopyOnSelect: boolean;
    terminalRightClickPaste: boolean;
    autoLayoutNodes: boolean;
    fontSize: number;
}

interface AppState {
    code: string;
    nodes: AppNode[];
    edges: Edge[];
    theme: 'light' | 'dark';
    runtimeValues: Record<string, any>;

    navigationStack: { id: string, label: string }[];
    activeScopeId: string; // 'root' by default

    // File System State
    openedFolder: string | null;
    selectedFile: string | null;
    autoSave: boolean;
    isDirty: boolean;

    toggleAutoSave: () => void;
    setDirty: (dirty: boolean) => void;

    setCode: (code: string, shouldSetDirty?: boolean) => void;
    onNodesChange: (changes: NodeChange<AppNode>[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    forceLayout: () => void;
    toggleTheme: () => void;
    updateNodeData: (nodeId: string, newData: any) => void;
    addFunctionCall: (funcName: string, args?: string[]) => void;
    addLogicNode: () => void;
    addIfNode: () => void;
    addSwitchNode: () => void;
    addWhileNode: () => void;
    addForNode: () => void;
    promoteToVariable: (literalNodeId: string, literalValue: any, type: string) => void;
    promoteCallToVariable: (callNodeId: string, funcName: string) => void;

    // Modal State
    modal: {
        isOpen: boolean;
        title: string;
        initialValue: string;
        type: string;
        placeholder?: string;
        confirmLabel?: string;
        payload?: any;
        onSubmit: (name: string) => void;
    };
    confirmationModal: {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
        onDiscard?: () => void;
        confirmLabel?: string;
        cancelLabel?: string;
        discardLabel?: string;
        variant?: 'danger' | 'warning' | 'info' | 'primary';
        discardVariant?: 'danger' | 'warning' | 'info' | 'primary' | 'secondary';
    } | null;
    openModal: (config: Omit<AppState['modal'], 'isOpen'>) => void;
    closeModal: () => void;
    setConfirmationModal: (config: AppState['confirmationModal']) => void;

    // UI State
    showSidebar: boolean;
    activeSidebarTab: 'explorer' | 'library' | 'git' | 'settings';
    showCode: boolean;
    showCanvas: boolean;
    toggleSidebar: () => void;
    setSidebarTab: (tab: 'explorer' | 'library' | 'git' | 'settings') => void;
    toggleCode: () => void;
    toggleCanvas: () => void;

    // Scope Navigation Actions
    navigateInto: (scopeId: string, label: string) => void;
    navigateBack: () => void;
    navigateToScope: (index: number) => void;

    // Block Note Actions
    addNoteNode: () => void;
    isBlockFile: boolean;

    // File System Actions
    // File System Actions
    setOpenedFolder: (path: string | null) => void;
    setSelectedFile: (path: string | null) => Promise<void>;
    loadContentForFile: (path: string | null) => Promise<void>;
    saveFile: () => Promise<void>;

    // Recent Environments
    recentEnvironments: RecentEnvironment[];
    addRecent: (path: string) => Promise<void>;
    removeRecent: (path: string) => void;
    toggleFavorite: (path: string) => void;
    setRecentLabel: (path: string, label: 'personal' | 'work' | 'fun' | 'other' | undefined) => void;
    validateRecents: () => Promise<void>;

    // Git Actions
    git: {
        isRepo: boolean;
        currentBranch: string;
        changes: GitFileStatus[];
        log: GitLogEntry[];
        rawLog: string;
        globalAuthor: GitAuthor | null;
        projectAuthor: GitAuthor | null;
        activeView: 'status' | 'terminal' | 'graph';
        sidebarView: 'history' | 'graph' | 'info';
        branches: string[];
        stashes: GitStashEntry[];
        stats: {
            fileCount: number;
            repoSize: string;
            projectSize: string;
        };
        tags: GitTag[];
        isInitialized: boolean;
    };
    gitProfiles: GitProfile[];
    commitTemplates: CommitTemplate[];

    commitDetail: {
        isOpen: boolean;
        commit: GitLogEntry | null;
        files: GitCommitFile[];
        fullMessage: string;
        stats?: {
            insertions: number;
            deletions: number;
            filesChanged: number;
        };
    };
    setGitView: (view: 'status' | 'terminal' | 'graph') => void;
    setGitSidebarView: (view: 'history' | 'graph' | 'info') => void;
    openCommitDetail: (commit: GitLogEntry) => Promise<void>;
    closeCommitDetail: () => void;
    refreshGit: () => Promise<void>;
    fetchGitConfig: () => Promise<void>;
    changeBranch: (branch: string) => Promise<void>;
    createBranch: (branch: string, startPoint?: string) => Promise<void>;
    deleteBranch: (branch: string) => Promise<void>;
    checkoutCommit: (hash: string) => Promise<void>;
    gitStage: (path: string) => Promise<void>;
    gitStageAll: () => Promise<void>;
    gitUnstage: (path: string) => Promise<void>;
    gitUnstageAll: () => Promise<void>;
    gitDiscard: (path: string) => Promise<void>;
    gitDiscardAll: () => Promise<void>;
    gitCommit: (message: string, isAmend?: boolean) => Promise<void>;
    gitStash: (message?: string) => Promise<void>;
    gitPopStash: (index?: number) => Promise<void>;
    gitApplyStash: (index: number) => Promise<void>;
    gitDropStash: (index: number) => Promise<void>;
    fetchStashes: () => Promise<void>;
    gitUndoLastCommit: () => Promise<void>;
    gitInit: (author?: GitAuthor, isGlobal?: boolean) => Promise<void>;
    setGitConfig: (author: GitAuthor, isGlobal: boolean) => Promise<void>;
    addGitProfile: (profile: Omit<GitProfile, 'id'>) => void;
    removeGitProfile: (id: string) => void;
    updateGitProfile: (id: string, updates: Partial<Omit<GitProfile, 'id'>>) => void;
    resetToGlobal: () => Promise<void>;
    getCommitFiles: (hash: string) => Promise<GitCommitFile[]>;

    // Tags
    gitCreateTag: (name: string, hash: string, message?: string) => Promise<void>;
    gitDeleteTag: (name: string) => Promise<void>;
    fetchTags: () => Promise<void>;
    gitClean: () => Promise<void>;
    gitIgnore: (pattern: string) => Promise<void>;

    // Commit Templates
    addCommitTemplate: (template: Omit<CommitTemplate, 'id'>) => void;
    removeCommitTemplate: (id: string) => void;

    // Quick Commands
    quickCommands: QuickCommand[];
    addQuickCommand: (cmd: Omit<QuickCommand, 'id'>) => void;
    removeQuickCommand: (id: string) => void;

    // Toast Actions
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;

    // Settings
    settings: Settings;
    updateSettings: (updates: Partial<Settings>) => void;

    // Git Panel Configuration
    gitPanelConfig: GitPanelConfig;
    updateGitPanelConfig: (updates: Partial<GitPanelConfig>) => void;
    resetGitPanelConfig: () => void;
}

export interface GitPanelSection {
    id: string;
    label: string;
    visible: boolean;
    expanded?: boolean;
}

export interface GitPanelConfig {
    sections: GitPanelSection[];
}


export interface QuickCommand {
    id: string;
    label: string;
    command: string;
    autoExecute: boolean;
}



const initialCode = '';

let saveTimeout: any = null;

export const useStore = create<AppState>((set, get) => ({
    code: initialCode,
    nodes: [],
    edges: [],
    theme: 'dark',
    toasts: [],
    runtimeValues: {},
    navigationStack: [{ id: 'root', label: 'Main' }],
    activeScopeId: 'root',
    showSidebar: true,
    confirmationModal: null,

    activeSidebarTab: 'explorer',
    showCode: true,
    showCanvas: true,
    isBlockFile: false,
    openedFolder: null,
    git: {
        isRepo: false,
        currentBranch: '',
        changes: [],
        log: [],
        rawLog: '',
        globalAuthor: null,
        projectAuthor: null,
        activeView: 'status',
        sidebarView: 'info',
        branches: [],
        stashes: [],
        stats: {
            fileCount: 0,
            repoSize: '',
            projectSize: ''
        },
        tags: [],
        isInitialized: false
    },

    gitPanelConfig: (() => {
        const saved = localStorage.getItem('gitPanelConfig');
        const defaultView: GitPanelConfig = {
            sections: [
                { id: 'overview', label: 'Visão Geral', visible: true, expanded: true },
                { id: 'stats', label: 'Estatísticas', visible: true, expanded: true },
                { id: 'weekly', label: 'Atividade Semanal', visible: true, expanded: true },
                { id: 'hourly', label: 'Horários de Pico', visible: true, expanded: true },
                { id: 'contributors', label: 'Colaboradores', visible: true, expanded: true },
                { id: 'tags', label: 'Tags & Versões', visible: true, expanded: true }
            ]
        };
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with defaults but keep ALL sections from parsed to avoid losing dynamic ones
                const sections = [...defaultView.sections];

                parsed.sections.forEach((s: any) => {
                    const idx = sections.findIndex(def => def.id === s.id);
                    if (idx >= 0) {
                        sections[idx] = { ...sections[idx], ...s };
                    } else {
                        sections.push(s);
                    }
                });
                return { sections };
            } catch (e) {
                return defaultView;
            }
        }
        return defaultView;
    })(),
    updateGitPanelConfig: (updates: Partial<GitPanelConfig>) => {
        const current = get().gitPanelConfig;
        const newValue = { ...current, ...updates };
        localStorage.setItem('gitPanelConfig', JSON.stringify(newValue));
        set({ gitPanelConfig: newValue });
    },
    resetGitPanelConfig: () => {
        const defaultView: GitPanelConfig = {
            sections: [
                { id: 'overview', label: 'Visão Geral', visible: true, expanded: true },
                { id: 'stats', label: 'Estatísticas', visible: true, expanded: true },
                { id: 'weekly', label: 'Atividade Semanal', visible: true, expanded: true },
                { id: 'hourly', label: 'Horários de Pico', visible: true, expanded: true },
                { id: 'contributors', label: 'Colaboradores', visible: true, expanded: true },
                { id: 'tags', label: 'Tags & Versões', visible: true, expanded: true }
            ]
        };
        localStorage.setItem('gitPanelConfig', JSON.stringify(defaultView));
        set({ gitPanelConfig: defaultView });
    },

    gitProfiles: JSON.parse(localStorage.getItem('gitProfiles') || '[]'),
    commitTemplates: JSON.parse(localStorage.getItem('commitTemplates') || '[]'),
    commitDetail: {
        isOpen: false,
        commit: null,
        files: [],
        fullMessage: '',
        stats: undefined
    },
    quickCommands: JSON.parse(localStorage.getItem('quickCommands') || '[]'),

    settings: {
        terminalCopyOnSelect: localStorage.getItem('settings_terminalCopyOnSelect') !== 'false',
        terminalRightClickPaste: localStorage.getItem('settings_terminalRightClickPaste') !== 'false',
        autoLayoutNodes: localStorage.getItem('settings_autoLayoutNodes') === 'true',
        fontSize: parseInt(localStorage.getItem('settings_fontSize') || '14'),
    },

    updateSettings: (updates: Partial<Settings>) => {
        const newSettings = { ...get().settings, ...updates };
        Object.keys(updates).forEach(key => {
            localStorage.setItem(`settings_${key}`, String((updates as any)[key]));
        });
        set({ settings: newSettings });
    },

    addQuickCommand: (cmd: Omit<QuickCommand, 'id'>) => {
        const newCmd = {
            ...cmd,
            id: Date.now().toString(),
            autoExecute: cmd.autoExecute ?? true // Default to true if not provided
        };
        const quickCommands = [...get().quickCommands, newCmd];
        localStorage.setItem('quickCommands', JSON.stringify(quickCommands));
        set({ quickCommands });
    },

    removeQuickCommand: (id: string) => {
        const quickCommands = get().quickCommands.filter((c: any) => c.id !== id);
        localStorage.setItem('quickCommands', JSON.stringify(quickCommands));
        set({ quickCommands });
    },

    setGitView: (view: 'status' | 'terminal' | 'graph') => {
        set((state: any) => ({
            git: { ...state.git, activeView: view }
        }));
    },
    setGitSidebarView: (view: 'history' | 'graph' | 'info') => {
        set((state: any) => ({
            git: { ...state.git, sidebarView: view }
        }));
    },

    openCommitDetail: async (commit: GitLogEntry) => {
        const { openedFolder, getCommitFiles } = get();
        if (!openedFolder || !(window as any).electronAPI) return;

        try {
            // Fetch full message and files
            const res = await (window as any).electronAPI.gitCommand(openedFolder, ['show', '--pretty=format:%B', '-s', commit.hash]);
            const fullMessage = res.stdout.trim();
            const files = await getCommitFiles(commit.hash);

            // Fetch shortstat
            let stats = { insertions: 0, deletions: 0, filesChanged: 0 };
            try {
                const statRes = await (window as any).electronAPI.gitCommand(openedFolder, ['show', '--shortstat', '--format=', commit.hash]);
                const statLine = statRes.stdout.trim();
                // Format example: " 2 files changed, 10 insertions(+), 5 deletions(-)"
                if (statLine) {
                    const filesMatch = statLine.match(/(\d+) files? changed/);
                    const insMatch = statLine.match(/(\d+) insertions?\(\+\)/);
                    const delMatch = statLine.match(/(\d+) deletions?\(-\)/);

                    stats = {
                        filesChanged: filesMatch ? parseInt(filesMatch[1]) : 0,
                        insertions: insMatch ? parseInt(insMatch[1]) : 0,
                        deletions: delMatch ? parseInt(delMatch[1]) : 0
                    };
                }
            } catch (e) {
                console.warn('Failed to fetch commit stats:', e);
            }

            set({
                commitDetail: {
                    isOpen: true,
                    commit,
                    files,
                    fullMessage,
                    stats
                }
            });
        } catch (err) {
            console.error('Failed to open commit detail:', err);
        }
    },

    closeCommitDetail: () => {
        set({
            commitDetail: {
                isOpen: false,
                commit: null,
                files: [],
                fullMessage: '',
                stats: undefined
            }
        });
    },

    selectedFile: null,
    autoSave: localStorage.getItem('autoSave') === 'true',
    isDirty: false,

    toggleAutoSave: () => {
        const newValue = !get().autoSave;
        localStorage.setItem('autoSave', String(newValue));
        set({ autoSave: newValue });
    },

    setDirty: (dirty: boolean) => set({ isDirty: dirty }),
    recentEnvironments: JSON.parse(localStorage.getItem('recentEnvironments') || '[]'),

    addRecent: async (path: string) => {
        const { recentEnvironments } = get();
        // Check if path exists using the new API
        if ((window as any).electronAPI) {
            const exists = await (window as any).electronAPI.checkPathExists(path);
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
        if (!(window as any).electronAPI) return;

        const { recentEnvironments } = get();
        const validRecents = [];

        for (const recent of recentEnvironments) {
            const exists = await (window as any).electronAPI.checkPathExists(recent.path);
            if (exists) {
                validRecents.push(recent);
            }
        }

        if (validRecents.length !== recentEnvironments.length) {
            localStorage.setItem('recentEnvironments', JSON.stringify(validRecents));
            set({ recentEnvironments: validRecents });
        }
    },
    toggleSidebar: () => set({ showSidebar: !get().showSidebar }),
    setSidebarTab: (tab: 'explorer' | 'library' | 'git' | 'settings') => set({ activeSidebarTab: tab, showSidebar: true }),
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
        onSubmit: () => { }
    },

    setCode: (code: string, shouldSetDirty = true) => {
        // Existing logic for parsing and evaluation
        const { nodes, edges } = parseCodeToFlow(code);

        if (saveTimeout) clearTimeout(saveTimeout);

        if (shouldSetDirty) {
            if (get().autoSave) {
                saveTimeout = setTimeout(() => {
                    get().saveFile();
                }, 1000);
            } else {
                set({ isDirty: true });
            }
        }

        let runtimeValues: Record<string, any> = {};

        // Advanced Sandbox Evaluation
        try {
            // 1. Identify items to capture
            const varNames = nodes
                .filter(n => n.id.startsWith('var-'))
                .map(n => ({ id: (n.data as any).label, expr: (n.data as any).label }));

            const callExpressions = nodes
                .filter(n => n.type === 'functionCallNode' && !(n.data as any).isDecl && (n.data as any).expression)
                .map(n => ({ id: n.id, expr: (n.data as any).expression }));

            const nestedExpressions: { id: string, expr: string }[] = [];
            nodes.forEach(n => {
                const nac = (n.data as any).nestedArgsCall;
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
                // We construct a massive object return that evaluates everything in context
                // Security Note: 'eval' is used for this prototyping tool to simulate a JS runtime.
                // In production, this would be a separate worker or defined sandbox.

                // We wrap calls in try-catch to prevent one failure from breaking all
                const returnObject = allItems.map(item => {
                    // Escape ID for key if needed, but we use simple keys here
                    return `"${item.id}": (function(){ try { return ${item.expr} } catch(e) { return undefined } })()`;
                }).join(',');

                const captureCode = `
                    (function() {
                        // Redeclare functions globally so they are available
                        // This is a naive approach; a better one would parse function bodies.
                        // For now we just eval the whole code first to set up scope.
                        try {
                            ${code}
                            return { ${returnObject} };
                        } catch (e) {
                            return {};
                        }
                    })()
                `;
                runtimeValues = eval(captureCode);
            }
        } catch (err) {
            console.warn("Runtime evaluation failed:", err);
        }

        const nodesWithValues = nodes.map(node => {
            // Variables get values directly attached (legacy support) but useStore is source of truth
            if (node.id.startsWith('var-')) {
                // DO NOT overwrite data.value! That is the SOURCE definition.
                // We keep runtime values separate in the store's runtimeValues state.
                // VariableNode already reads from runtimeValues directly.
                return node;
            }
            return node;
        });

        const currentStack = get().navigationStack;
        const currentScopeId = get().activeScopeId;

        const layouted = getLayoutedElements(nodesWithValues, edges);

        // Check if the currently active scope still exists in the new node set

        // If the scope relies on a specific node being present (like a function Definition), check for it
        // The simple check involves seeing if we can traverse the stack in the new/existing nodes?
        // For now, simple existence check: if we are in a scope, ensure that scope ID is valid or that we are at root.
        // Actually, scopeId usually corresponds to a container node ID (like loop-123). Let's check if that node exists.
        const activeNodeExists = currentScopeId === 'root' || layouted.nodes.some(n => n.id === currentScopeId);

        set({
            code,
            nodes: layouted.nodes,
            edges: layouted.edges,
            runtimeValues,
            // Preserve navigation if the active scope node still exists
            navigationStack: activeNodeExists ? currentStack : [{ id: 'root', label: 'Main' }],
            activeScopeId: activeNodeExists ? currentScopeId : 'root'
        });
    },

    onNodesChange: (changes: NodeChange[]) => {
        const nextNodes = applyNodeChanges(changes, get().nodes);
        set({ nodes: nextNodes });
        if (get().isBlockFile) {
            if (get().autoSave) {
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    get().saveFile();
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
                    get().saveFile();
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
            if (autoSave) get().saveFile();
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
        set({ theme: get().theme === 'light' ? 'dark' : 'light' });
    },

    updateNodeData: (nodeId: string, newData: any) => {
        const { nodes, code, edges, isBlockFile, autoSave } = get();
        const updatedNodes = nodes.map((n: Node) => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n);
        set({ nodes: updatedNodes });

        if (isBlockFile) {
            if (autoSave) {
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    get().saveFile();
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

    promoteToVariable: (literalNodeId: string, literalValue: any, type: string) => {
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
                } as any;

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

    setOpenedFolder: async (path) => {
        set({ openedFolder: path });
        if (path) {
            get().addRecent(path); // Add to recents when opened
            if ((window as any).electronAPI) {
                await (window as any).electronAPI.ensureProjectConfig(path);
            }
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

                const fileName = previousFile.split(/[\\/]/).pop() || '';
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
                const content = await (window as any).electronAPI.readFile(path);
                const isBlock = path.endsWith('.block');
                set({ isBlockFile: isBlock });

                if (isBlock) {
                    try {
                        const data = JSON.parse(content);
                        set({
                            nodes: data.nodes || [],
                            edges: data.edges || [],
                            showCode: false,
                            showCanvas: true
                        });
                    } catch (e) {
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
        if (selectedFile && (window as any).electronAPI) {
            try {
                let contentToSave = code;
                if (isBlockFile) {
                    contentToSave = JSON.stringify({ nodes, edges }, null, 2);
                }
                await (window as any).electronAPI.writeFile(selectedFile, contentToSave);
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
        get().saveFile();
    },

    refreshGit: async () => {
        const { openedFolder } = get();
        if (!openedFolder || !(window as any).electronAPI) return;

        try {
            // Check if it's a repo
            const isRepoRes = await (window as any).electronAPI.gitCommand(openedFolder, ['rev-parse', '--is-inside-work-tree']);
            const isRepo = isRepoRes.stdout.trim() === 'true';

            if (!isRepo) {
                set((state: any) => ({
                    git: { ...state.git, isRepo: false }
                }));
                return;
            }

            // Get current branch
            const branchRes = await (window as any).electronAPI.gitCommand(openedFolder, ['rev-parse', '--abbrev-ref', 'HEAD']);
            const currentBranch = branchRes.stdout.trim();

            // Get all branches
            const branchesRes = await (window as any).electronAPI.gitCommand(openedFolder, ['branch', '--format=%(refname:short)']);
            const branches = branchesRes.stdout.split('\n').filter((b: string) => b.trim() !== '');

            // Get status with -z for robust path handling
            // This is critical for files with spaces or special characters
            const statusRes = await (window as any).electronAPI.gitCommand(openedFolder, ['status', '--porcelain', '-b', '-z']);

            // Output format with -z:
            // "## branch_info\0XY path\0XY path2\0R  old\0new\0"
            const rawStatus = statusRes.stdout;
            const tokens = rawStatus.split('\0');
            const changes: GitFileStatus[] = [];

            let i = 0;
            while (i < tokens.length) {
                const token = tokens[i];
                if (!token) { // End of stream or Empty
                    i++;
                    continue;
                }

                if (token.startsWith('##')) {
                    i++;
                    continue;
                }

                const index = token[0] || ' ';
                const workingTree = token[1] || ' ';
                let path = token.substring(3);
                let status: GitFileStatus['status'] = 'modified';

                if (index === 'R' || workingTree === 'R') {
                    status = 'renamed';
                    i++;
                    if (i < tokens.length) {
                        path = tokens[i];
                    }
                } else if (index === '?' || workingTree === '?') status = 'untracked';
                else if (index === 'A') status = 'added';
                else if (index === 'D' || workingTree === 'D') status = 'deleted';

                if (path) {
                    changes.push({ path, status, index, workingTree });
                }

                i++;
            }

            // Get Log with Graph and Decorations
            const delimiter = '|||';
            const logRes = await (window as any).electronAPI.gitCommand(openedFolder, [
                'log', '--graph', '--all', '-n', '100', '--no-color',
                `--pretty=format:%h${delimiter}%d${delimiter}%s${delimiter}%an${delimiter}%aI`
            ]);
            const rawLog = logRes.stdout;

            const refinedEntries: GitLogEntry[] = [];
            const lines = logRes.stdout.split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const parts = line.split(delimiter);

                // A valid log entry with our format should have at least 5 parts
                if (parts.length >= 5) {
                    const part0 = parts[0];
                    // The hash (%h) is the first element, at the end of part0
                    const hashMatch = part0.match(/([0-9a-f]{7,40})$/);
                    const hash = hashMatch ? hashMatch[1] : '';
                    const graph = hash ? part0.substring(0, part0.length - hash.length) : part0;

                    const refs = parts[1];
                    const message = parts[2];
                    const author = parts[3];
                    const date = parts[4]; // Should be ISO date string

                    if (hash) {
                        refinedEntries.push({
                            hash,
                            author: author || '?',
                            date: date ? date.trim() : new Date().toISOString(),
                            message: message || 'Sem mensagem',
                            graph,
                            refs: refs.trim()
                        } as any);
                    } else {
                        refinedEntries.push({
                            hash: '', author: '', date: '', message: '', graph: line, isGraphOnly: true
                        } as any);
                    }
                } else {
                    refinedEntries.push({
                        hash: '', author: '', date: '', message: '', graph: line, isGraphOnly: true
                    } as any);
                }
            }

            // Fetch Repo Stats
            let fileCount = 0;
            let repoSize = '0 B';
            let projectSize = '0 B';

            try {
                // File Count
                const filesRes = await (window as any).electronAPI.gitCommand(openedFolder, ['ls-files']);
                // Count non-empty lines
                fileCount = filesRes.stdout.split('\n').filter((l: string) => l.trim()).length;

                // Repo Size
                const sizeRes = await (window as any).electronAPI.gitCommand(openedFolder, ['count-objects', '-vH']);
                const sizeOutput = sizeRes.stdout;

                // Prioritize size-pack (packed objects), then size (loose objects).
                // git count-objects -vH output:
                // size: 6.75 MiB
                // size-pack: 0 bytes

                const sizePackMatch = sizeOutput.match(/size-pack:\s*(.+)/);
                const sizeMatch = sizeOutput.match(/^size:\s*(.+)/m);

                const sizePack = sizePackMatch ? sizePackMatch[1].trim() : null;
                const sizeLoose = sizeMatch ? sizeMatch[1].trim() : null;

                if (sizePack && sizePack !== '0 bytes' && sizePack !== '0') {
                    repoSize = sizePack;
                } else if (sizeLoose) {
                    repoSize = sizeLoose;
                }


                // Project Size (Tracked files)
                try {
                    const treeRes = await (window as any).electronAPI.gitCommand(openedFolder, ['ls-tree', '-r', '-l', 'HEAD']);
                    const treeLines = treeRes.stdout.split('\n');
                    let totalBytes = 0;
                    for (const line of treeLines) {
                        if (!line.trim()) continue;
                        // Format: <mode> <type> <hash> <size>\t<path>
                        const match = line.match(/\s+blob\s+[0-9a-f]+\s+(\d+)/);
                        if (match) {
                            totalBytes += parseInt(match[1], 10);
                        }
                    }

                    if (totalBytes < 1024) projectSize = totalBytes + ' B';
                    else if (totalBytes < 1024 * 1024) projectSize = (totalBytes / 1024).toFixed(1) + ' KB';
                    else projectSize = (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
                } catch (e) { }

            } catch (e) {
                console.warn('Failed to fetch repo stats', e);
            }

            set((state: any) => ({
                git: {
                    ...state.git,
                    isRepo: true,
                    currentBranch,
                    changes,
                    log: refinedEntries,
                    rawLog,
                    branches,
                    stats: {
                        fileCount,
                        repoSize,
                        projectSize
                    },
                    isInitialized: true
                }
            }));

            await get().fetchStashes();
            await get().fetchTags();
        } catch (err) {
            console.error('Git refresh failed:', err);
            set((state: any) => ({
                git: { ...state.git, isRepo: false, isInitialized: true }
            }));
        }
    },

    fetchGitConfig: async () => {
        const { openedFolder } = get();
        if (!(window as any).electronAPI) return;

        const baseDir = openedFolder || '.';

        try {
            // Fetch Global
            const gName = await (window as any).electronAPI.gitCommand(baseDir, ['config', '--global', 'user.name']);
            const gEmail = await (window as any).electronAPI.gitCommand(baseDir, ['config', '--global', 'user.email']);

            const globalAuthor = {
                name: gName.stdout.trim(),
                email: gEmail.stdout.trim()
            };

            // Fetch Local (if folder exists)
            let projectAuthor = null;
            if (openedFolder) {
                // Explicitly check local config to differentiate from global inheritance
                const lName = await (window as any).electronAPI.gitCommand(openedFolder, ['config', '--local', 'user.name']);
                const lEmail = await (window as any).electronAPI.gitCommand(openedFolder, ['config', '--local', 'user.email']);

                // Only treat as project author if explicitly defined locally
                if (lName.stdout.trim() || lEmail.stdout.trim()) {
                    projectAuthor = {
                        name: lName.stdout.trim(),
                        email: lEmail.stdout.trim()
                    };
                }
            }

            set((state: any) => ({
                git: {
                    ...state.git,
                    globalAuthor: globalAuthor.name || globalAuthor.email ? globalAuthor : null,
                    projectAuthor
                }
            }));
        } catch (err) {
            console.error('Fetch git config failed:', err);
        }
    },

    gitStage: async (path: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['add', path]);
            await refreshGit();
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao adicionar arquivo (stage).' });
        }
    },

    gitUnstage: async (path: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            // Check if HEAD exists (to handle initial commit state where HEAD is invalid)
            const headRes = await (window as any).electronAPI.gitCommand(openedFolder, ['rev-parse', '--verify', 'HEAD']);
            const hasHead = !headRes.stderr && headRes.stdout.trim();

            if (hasHead) {
                await (window as any).electronAPI.gitCommand(openedFolder, ['reset', 'HEAD', path]);
            } else {
                // Initial commit: use rm --cached to unstage
                await (window as any).electronAPI.gitCommand(openedFolder, ['rm', '--cached', path]);
            }

            await refreshGit();
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao remover arquivo (unstage).' });
        }
    },

    gitStageAll: async () => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['add', '.']);
            await refreshGit();
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao adicionar todos os arquivos.' });
        }
    },

    gitUnstageAll: async () => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            // Check if HEAD exists
            const headRes = await (window as any).electronAPI.gitCommand(openedFolder, ['rev-parse', '--verify', 'HEAD']);
            const hasHead = !headRes.stderr && headRes.stdout.trim();
            if (hasHead) {
                await (window as any).electronAPI.gitCommand(openedFolder, ['reset', 'HEAD']);
            } else {
                await (window as any).electronAPI.gitCommand(openedFolder, ['rm', '--cached', '-r', '.']);
            }
            await refreshGit();
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao remover todos os arquivos (unstage).' });
        }
    },

    gitDiscard: async (path: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['restore', path]);
            await refreshGit();
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao descartar alterações.' });
        }
    },

    gitDiscardAll: async () => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['restore', '.']);
            await refreshGit();
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao descartar todas as alterações.' });
        }
    },

    gitCommit: async (message: string, isAmend = false) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        const args = ['commit', '-m', message];
        if (isAmend) {
            args.push('--amend');
        }
        await (window as any).electronAPI.gitCommand(openedFolder, args);
        await refreshGit();
    },

    gitStash: async (message?: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            const args = ['stash', 'push', '-u'];
            if (message) {
                args.push('-m', message);
            } else {
                args.push('-m', `Rascunho: ${new Date().toLocaleTimeString()} em ${get().git.currentBranch}`);
            }
            await (window as any).electronAPI.gitCommand(openedFolder, args);
            await refreshGit();
            get().addToast({ type: 'success', message: 'Alterações salvas na gaveta (Stash).' });
        } catch (e: any) {
            console.error('Stash error:', e);
            const msg = e.stderr || e.message || '';
            if (msg.includes('No local changes to save')) {
                get().addToast({ type: 'info', message: 'Nada para guardar no stash.' });
            } else {
                get().addToast({ type: 'error', message: 'Erro ao salvar stash.' });
            }
        }
    },

    gitPopStash: async (index = 0) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['stash', 'pop', `stash@{${index}}`]);
            await refreshGit();
            get().addToast({ type: 'success', message: 'Gaveta recuperada com sucesso.' });
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao recuperar stash (pode haver conflitos).' });
        }
    },

    gitApplyStash: async (index: number) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['stash', 'apply', `stash@{${index}}`]);
            await refreshGit();
            get().addToast({ type: 'success', message: 'Alterações aplicadas com sucesso.' });
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao aplicar stash (pode haver conflitos).' });
        }
    },

    gitDropStash: async (index: number) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['stash', 'drop', `stash@{${index}}`]);
            await refreshGit();
            get().addToast({ type: 'success', message: 'Gaveta removida.' });
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao remover stash.' });
        }
    },

    fetchStashes: async () => {
        const { openedFolder } = get();
        if (!openedFolder) return;
        try {
            const res = await (window as any).electronAPI.gitCommand(openedFolder, ['stash', 'list']);
            const output = res.stdout || '';
            const stashes: GitStashEntry[] = output.split('\n')
                .filter((l: string) => l.trim())
                .map((line: string, index: number) => {
                    // stash@{0}: On main: Rascunho: 17:50:08 em main
                    const match = /stash@{(\d+)}: (On [^:]+): (.*)/.exec(line);
                    if (match) {
                        return {
                            index: parseInt(match[1]),
                            branch: match[2].replace('On ', ''),
                            message: match[3],
                            description: line
                        };
                    }
                    return { index, branch: '?', message: line, description: line };
                });
            set((state: any) => ({ git: { ...state.git, stashes } }));
        } catch (e) {
            console.error('Error fetching stashes', e);
        }
    },

    fetchTags: async () => {
        const { openedFolder } = get();
        if (!openedFolder || !(window as any).electronAPI) return;
        try {
            // Using for-each-ref for structured output: name | hash | subject (message) | date
            const res = await (window as any).electronAPI.gitCommand(openedFolder, [
                'for-each-ref',
                '--sort=-creatordate',
                '--format=%(refname:short)|||%(objectname)|||%(contents:subject)|||%(creatordate:iso8601)',
                'refs/tags'
            ]);

            const tags: GitTag[] = res.stdout.split('\n')
                .filter((l: string) => l.trim())
                .map((line: string) => {
                    const parts = line.split('|||');
                    if (parts.length >= 2) {
                        return {
                            name: parts[0],
                            hash: parts[1],
                            message: parts[2] || undefined,
                            date: parts[3] || undefined
                        };
                    }
                    return null;
                })
                .filter(Boolean);

            set((state: any) => ({ git: { ...state.git, tags } }));
        } catch (e) {
            console.error('Error fetching tags', e);
        }
    },

    gitCreateTag: async (name: string, hash: string, message?: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            const args = ['tag'];
            if (message) {
                args.push('-a', name, '-m', message, hash);
            } else {
                args.push(name, hash);
            }
            await (window as any).electronAPI.gitCommand(openedFolder, args);
            await refreshGit();
            get().addToast({ type: 'success', message: `Tag ${name} criada com sucesso!` });
        } catch (e) {
            console.error(e);
            get().addToast({ type: 'error', message: `Erro ao criar tag ${name}` });
        }
    },

    gitDeleteTag: async (name: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['tag', '-d', name]);
            await refreshGit();
            get().addToast({ type: 'success', message: `Tag ${name} deletada.` });
        } catch (e) {
            get().addToast({ type: 'error', message: `Erro ao deletar tag ${name}` });
        }
    },

    gitClean: async () => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['clean', '-fd']);
            await refreshGit();
            get().addToast({ type: 'success', message: 'Diretório limpo com sucesso (arquivos untracked removidos).' });
        } catch (e) {
            console.error(e);
            get().addToast({ type: 'error', message: 'Erro ao limpar diretório.' });
        }
    },

    gitIgnore: async (pattern: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;

        // Use path separator logic if needed, but for now assuming forward slashes or electron handles it
        const gitignorePath = openedFolder.endsWith('/') || openedFolder.endsWith('\\')
            ? `${openedFolder}.gitignore`
            : `${openedFolder}/.gitignore`;

        try {
            let content = '';
            try {
                content = await (window as any).electronAPI.readFile(gitignorePath);
            } catch (e) {
                // File likely doesn't exist, start empty
            }

            const lines = content.split('\n').map(l => l.trim());
            if (!lines.includes(pattern)) {
                const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
                const newContent = `${content}${separator}${pattern}\n`;

                await (window as any).electronAPI.writeFile(gitignorePath, newContent);
                await refreshGit();
                get().addToast({ type: 'success', message: `"${pattern}" adicionado ao .gitignore` });
            } else {
                get().addToast({ type: 'info', message: `"${pattern}" já está no .gitignore` });
            }
        } catch (e) {
            console.error(e);
            get().addToast({ type: 'error', message: 'Erro ao atualizar .gitignore' });
        }
    },

    gitUndoLastCommit: async () => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['reset', '--soft', 'HEAD~1']);
            await refreshGit();
            get().addToast({ type: 'success', message: 'Último commit desfeito (Soft Reset).' });
        } catch (e) {
            get().addToast({ type: 'error', message: 'Erro ao desfazer commit.' });
        }
    },

    gitInit: async (author?: GitAuthor, isGlobal = false) => {
        const { openedFolder, refreshGit, setGitConfig } = get();
        if (!openedFolder) return;

        await (window as any).electronAPI.gitCommand(openedFolder, ['init']);

        if (author) {
            await setGitConfig(author, isGlobal);
        }

        await refreshGit();
    },

    setGitConfig: async (author: GitAuthor, isGlobal: boolean) => {
        const { openedFolder, fetchGitConfig } = get();
        if (!(window as any).electronAPI) return;

        const dir = openedFolder || '.';

        if (isGlobal) {
            // Setting Global Config
            const argsBase = ['config', '--global'];
            try {
                if (author.name) await (window as any).electronAPI.gitCommand(dir, [...argsBase, 'user.name', author.name]);
                if (author.email) await (window as any).electronAPI.gitCommand(dir, [...argsBase, 'user.email', author.email]);

                get().addToast({
                    type: 'success',
                    message: 'Autor Global atualizado com sucesso!'
                });
            } catch (e) {
                get().addToast({
                    type: 'error',
                    message: 'Erro ao atualizar Autor Global.'
                });
            }
        } else {
            // Setting Local Config (Explicit Override)
            try {
                if (author.name) {
                    await (window as any).electronAPI.gitCommand(dir, ['config', '--local', 'user.name', author.name]);
                }
                if (author.email) {
                    await (window as any).electronAPI.gitCommand(dir, ['config', '--local', 'user.email', author.email]);
                }

                get().addToast({
                    type: 'success',
                    message: `Autor Local definido para: ${author.name}`
                });
            } catch (e) {
                get().addToast({
                    type: 'error',
                    message: 'Erro ao definir Autor Local.'
                });
            }
        }

        await fetchGitConfig();
        console.log('Fetch config executed');
    },

    resetToGlobal: async () => {
        const { openedFolder, fetchGitConfig } = get();
        if (!(window as any).electronAPI || !openedFolder) return;

        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['config', '--local', '--unset', 'user.name']);
            await (window as any).electronAPI.gitCommand(openedFolder, ['config', '--local', '--unset', 'user.email']);

            get().addToast({
                type: 'info',
                message: 'Usando configuração Global (Local resetado).'
            });
        } catch (e) {
            get().addToast({
                type: 'error',
                message: 'Erro ao resetar para configuração Global.'
            });
        }
        await fetchGitConfig();
    },

    getCommitFiles: async (hash: string) => {
        const { openedFolder } = get();
        if (!openedFolder || !(window as any).electronAPI) return [];

        try {
            const res = await (window as any).electronAPI.gitCommand(openedFolder, ['show', '--name-status', '--pretty=format:', hash]);
            return res.stdout.split('\n')
                .filter((line: string) => line.trim() !== '')
                .map((line: string) => {
                    const parts = line.split(/\t/);
                    const status = parts[0];
                    const path = parts[1] || "";
                    return { status, path };
                });
        } catch (err) {
            console.error('Failed to get commit files:', err);
            return [];
        }
    },

    addGitProfile: (profile: Omit<GitProfile, 'id'>) => {
        const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newProfiles = [...get().gitProfiles, { ...profile, id }];
        localStorage.setItem('gitProfiles', JSON.stringify(newProfiles));
        set({ gitProfiles: newProfiles });
    },

    removeGitProfile: (id: string) => {
        const newProfiles = get().gitProfiles.filter((p: GitProfile) => p.id !== id);
        localStorage.setItem('gitProfiles', JSON.stringify(newProfiles));
        set({ gitProfiles: newProfiles });
    },

    updateGitProfile: (id: string, updates: Partial<Omit<GitProfile, 'id'>>) => {
        const newProfiles = get().gitProfiles.map((p: GitProfile) =>
            p.id === id ? { ...p, ...updates } : p
        );
        localStorage.setItem('gitProfiles', JSON.stringify(newProfiles));
        set({ gitProfiles: newProfiles });
    },


    addCommitTemplate: (template: Omit<CommitTemplate, 'id'>) => {
        const id = generateId();
        const newTemplates = [...get().commitTemplates, { ...template, id }];
        localStorage.setItem('commitTemplates', JSON.stringify(newTemplates));
        set({ commitTemplates: newTemplates });
    },

    removeCommitTemplate: (id: string) => {
        const newTemplates = get().commitTemplates.filter((t: CommitTemplate) => t.id !== id);
        localStorage.setItem('commitTemplates', JSON.stringify(newTemplates));
        set({ commitTemplates: newTemplates });
    },

    addToast: (toast) => {
        const id = generateId();
        const duration = toast.duration || 3000;
        set((state: any) => ({ toasts: [...state.toasts, { ...toast, id }] }));

        setTimeout(() => {
            get().removeToast(id);
        }, duration);
    },

    removeToast: (id) => {
        set((state: any) => ({ toasts: state.toasts.filter((t: Toast) => t.id !== id) }));
    },

    changeBranch: async (branch: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['checkout', branch]);
            await refreshGit();
            get().addToast({ type: 'success', message: `Mudou para o branch ${branch}` });
        } catch (e) {
            get().addToast({ type: 'error', message: `Erro ao mudar para o branch ${branch}` });
        }
    },

    createBranch: async (branch: string, startPoint?: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            const args = ['checkout', '-b', branch];
            if (startPoint) args.push(startPoint);
            await (window as any).electronAPI.gitCommand(openedFolder, args);
            await refreshGit();
            get().addToast({ type: 'success', message: `Branch ${branch} criado com sucesso!` });
        } catch (e) {
            get().addToast({ type: 'error', message: `Erro ao criar branch ${branch}` });
        }
    },

    checkoutCommit: async (hash: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['checkout', hash]);
            await refreshGit();
        } catch (e) {
            get().addToast({ type: 'error', message: `Erro ao mudar para a versão ${hash}` });
        }
    },

    deleteBranch: async (branch: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        try {
            await (window as any).electronAPI.gitCommand(openedFolder, ['branch', '-D', branch]);
            await refreshGit();
            get().addToast({ type: 'success', message: `Branch ${branch} deletado.` });
        } catch (e) {
            get().addToast({ type: 'error', message: `Erro ao deletar branch ${branch}` });
        }
    }
}));
