/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import { createFlowSlice } from './slices/flowSlice';
import { createFileSlice } from './slices/fileSlice';
import type { AppState } from '../types/store';
import type { AppNode } from '../features/editor/types';
import type { Edge } from '@xyflow/react';

// Mock getLayoutedElements to modify positions but keep topology
vi.mock('../features/editor/logic/layout', () => ({
    getLayoutedElements: (nodes: AppNode[], edges: Edge[]) => ({
        nodes: nodes.map(n => ({ ...n, position: { x: n.position.x + 10, y: n.position.y + 10 } })),
        edges: [...edges] // Return shallow copy to simulate processing
    })
}));

// Mock other dependencies
vi.mock('../features/editor/logic/CodeParser', () => ({
    parseCodeToFlowAsync: async () => ({ nodes: [], edges: [] })
}));
vi.mock('../features/editor/logic/CodeGenerator', () => ({
    generateCodeFromFlow: () => ''
}));

describe('Store Integration & Edge Index Consistency', () => {
    let store: StoreApi<AppState>;

    beforeEach(() => {
        store = createStore<AppState>((set, get, api) => {
            const ss = set as unknown as (partial: Partial<AppState>) => void;
            const gg = get as unknown as () => AppState;
            const aa = api as unknown as any;

            return {
                ...createFlowSlice(ss as any, gg as any, aa as any),
                ...createFileSlice(ss as any, gg as any, aa as any),
                // Mock other slices minimal requirements
                runExecution: vi.fn(),
                runExecutionDebounced: vi.fn(),
                checkTaskRecurse: vi.fn(),
                saveFile: vi.fn(),
                setConfirmationModal: vi.fn(),
                setCode: vi.fn(),
                addToast: vi.fn(),
            } as unknown as AppState;
        });
    });

    it('should maintain edge index consistency through a complete workflow', () => {
        const node1: AppNode = { id: 'n1', type: 'functionCallNode', position: { x: 0, y: 0 }, data: { label: 'Start' } };
        const node2: AppNode = { id: 'n2', type: 'functionCallNode', position: { x: 200, y: 0 }, data: { label: 'End' } };
        const edge1: Edge = { id: 'e1', source: 'n1', target: 'n2' };

        // 1. Initial State Setup
        store.setState({
            nodes: [node1, node2],
            edges: [edge1],
            edgeIndex: new Map([['n1', [edge1]], ['n2', [edge1]]])
        } as Partial<AppState>);

        // Verify initial index
        let state = store.getState();
        expect(state.getEdgesForNode('n1')).toHaveLength(1);
        expect(state.getEdgesForNode('n2')).toHaveLength(1);

        // 2. Force Layout
        state.forceLayout();
        state = store.getState();

        // Nodes should have moved (mock behavior)
        expect(state.nodes[0].position.x).toBe(10);
        // Index should still be valid
        expect(state.getEdgesForNode('n1')).toHaveLength(1);
        expect(state.edgeIndex.get('n1')?.[0].id).toBe('e1');

        // 3. Connect new node
        const node3: AppNode = { id: 'n3', type: 'functionCallNode', position: { x: 100, y: 100 }, data: { label: 'Middle' } };
        store.setState({ nodes: [...state.nodes, node3] });

        const conn = { source: 'n2', target: 'n3', sourceHandle: null, targetHandle: null };
        state.onConnect(conn);
        state = store.getState();

        // Should have new edge
        expect(state.edges).toHaveLength(2);
        expect(state.getEdgesForNode('n2')).toHaveLength(2); // e1 and new edge
        expect(state.getEdgesForNode('n3')).toHaveLength(1);

        // 4. Update Edge
        const newEdgeId = state.edges.find((e: Edge) => e.source === 'n2' && e.target === 'n3')!.id;
        state.updateEdge(newEdgeId, { animated: true });
        state = store.getState();

        const updatedEdgeObj = state.getEdgesForNode('n3')[0];
        expect(updatedEdgeObj.animated).toBe(true);

        // 5. Remove Edge
        state.removeEdges(['e1']); // Remove connection n1-n2
        state = store.getState();

        expect(state.edges).toHaveLength(1);
        expect(state.getEdgesForNode('n1')).toHaveLength(0); // Cleaned up
        expect(state.getEdgesForNode('n2')).toHaveLength(1); // Only n2-n3 remains
    });
});
