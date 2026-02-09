import { describe, it, expect } from 'vitest';
import { validateConnection } from './connectionLogic';
import type { AppNode } from '../types';
import type { Connection } from '@xyflow/react';

describe('validateConnection', () => {
    const mockNodes: AppNode[] = [
        {
            id: 'node-1',
            type: 'functionNode',
            data: { label: 'Node 1', typeAnnotation: 'string' },
            position: { x: 0, y: 0 },
        },
        {
            id: 'node-2',
            type: 'functionNode',
            data: { label: 'Node 2', typeAnnotation: 'string' },
            position: { x: 100, y: 100 },
        },
        {
            id: 'node-3',
            type: 'functionNode',
            data: { label: 'Node 3', typeAnnotation: 'number' },
            position: { x: 200, y: 200 },
        },
        {
            id: 'node-any',
            type: 'functionNode',
            data: { label: 'Node Any', typeAnnotation: 'any' },
            position: { x: 300, y: 300 },
        },
        {
            id: 'note-1',
            type: 'noteNode',
            data: { label: 'Note 1' },
            position: { x: 400, y: 400 },
        },
        {
            id: 'utility-1',
            type: 'utilityNode',
            data: { label: 'Utility 1' },
            position: { x: 500, y: 500 },
        },
    ];

    it('should return false if source node is missing', () => {
        const connection: Connection = { source: 'non-existent', target: 'node-1', sourceHandle: null, targetHandle: null };
        expect(validateConnection(connection, mockNodes)).toBe(false);
    });

    it('should return false if target node is missing', () => {
        const connection: Connection = { source: 'node-1', target: 'non-existent', sourceHandle: null, targetHandle: null };
        expect(validateConnection(connection, mockNodes)).toBe(false);
    });

    it('should return true if source is a noteNode (hybrid logic)', () => {
        const connection: Connection = { source: 'note-1', target: 'node-1', sourceHandle: null, targetHandle: null };
        expect(validateConnection(connection, mockNodes)).toBe(true);
    });

    it('should return true if target is a utilityNode (hybrid logic)', () => {
        const connection: Connection = { source: 'node-1', target: 'utility-1', sourceHandle: null, targetHandle: null };
        expect(validateConnection(connection, mockNodes)).toBe(true);
    });

    it('should return false for self-connections', () => {
        const connection: Connection = { source: 'node-1', target: 'node-1', sourceHandle: 'out', targetHandle: 'in' };
        expect(validateConnection(connection, mockNodes)).toBe(false);
    });

    it('should return false if mixing flow and data handles (source flow, target data)', () => {
        const connection: Connection = { source: 'node-1', target: 'node-2', sourceHandle: 'flow-out', targetHandle: 'in' };
        expect(validateConnection(connection, mockNodes)).toBe(false);
    });

    it('should return false if mixing flow and data handles (source data, target flow)', () => {
        const connection: Connection = { source: 'node-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'flow-in' };
        expect(validateConnection(connection, mockNodes)).toBe(false);
    });

    it('should return true for data connections with compatible types', () => {
        const connection: Connection = { source: 'node-1', target: 'node-2', sourceHandle: 'out', targetHandle: 'in' };
        expect(validateConnection(connection, mockNodes)).toBe(true);
    });

    it('should return false for data connections with incompatible types', () => {
        const connection: Connection = { source: 'node-1', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' };
        expect(validateConnection(connection, mockNodes)).toBe(false);
    });

    it('should return true for data connections if source is "any"', () => {
        const connection: Connection = { source: 'node-any', target: 'node-3', sourceHandle: 'out', targetHandle: 'in' };
        expect(validateConnection(connection, mockNodes)).toBe(true);
    });

    it('should return true for data connections if target is "any"', () => {
        const connection: Connection = { source: 'node-3', target: 'node-any', sourceHandle: 'out', targetHandle: 'in' };
        expect(validateConnection(connection, mockNodes)).toBe(true);
    });

    it('should return true for flow connections', () => {
        const connection: Connection = { source: 'node-1', target: 'node-2', sourceHandle: 'flow-out', targetHandle: 'flow-in' };
        expect(validateConnection(connection, mockNodes)).toBe(true);
    });

    it('should handle special flow handles like "true", "false", "default"', () => {
        const connTrue: Connection = { source: 'node-1', target: 'node-2', sourceHandle: 'true', targetHandle: 'flow-in' };
        const connFalse: Connection = { source: 'node-1', target: 'node-2', sourceHandle: 'false', targetHandle: 'flow-in' };
        const connDefault: Connection = { source: 'node-1', target: 'node-2', sourceHandle: 'default', targetHandle: 'flow-in' };

        expect(validateConnection(connTrue, mockNodes)).toBe(true);
        expect(validateConnection(connFalse, mockNodes)).toBe(true);
        expect(validateConnection(connDefault, mockNodes)).toBe(true);
    });

    it('should be case-insensitive for type annotations', () => {
        const mixedNodes: AppNode[] = [
            { id: 'n1', type: 'functionNode', data: { label: 'N1', typeAnnotation: 'String' }, position: { x: 0, y: 0 } },
            { id: 'n2', type: 'functionNode', data: { label: 'N2', typeAnnotation: 'string' }, position: { x: 0, y: 0 } },
        ];
        const connection: Connection = { source: 'n1', target: 'n2', sourceHandle: 'out', targetHandle: 'in' };
        expect(validateConnection(connection, mixedNodes)).toBe(true);
    });
});
