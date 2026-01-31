
import type { Edge } from '@xyflow/react';
import type { Node as BabelNode } from '@babel/types';
import type { AppNode } from '../../types/store';


export interface ParserContext {
    nodes: AppNode[];
    edges: Edge[];
    variableNodes: Record<string, string>; // Map varName -> NodeID
    body: BabelNode[]; // AST Body for indexing reference
    indexCounter: { value: number }; // Global unique counter
    currentParentId?: string; // Track containing block
    nativeApiNodeId?: string; // ID for the JS Runtime node
    currentScopeId: string; // Hierarchical scope level
    processBlock: (bodyNode: BabelNode | BabelNode[], entryNodeId: string, flowHandle: string, label: string, preNodes?: AppNode[]) => void;
}

export interface ParserHandler {
    canHandle(node: BabelNode): boolean;
    handle(node: BabelNode, context: ParserContext, parentId?: string, handleName?: string, idSuffix?: string): string | undefined;
}
