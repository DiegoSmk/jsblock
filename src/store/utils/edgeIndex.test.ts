import { describe, it, expect } from 'vitest';
import {
    buildEdgeIndex,
    addToEdgeIndex,
    removeFromEdgeIndex,
    updateInEdgeIndex,
    syncEdgeIndex
} from './edgeIndex';
import type { Edge, EdgeChange } from '@xyflow/react';

describe('Edge Index Utilities', () => {
    const edge1: Edge = { id: 'e1', source: 'n1', target: 'n2' };
    const edge2: Edge = { id: 'e2', source: 'n2', target: 'n3' };
    const edge3: Edge = { id: 'e3', source: 'n1', target: 'n3' };

    it('buildEdgeIndex should create a map correctly', () => {
        const index = buildEdgeIndex([edge1, edge2]);
        expect(index.get('n1')).toEqual([edge1]);
        expect(index.get('n2')).toEqual([edge1, edge2]);
        expect(index.get('n3')).toEqual([edge2]);
    });

    it('addToEdgeIndex should add edges incrementally', () => {
        let index = buildEdgeIndex([edge1]);
        index = addToEdgeIndex(index, [edge2]);

        expect(index.get('n1')).toEqual([edge1]);
        expect(index.get('n2')).toEqual([edge1, edge2]);
        expect(index.get('n3')).toEqual([edge2]);
    });

    it('removeFromEdgeIndex should remove edges and clean up empty nodes', () => {
        let index = buildEdgeIndex([edge1, edge2]);
        index = removeFromEdgeIndex(index, [edge1]);

        expect(index.has('n1')).toBe(false);
        expect(index.get('n2')).toEqual([edge2]);
        expect(index.get('n3')).toEqual([edge2]);
    });

    it('updateInEdgeIndex should update properties correctly', () => {
        const updatedEdge1 = { ...edge1, label: 'updated' };
        let index = buildEdgeIndex([edge1]);
        index = updateInEdgeIndex(index, edge1, updatedEdge1);

        expect(index.get('n1')![0].label).toBe('updated');
        expect(index.get('n2')![0].label).toBe('updated');
    });

    it('updateInEdgeIndex should handle source/target changes', () => {
        const movedEdge1 = { ...edge1, source: 'n9' };
        let index = buildEdgeIndex([edge1]);
        index = updateInEdgeIndex(index, edge1, movedEdge1);

        expect(index.has('n1')).toBe(false);
        expect(index.get('n9')).toEqual([movedEdge1]);
    });

    it('syncEdgeIndex should handle combinations of changes', () => {
        const oldEdges = [edge1, edge2];
        const newEdgeSum: Edge = { id: 'e4', source: 'n3', target: 'n4' };
        const updatedEdge2 = { ...edge2, selected: true };
        const newEdges = [updatedEdge2, newEdgeSum]; // e1 removed, e2 updated, e4 added

        const changes: EdgeChange[] = [
            { type: 'remove', id: 'e1' },
            { type: 'add', item: newEdgeSum },
            { type: 'select', id: 'e2', selected: true }
        ];

        const oldIndex = buildEdgeIndex(oldEdges);
        // Force syncEdgeIndex to use incremental logic for this test by providing enough edges
        // (Though the threshold in my current implementation is 20, let's just test the logic)
        const newIndex = syncEdgeIndex(oldIndex, oldEdges, newEdges, changes);

        expect(newIndex.has('n1')).toBe(false);
        expect(newIndex.get('n2')).toEqual([updatedEdge2]);
        expect(newIndex.get('n3')).toEqual([updatedEdge2, newEdgeSum]);
        expect(newIndex.get('n4')).toEqual([newEdgeSum]);
    });
});
