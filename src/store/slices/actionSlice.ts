import type { StateCreator } from 'zustand';
import type { AppState, AppNode, UtilityType } from '../../types/store';
import type { Edge } from '@xyflow/react';
import { generateCodeFromFlow } from '../../features/editor/logic/CodeGenerator';

const getUUID = (prefix = 'id') => {
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
    return `${prefix}-${uuid}`;
};

const getUtilityDefinition = (type: UtilityType) => {
    switch (type) {
        case 'todo':
            return {
                label: 'To-Do Item',
                color: '#ff9f43',
                icon: 'check-square',
                defaultData: { checked: false, text: '' }
            };
        case 'note':
            return {
                label: 'Note',
                color: '#fff200',
                icon: 'sticky-note',
                defaultData: { text: '' }
            };
        case 'link':
            return {
                label: 'Link',
                color: '#0abde3',
                icon: 'link',
                defaultData: { url: 'https://' }
            };
        case 'image':
            return {
                label: 'Image',
                color: '#ff6b6b',
                icon: 'image',
                defaultData: { src: '' }
            };
        default:
            return {
                label: 'Utility',
                color: '#576574',
                icon: 'box',
                defaultData: {}
            };
    }
};

export interface ActionSlice {
    addCanvasNode: () => void;
    addFunctionCall: (funcName: string, args?: string[]) => void;
    addLogicNode: () => void;
    addIfNode: () => void;
    addSwitchNode: () => void;
    addWhileNode: () => void;
    addForNode: () => void;
    promoteToVariable: (literalNodeId: string, literalValue: unknown, type: string) => void;
    promoteCallToVariable: (callNodeId: string) => void;
    navigateInto: (scopeId: string, label: string) => void;
    navigateBack: () => void;
    navigateToScope: (index: number) => void;
    addNoteNode: () => void;
    addUtilityNode: (type: UtilityType) => void;
    checkTaskRecurse: (nodeId: string) => void;
    spawnConnectedUtility: (sourceId: string, type: UtilityType, label: string, position: { x: number, y: number }, checked?: boolean) => void;
    spawnMultipleConnectedUtilities: (sourceId: string, utilities: { type: UtilityType, label: string, position: { x: number, y: number }, checked?: boolean }[]) => void;
}

export const createActionSlice: StateCreator<AppState, [], [], ActionSlice> = (set, get) => ({
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

    addFunctionCall: (funcName, args = []) => {
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

    promoteToVariable: (literalNodeId, literalValue, type) => {
        const { openModal, setCode, nodes, code, edges } = get();
        openModal({
            title: 'Promover para Variável',
            initialValue: '',
            type,
            onSubmit: (varName: string) => {
                let formattedValue = String(literalValue);
                if (type === 'string' && !formattedValue.startsWith("'") && !formattedValue.startsWith('"')) {
                    formattedValue = `'${formattedValue}'`;
                }
                const baseCode = `const ${varName} = ${formattedValue};\n${code}`;
                const newEdges = edges.map((e) =>
                    e.source === literalNodeId ? { ...e, source: `var-${varName}` } : e
                );
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

    promoteCallToVariable: (callNodeId) => {
        const { openModal } = get();
        openModal({
            title: 'Atribuir a Nova Variável',
            initialValue: '',
            type: 'function-return',
            onSubmit: (varName: string) => {
                const { code, nodes } = get();
                const callNode = nodes.find((n) => n.id === callNodeId);
                if (!callNode) return;
                const originalExpr = callNode.data.expression;
                if (!originalExpr) return;
                const callStatement = originalExpr + (originalExpr.endsWith(';') ? '' : ';');
                // This would require more complex code manipulation logic, but let's keep it minimal for now
                const newCode = code.replace(callStatement, `const ${varName} = ${originalExpr};`);
                get().setCode(newCode);
            }
        });
    },

    navigateInto: (scopeId, label) => set(state => ({
        activeScopeId: scopeId,
        navigationStack: [...state.navigationStack, { id: scopeId, label }]
    })),

    navigateBack: () => set(state => {
        if (state.navigationStack.length <= 1) return state;
        const newStack = state.navigationStack.slice(0, -1);
        return {
            navigationStack: newStack,
            activeScopeId: newStack[newStack.length - 1].id
        };
    }),

    navigateToScope: (index) => set(state => {
        const newStack = state.navigationStack.slice(0, index + 1);
        return {
            navigationStack: newStack,
            activeScopeId: newStack[newStack.length - 1].id
        };
    }),

    addNoteNode: () => {
        const { nodes, activeScopeId, isBlockFile, autoSave } = get();
        const newNode: AppNode = {
            id: getUUID('note'),
            type: 'noteNode',
            position: { x: 100, y: 100 },
            data: { label: 'Nova Nota', scopeId: activeScopeId, text: '' }
        };
        set({ nodes: [...nodes, newNode] });

        if (isBlockFile) {
            if (autoSave) void get().saveFile();
            else set({ isDirty: true });
        }
    },

    addUtilityNode: (type) => {
        const { nodes, activeScopeId, isBlockFile, autoSave } = get();
        const def = getUtilityDefinition(type);
        const newNode: AppNode = {
            id: getUUID('util'),
            type: 'utilityNode',
            position: { x: 100, y: 100 },
            data: {
                label: def.label,
                scopeId: activeScopeId,
                utilityType: type,
                ...def.defaultData
            }
        };
        set({ nodes: [...nodes, newNode] });

        if (isBlockFile) {
            if (autoSave) void get().saveFile();
            else set({ isDirty: true });
        }
    },

    checkTaskRecurse: (nodeId: string) => {
        const { nodes, updateNodeData, getEdgesForNode } = get();
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.type !== 'utilityNode') return;

        const isChecked = !!node.data.checked;
        const outgoingEdges = getEdgesForNode(nodeId).filter(e => e.source === nodeId);

        outgoingEdges.forEach(edge => {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (targetNode && targetNode.type === 'utilityNode') {
                updateNodeData(targetNode.id, { checked: isChecked });
                get().checkTaskRecurse(targetNode.id);
            }
        });
    },

    spawnConnectedUtility: (sourceId, type, label, position, checked = false) => {
        const { nodes, edges, code, activeScopeId } = get();
        const newId = getUUID('util');

        const newNode: AppNode = {
            id: newId,
            type: 'utilityNode',
            position,
            data: {
                label,
                utilityType: type,
                checked,
                scopeId: activeScopeId
            }
        };

        const newEdge = {
            id: `edge-${sourceId}-${newId}`,
            source: sourceId,
            target: newId,
            type: 'default'
        };

        const updatedNodes = [...nodes, newNode];
        const updatedEdges = [...edges, newEdge];

        // Se for um arquivo de bloco, apenas atualizamos o estado
        if (get().isBlockFile) {
            set({ nodes: updatedNodes, edges: updatedEdges });
            if (get().autoSave) void get().saveFile();
            else set({ isDirty: true });
        } else {
            // Se for código JS, regeneramos o código
            const newCode = generateCodeFromFlow(code, updatedNodes, updatedEdges);
            get().setCode(newCode);
        }
    },

    spawnMultipleConnectedUtilities: (sourceId, utilities) => {
        const { nodes, edges, code, activeScopeId, isBlockFile, autoSave, saveFile } = get();
        const currentNodes = [...nodes];
        const currentEdges = [...edges];

        utilities.forEach(util => {
            const newId = getUUID('util');
            const newNode: AppNode = {
                id: newId,
                type: 'utilityNode',
                position: util.position,
                data: {
                    label: util.label,
                    utilityType: util.type,
                    checked: util.checked ?? false,
                    scopeId: activeScopeId
                }
            };

            const newEdge: Edge = {
                id: `edge-${sourceId}-${newId}`,
                source: sourceId,
                target: newId,
                type: 'default'
            };

            currentNodes.push(newNode);
            currentEdges.push(newEdge);
        });

        if (isBlockFile) {
            set({ nodes: currentNodes, edges: currentEdges });
            if (autoSave) void saveFile();
            else set({ isDirty: true });
        } else {
            const newCode = generateCodeFromFlow(code, currentNodes, currentEdges);
            get().setCode(newCode);
        }
    }
});
