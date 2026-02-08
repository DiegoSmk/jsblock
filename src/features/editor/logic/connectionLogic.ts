import type { Connection, Edge } from '@xyflow/react';
import type { AppNode } from '../types';

const isFlowHandle = (handleId: string | null | undefined): boolean => {
    if (!handleId) return false;
    return handleId.startsWith('flow') ||
           handleId === 'true' ||
           handleId === 'false' ||
           handleId === 'default';
};

export const validateConnection = (connection: Connection | Edge, nodes: AppNode[]): boolean => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    const isHybridSource = sourceNode.type === 'noteNode' || sourceNode.type === 'utilityNode';
    const isHybridTarget = targetNode.type === 'noteNode' || targetNode.type === 'utilityNode';

    // Hybrid Connection Logic: If either is a note/utility, we allow more freedom
    if (isHybridSource || isHybridTarget) {
        return true;
    }

    // Semantic Connection Logic (Code Nodes)
    // 1. No self-connections
    if (connection.source === connection.target) return false;

    // 2. Flow Connections vs Data Connections
    const isSourceFlow = isFlowHandle(connection.sourceHandle);
    const isTargetFlow = isFlowHandle(connection.targetHandle);

    // Prevent mixing flow and data handles
    if (isSourceFlow !== isTargetFlow) return false;

    // 3. Type Checking (Only for Data Connections)
    if (!isSourceFlow && !isTargetFlow) {
        const sourceType = sourceNode.data.typeAnnotation;
        const targetType = targetNode.data.typeAnnotation;

        // If both have type annotations, check compatibility
        if (sourceType && targetType) {
            const normalizedSource = sourceType.toLowerCase();
            const normalizedTarget = targetType.toLowerCase();

            // Allow 'any' or 'unknown' to bypass checks
            if (normalizedSource === 'any' || normalizedSource === 'unknown' ||
                normalizedTarget === 'any' || normalizedTarget === 'unknown') {
                return true;
            }

            // Strict equality check
            if (normalizedSource !== normalizedTarget) {
                return false;
            }
        }
    }

    return true;
};
