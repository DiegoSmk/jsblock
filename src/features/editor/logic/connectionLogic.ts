import type { Connection, Edge } from '@xyflow/react';
import type { AppNode } from '../../../types/store';

export const validateConnection = (connection: Connection | Edge, nodes: AppNode[]): boolean => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    const isHybridSource = sourceNode.type === 'noteNode' || sourceNode.type === 'utilityNode';
    const isHybridTarget = targetNode.type === 'noteNode' || targetNode.type === 'utilityNode';

    // Hybrid Connection Logic: If either is a note/utility, we allow more freedom
    if (isHybridSource || isHybridTarget) {
        // Allow self-connections for notes? Usually not useful but maybe for loops.
        // Plan says: "Hybrid Connection (multiple inputs/outputs, no direction restriction)"
        // But usually source != target is a physical constraint of React Flow unless configured otherwise.
        // We will allow it generally, but maybe block self-connection to avoid infinite loop complexity if not needed.
        // However, "Check de Domínio" implies we just distinguish between Semantic (Code) and Hybrid.
        return true;
    }

    // Semantic Connection Logic (Code Nodes)
    // 1. No self-connections
    if (connection.source === connection.target) return false;

    // 2. Strict direction is usually enforced by handle types (source to target), which React Flow does automatically.
    // We can add data type checking here later if needed.

    return true;
};
