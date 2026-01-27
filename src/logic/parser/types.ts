
import type { Node, Edge } from '@xyflow/react';

export interface ParserContext {
    nodes: Node[];
    edges: Edge[];
    variableNodes: Record<string, string>; // Map varName -> NodeID
    body: any[]; // AST Body for indexing reference
    indexCounter: { value: number }; // Global unique counter
    currentParentId?: string; // Track containing block
    nativeApiNodeId?: string; // ID for the JS Runtime node
    currentScopeId: string; // Hierarchical scope level
    processBlock: (bodyNode: any, entryNodeId: string, flowHandle: string, label: string, preNodes?: any[]) => void;
}

export interface ParserHandler {
    canHandle(statement: any): boolean;
    handle(statement: any, context: ParserContext, parentId?: string, handleName?: string, idSuffix?: string): string | undefined;
}
