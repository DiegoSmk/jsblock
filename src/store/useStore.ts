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
import { parseCodeToFlow } from '../logic/CodeParser';
import { generateCodeFromFlow } from '../logic/CodeGenerator';
import { getLayoutedElements } from '../logic/layout';
import i18n from '../i18n/config';

type RecentEnvironment = {
    path: string;
    lastOpened: number; // timestamp
    label?: 'personal' | 'work' | 'fun' | 'other';
    isFavorite?: boolean;
};

type GitFileStatus = {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged';
    index: string;
    workingTree: string;
};

type GitLogEntry = {
    hash: string;
    author: string;
    date: string;
    message: string;
    graph?: string;
};

type GitAuthor = {
    name: string;
    email: string;
};

type AppState = {
    code: string;
    nodes: Node[];
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
    onNodesChange: (changes: NodeChange[]) => void;
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
    } | null;
    openModal: (config: Omit<AppState['modal'], 'isOpen'>) => void;
    closeModal: () => void;
    setConfirmationModal: (config: AppState['confirmationModal']) => void;

    // UI State
    showSidebar: boolean;
    activeSidebarTab: 'explorer' | 'library' | 'git';
    showCode: boolean;
    showCanvas: boolean;
    toggleSidebar: () => void;
    setSidebarTab: (tab: 'explorer' | 'library' | 'git') => void;
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
    loadContentForFile: (path: string) => Promise<void>;
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
    };
    refreshGit: () => Promise<void>;
    fetchGitConfig: () => Promise<void>;
    gitStage: (path: string) => Promise<void>;
    gitUnstage: (path: string) => Promise<void>;
    gitCommit: (message: string) => Promise<void>;
    gitInit: (author?: GitAuthor, isGlobal?: boolean) => Promise<void>;
    setGitConfig: (author: GitAuthor, isGlobal: boolean) => Promise<void>;
};

const initialCode = '';

let saveTimeout: any = null;

export const useStore = create<AppState>((set: any, get: any) => ({
    code: initialCode,
    nodes: [],
    edges: [],
    theme: 'dark',
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
        projectAuthor: null
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

        let newRecents = [...recentEnvironments];
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
    setSidebarTab: (tab: 'explorer' | 'library' | 'git') => set({ activeSidebarTab: tab, showSidebar: true }),
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

                const originalExpr = (callNode.data as any).expression;
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

        set({ selectedFile: path, isDirty: false });
        await get().loadContentForFile(path);
    },

    loadContentForFile: async (path: string) => {
        if (path && (window as any).electronAPI) {
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

            // Get status
            const statusRes = await (window as any).electronAPI.gitCommand(openedFolder, ['status', '--porcelain', '-b']);
            // Parse porcelain status
            const lines = statusRes.stdout.split('\n').filter((l: string) => l.trim() !== '');
            const changes: GitFileStatus[] = lines
                .filter((l: string) => !l.startsWith('##'))
                .map((line: string) => {
                    const index = line[0];
                    const workingTree = line[1];
                    const path = line.substring(3);
                    let status: GitFileStatus['status'] = 'modified';
                    if (index === '?' || workingTree === '?') status = 'untracked';
                    else if (index === 'A') status = 'added';
                    else if (index === 'D' || workingTree === 'D') status = 'deleted';
                    else if (index === 'R') status = 'renamed';

                    return { path, status, index, workingTree };
                });

            // Get Log
            const logRes = await (window as any).electronAPI.gitCommand(openedFolder, ['log', '--graph', '--oneline', '--all', '-n', '20', '--pretty=format:"%h|%an|%ar|%s"']);
            const rawLog = logRes.stdout;

            // Parse log entries from raw output (hacky but works for simplified view)
            const logEntries: GitLogEntry[] = logRes.stdout.split('\n')
                .filter((l: string) => l.includes('|'))
                .map((line: string) => {
                    // line might look like "* \"hash|author|date|msg\""
                    const content = line.match(/"([^"]+)"/)?.[1] || "";
                    const [hash, author, date, message] = content.split('|');
                    const graph = line.split('"')[0]; // Everything before the quote is the graph part
                    return { hash, author, date, message, graph };
                });

            set((state: any) => ({
                git: {
                    ...state.git,
                    isRepo: true,
                    currentBranch,
                    changes,
                    log: logEntries,
                    rawLog
                }
            }));
        } catch (err) {
            console.error('Git refresh failed:', err);
            set((state: any) => ({
                git: { ...state.git, isRepo: false }
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
                const lName = await (window as any).electronAPI.gitCommand(openedFolder, ['config', 'user.name']);
                const lEmail = await (window as any).electronAPI.gitCommand(openedFolder, ['config', 'user.email']);
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
        await (window as any).electronAPI.gitCommand(openedFolder, ['add', path]);
        await refreshGit();
    },

    gitUnstage: async (path: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        await (window as any).electronAPI.gitCommand(openedFolder, ['restore', '--staged', path]);
        await refreshGit();
    },

    gitCommit: async (message: string) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        await (window as any).electronAPI.gitCommand(openedFolder, ['commit', '-m', `"${message}"`]);
        await refreshGit();
    },

    gitInit: async (author?: GitAuthor, isGlobal: boolean = false) => {
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

        const target = isGlobal ? '--global' : '';
        const dir = openedFolder || '.';

        if (author.name) {
            await (window as any).electronAPI.gitCommand(dir, ['config', target, 'user.name', `"${author.name}"`]);
        }
        if (author.email) {
            await (window as any).electronAPI.gitCommand(dir, ['config', target, 'user.email', `"${author.email}"`]);
        }

        await fetchGitConfig();
    },
}));
