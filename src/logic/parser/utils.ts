
import type { Edge, Node } from '@xyflow/react';

export const EDGE_STYLE_DEFAULT = { strokeWidth: 2, stroke: '#b1b1b7' };

export const createEdge = (source: string, target: string, sourceHandle: string, targetHandle: string, animated = true): Edge => {
    return {
        id: `e-${source}-${sourceHandle}-to-${target}-${targetHandle}-${Math.random().toString(36).substr(2, 5)}`,
        source,
        target,
        sourceHandle,
        targetHandle,
        animated,
        style: EDGE_STYLE_DEFAULT
    };
};

export const generateId = (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 6)}`;
};

export const createGroupNode = (label: string): Node => {
    return {
        id: generateId('group'),
        type: 'groupNode',
        position: { x: 0, y: 0 },
        data: { label },
        style: { zIndex: -1 } // Put background behind everything
    } as any;
};

const NATIVE_GLOBALS = new Set(['console', 'Math', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Promise', 'window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'fetch', 'setTimeout', 'setInterval', 'alert', 'confirm', 'prompt']);

export const isNativeApi = (name: string): boolean => {
    if (!name) return false;
    // Check if it's a global call like alert()
    if (NATIVE_GLOBALS.has(name)) return true;
    // Check if it's a member call like console.log or Math.random
    const root = name.split('.')[0];
    return NATIVE_GLOBALS.has(root);
};

