import type { StateCreator } from 'zustand';
import type { AppState } from '../../types/store';
import type { AppNode, AppNodeData } from '../../features/editor/types';
import type { Connection, Edge, EdgeChange, NodeChange } from '@xyflow/react';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { parseCodeToFlowAsync } from '../../features/editor/logic/CodeParser';
import { generateCodeFromFlow } from '../../features/editor/logic/CodeGenerator';
import { getLayoutedElements } from '../../features/editor/logic/layout';
import { validateConnection } from '../../features/editor/logic/connectionLogic';
import { buildEdgeIndex, addToEdgeIndex, removeFromEdgeIndex, updateInEdgeIndex, syncEdgeIndex } from '../utils/edgeIndex';

const initialCode = '';

export interface FlowSlice {
    code: string;
    nodes: AppNode[];
    edges: Edge[];
    navigationStack: { id: string, label: string }[];
    activeScopeId: string;
    viewport: { x: number, y: number, zoom: number };
    edgeIndex: Map<string, Edge[]>;
    saveTimeout: ReturnType<typeof setTimeout> | null;

    setCode: (code: string, shouldSetDirty?: boolean, debounce?: boolean) => void;
    onNodesChange: (changes: NodeChange<AppNode>[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    removeEdges: (edgeIds: string[]) => void;
    onConnect: (connection: Connection) => void;
    forceLayout: () => void;
    updateNodeData: (nodeId: string, newData: Partial<AppNodeData>) => void;
    updateEdge: (edgeId: string, updates: Partial<Edge>) => void;
    onViewportChange: (viewport: { x: number, y: number, zoom: number }) => void;
    getEdgesForNode: (nodeId: string) => Edge[];
}

export const createFlowSlice: StateCreator<AppState, [], [], FlowSlice> = (set, get) => ({
    code: initialCode,
    nodes: [],
    edges: [],
    navigationStack: [{ id: 'root', label: 'Main' }],
    activeScopeId: 'root',
    viewport: { x: 0, y: 0, zoom: 1 },
    edgeIndex: new Map(),
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
                edgeIndex: buildEdgeIndex(edges),
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
            const deletedIds = new Set(deletions.map(d => d.id));
            const activeEdges = get().edges.filter(edge => !deletedIds.has(edge.source) && !deletedIds.has(edge.target));
            set({ nodes: nextNodes, edges: activeEdges, edgeIndex: buildEdgeIndex(activeEdges) });
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
        const { nodes, edges, code, isBlockFile, autoSave, edgeIndex } = get();
        const newEdges = applyEdgeChanges(changes, edges);
        set({ edges: newEdges, edgeIndex: syncEdgeIndex(edgeIndex, edges, newEdges, changes) });

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
        const removedEdges = edges.filter(e => edgeIds.includes(e.id));
        const newEdges = edges.filter(e => !edgeIds.includes(e.id));

        set({
            edges: newEdges,
            edgeIndex: removeFromEdgeIndex(get().edgeIndex, removedEdges)
        });

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
        // Incremental update for simple connection
        set({
            edges: newEdges,
            edgeIndex: addToEdgeIndex(get().edgeIndex, [newEdges[newEdges.length - 1]])
        });

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
        set((state) => {
            const oldEdge = state.edges.find(e => e.id === edgeId);
            if (!oldEdge) return {};

            const newEdge = { ...oldEdge, ...updates };
            const updatedEdges = state.edges.map(e => e.id === edgeId ? newEdge : e);

            return {
                edges: updatedEdges,
                edgeIndex: updateInEdgeIndex(state.edgeIndex, oldEdge, newEdge),
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
        return get().edgeIndex.get(nodeId) || [];
    },

    onViewportChange: (viewport) => {
        set({ viewport });
        if (get().isBlockFile && get().autoSave) {
            if (get().saveTimeout) {
                clearTimeout(get().saveTimeout as unknown as number);
            }
            const timeout = setTimeout(() => {
                void get().saveFile();
            }, 2000); // Wait longer for viewport
            set({ saveTimeout: timeout as unknown as ReturnType<typeof setTimeout> });
        }
    }
});
