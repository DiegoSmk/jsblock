import type { StateCreator } from 'zustand';
import type { AppState } from '../../types/store';
import type { AppNode, AppNodeData } from '../../features/editor/types';
import type { Connection, Edge, EdgeChange, NodeChange } from '@xyflow/react';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { parseCodeToFlowAsync } from '../../features/editor/logic/CodeParser';
import { generateCodeFromFlow } from '../../features/editor/logic/CodeGenerator';
import { getLayoutedElements } from '../../features/editor/logic/layout';
import { validateConnection } from '../../features/editor/logic/connectionLogic';

const initialCode = '';

export interface FlowSlice {
    code: string;
    nodes: AppNode[];
    edges: Edge[];
    connectionCache: Map<string, Edge[]>;
    navigationStack: { id: string, label: string }[];
    activeScopeId: string;
    saveTimeout: ReturnType<typeof setTimeout> | null;

    setCode: (code: string, shouldSetDirty?: boolean, debounce?: boolean) => void;
    onNodesChange: (changes: NodeChange<AppNode>[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    removeEdges: (edgeIds: string[]) => void;
    onConnect: (connection: Connection) => void;
    forceLayout: () => void;
    updateNodeData: (nodeId: string, newData: Partial<AppNodeData>) => void;
    updateEdge: (edgeId: string, updates: Partial<Edge>) => void;
    getEdgesForNode: (nodeId: string) => Edge[];
}

export const createFlowSlice: StateCreator<AppState, [], [], FlowSlice> = (set, get) => ({
    code: initialCode,
    nodes: [],
    edges: [],
    connectionCache: new Map(),
    navigationStack: [{ id: 'root', label: 'Main' }],
    activeScopeId: 'root',
    saveTimeout: null,

    setCode: (code: string, shouldSetDirty = true, debounce = true) => {
        set({ code });

        if (get().saveTimeout) {
            clearTimeout(get().saveTimeout as unknown as number);
        }

        if (shouldSetDirty) {
            if (get().autoSave) {
                const timeout = setTimeout(() => {
                    void get().saveFile();
                }, 1000);
                set({ saveTimeout: timeout as unknown as ReturnType<typeof setTimeout> });
            } else {
                set({ isDirty: true });
            }
        }

        parseCodeToFlowAsync(code).then(({ nodes, edges }) => {
            if (get().code !== code) return;

            const currentStack = get().navigationStack;
            const currentScopeId = get().activeScopeId;
            const activeNodeExists = currentScopeId === 'root' || nodes.some(n => n.id === currentScopeId);

            const hasCanvasPattern = code.includes('canvasData');
            const hasCanvasNode = nodes.some(n => n.type === 'canvasNode');

            let finalNodes = nodes;
            if (hasCanvasPattern && !hasCanvasNode) {
                finalNodes = [
                    ...nodes,
                    {
                        id: 'pattern-canvas-node',
                        type: 'canvasNode',
                        position: { x: 500, y: 100 },
                        data: { label: 'Canvas Viewer', scopeId: 'root' }
                    }
                ];
            }

            set({
                nodes: finalNodes,
                edges,
                navigationStack: activeNodeExists ? currentStack : [{ id: 'root', label: 'Main' }],
                activeScopeId: activeNodeExists ? currentScopeId : 'root'
            });

            if (debounce) {
                get().runExecutionDebounced(code);
            } else {
                get().runExecution(code);
            }
        }).catch(err => {
            console.error('Parsing failed', err);
        });
    },

    onNodesChange: (changes: NodeChange<AppNode>[]) => {
        const nextNodes = applyNodeChanges(changes, get().nodes);
        const deletions = changes.filter(c => c.type === 'remove');

        if (deletions.length > 0) {
            const newCache = new Map(get().connectionCache);
            deletions.forEach(d => newCache.delete(d.id));
            const deletedIds = new Set(deletions.map(d => d.id));
            const activeEdges = get().edges.filter(edge => !deletedIds.has(edge.source) && !deletedIds.has(edge.target));
            set({ nodes: nextNodes, edges: activeEdges, connectionCache: newCache });
        } else {
            set({ nodes: nextNodes });
        }

        if (get().isBlockFile) {
            if (get().autoSave) {
                if (get().saveTimeout) {
                    clearTimeout(get().saveTimeout as unknown as number);
                }
                const timeout = setTimeout(() => {
                    void get().saveFile();
                }, 1000);
                set({ saveTimeout: timeout as unknown as ReturnType<typeof setTimeout> });
            } else {
                set({ isDirty: true });
            }
        }
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        const { nodes, edges, code, isBlockFile, autoSave } = get();
        const newEdges = applyEdgeChanges(changes, edges);
        const nextCache = new Map(get().connectionCache);

        changes.forEach(change => {
            if (change.type === 'remove') {
                const edge = edges.find(e => e.id === change.id);
                if (edge) {
                    const sourceEdges = nextCache.get(edge.source) ?? [];
                    nextCache.set(edge.source, sourceEdges.filter(e => e.id !== edge.id));
                    const targetEdges = nextCache.get(edge.target) ?? [];
                    nextCache.set(edge.target, targetEdges.filter(e => e.id !== edge.id));
                }
            } else if (change.type === 'add') {
                const edge = 'item' in change ? change.item : null;
                if (edge) {
                    const sourceEdges = nextCache.get(edge.source) ?? [];
                    nextCache.set(edge.source, [...sourceEdges, edge]);
                    const targetEdges = nextCache.get(edge.target) ?? [];
                    nextCache.set(edge.target, [...targetEdges, edge]);
                }
            }
        });

        set({ edges: newEdges, connectionCache: nextCache });

        if (isBlockFile) {
            if (autoSave) {
                if (get().saveTimeout) {
                    clearTimeout(get().saveTimeout as unknown as number);
                }
                const timeout = setTimeout(() => {
                    void get().saveFile();
                }, 1000);
                set({ saveTimeout: timeout as unknown as ReturnType<typeof setTimeout> });
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
                if (get().saveTimeout) {
                    clearTimeout(get().saveTimeout as unknown as number);
                }
                const timeout = setTimeout(() => {
                    void get().saveFile();
                }, 1000);
                set({ saveTimeout: timeout as unknown as ReturnType<typeof setTimeout> });
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

        if (!validateConnection(connection, nodes)) return;

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

    updateNodeData: (nodeId, newData) => {
        set(state => {
            const { code, edges, isBlockFile, autoSave } = state;
            const updatedNodes = state.nodes.map((n: AppNode) =>
                n.id === nodeId ? { ...n, data: { ...n.data, ...newData, updatedAt: Date.now() } } : n
            );

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

        const { isBlockFile, autoSave } = get();
        if (newData.checked !== undefined) {
            get().checkTaskRecurse(nodeId);
        }

        if (isBlockFile && autoSave) {
            if (get().saveTimeout) {
                clearTimeout(get().saveTimeout as unknown as number);
            }
            const timeout = setTimeout(() => {
                void get().saveFile();
            }, 1000);
            set({ saveTimeout: timeout as unknown as ReturnType<typeof setTimeout> });
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
            if (get().saveTimeout) {
                clearTimeout(get().saveTimeout as unknown as number);
            }
            const timeout = setTimeout(() => {
                void get().saveFile();
            }, 1000);
            set({ saveTimeout: timeout as unknown as ReturnType<typeof setTimeout> });
        }
    },

    getEdgesForNode: (nodeId: string) => {
        return get().edges.filter(e => e.source === nodeId || e.target === nodeId);
    }
});
