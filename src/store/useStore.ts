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

    setCode: (code: string) => void;
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
        onSubmit: (name: string) => void;
    };
    openModal: (config: Omit<AppState['modal'], 'isOpen'>) => void;
    closeModal: () => void;

    // UI State
    showSidebar: boolean;
    activeSidebarTab: 'explorer' | 'library';
    showCode: boolean;
    showCanvas: boolean;
    toggleSidebar: () => void;
    setSidebarTab: (tab: 'explorer' | 'library') => void;
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
    setOpenedFolder: (path: string | null) => void;
    setSelectedFile: (path: string | null) => Promise<void>;
    saveFile: () => Promise<void>;
};

const initialCode = '';

export const useStore = create<AppState>((set: any, get: any) => ({
    code: initialCode,
    nodes: [],
    edges: [],
    theme: 'dark',
    runtimeValues: {},
    navigationStack: [{ id: 'root', label: 'Main' }],
    activeScopeId: 'root',
    showSidebar: true,
    activeSidebarTab: 'explorer',
    showCode: true,
    showCanvas: true,
    isBlockFile: false,
    openedFolder: null,
    selectedFile: null,
    toggleSidebar: () => set({ showSidebar: !get().showSidebar }),
    setSidebarTab: (tab: 'explorer' | 'library') => set({ activeSidebarTab: tab, showSidebar: true }),
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

    setCode: (code: string) => {
        const { nodes, edges } = parseCodeToFlow(code);

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
            get().saveFile();
        }
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        const { nodes, edges, code, isBlockFile } = get();
        const newEdges = applyEdgeChanges(changes, edges);
        set({ edges: newEdges });

        if (isBlockFile) {
            get().saveFile();
        } else {
            const newCode = generateCodeFromFlow(code, nodes, newEdges);
            get().setCode(newCode);
        }
    },

    onConnect: (connection: Connection) => {
        const { nodes, edges, code, isBlockFile } = get();
        const newEdges = addEdge(connection, edges);
        set({ edges: newEdges });

        if (isBlockFile) {
            get().saveFile();
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
        const { nodes, code, edges, isBlockFile } = get();
        const updatedNodes = nodes.map((n: Node) => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n);
        set({ nodes: updatedNodes });

        if (isBlockFile) {
            get().saveFile();
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
        if (path && (window as any).electronAPI) {
            await (window as any).electronAPI.ensureProjectConfig(path);
        }
    },

    setSelectedFile: async (path) => {
        set({ selectedFile: path });
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
                    get().setCode(content);
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
                console.log('File saved successfully');
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
}));
