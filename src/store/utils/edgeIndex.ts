import type { Edge, EdgeChange, EdgeAddChange } from '@xyflow/react';

/**
 * Builds a complete index of edges keyed by node ID (source or target).
 */
export const buildEdgeIndex = (edges: Edge[]): Map<string, Edge[]> => {
    const index = new Map<string, Edge[]>();
    for (const edge of edges) {
        addEdgeToMap(index, edge);
    }
    return index;
};

/**
 * Helper to add an edge to an index map (mutates the map).
 */
const addEdgeToMap = (map: Map<string, Edge[]>, edge: Edge) => {
    // Source
    let sourceEdges = map.get(edge.source);
    if (!sourceEdges) {
        sourceEdges = [];
        map.set(edge.source, sourceEdges);
    }
    sourceEdges.push(edge);

    // Target
    let targetEdges = map.get(edge.target);
    if (!targetEdges) {
        targetEdges = [];
        map.set(edge.target, targetEdges);
    }
    targetEdges.push(edge);
};

/**
 * Incrementally adds edges to an existing index.
 */
export const addToEdgeIndex = (index: Map<string, Edge[]>, newEdges: Edge[]): Map<string, Edge[]> => {
    const newIndex = new Map(index);
    const updates = new Map<string, Edge[]>();

    for (const edge of newEdges) {
        if (!updates.has(edge.source)) updates.set(edge.source, []);
        updates.get(edge.source)?.push(edge);

        if (!updates.has(edge.target)) updates.set(edge.target, []);
        updates.get(edge.target)?.push(edge);
    }

    for (const [nodeId, edges] of updates) {
        const currentEdges = newIndex.get(nodeId) ?? [];
        newIndex.set(nodeId, [...currentEdges, ...edges]);
    }

    return newIndex;
};

/**
 * Incrementally removes edges from an existing index by ID.
 */
export const removeFromEdgeIndex = (index: Map<string, Edge[]>, edgesToRemove: Edge[]): Map<string, Edge[]> => {
    const newIndex = new Map(index);
    const idsToRemove = new Set(edgesToRemove.map(e => e.id));
    const affectedNodeIds = new Set<string>();

    for (const edge of edgesToRemove) {
        affectedNodeIds.add(edge.source);
        affectedNodeIds.add(edge.target);
    }

    for (const nodeId of affectedNodeIds) {
        const currentEdges = newIndex.get(nodeId);
        if (currentEdges) {
            const filtered = currentEdges.filter(e => !idsToRemove.has(e.id));
            if (filtered.length === 0) {
                newIndex.delete(nodeId);
            } else {
                newIndex.set(nodeId, filtered);
            }
        }
    }

    return newIndex;
};

/**
 * Incrementally updates an edge in the index.
 */
export const updateInEdgeIndex = (index: Map<string, Edge[]>, oldEdge: Edge, newEdge: Edge): Map<string, Edge[]> => {
    if (oldEdge.source !== newEdge.source || oldEdge.target !== newEdge.target) {
        const step1 = removeFromEdgeIndex(index, [oldEdge]);
        return addToEdgeIndex(step1, [newEdge]);
    }

    // Validation: Check if the edge actually exists in the index to avoid duplicates or silent failures
    const sourceList = index.get(oldEdge.source);
    const exists = sourceList?.some(e => e.id === oldEdge.id);

    if (!exists) {
        // If it didn't exist, we just add the new one (cleanly)
        return addToEdgeIndex(index, [newEdge]);
    }

    const newIndex = new Map(index);

    // Update source array
    const sEdges = (newIndex.get(newEdge.source) ?? []).map(e => e.id === newEdge.id ? newEdge : e);
    newIndex.set(newEdge.source, sEdges);

    // Update target array
    const tEdges = (newIndex.get(newEdge.target) ?? []).map(e => e.id === newEdge.id ? newEdge : e);
    newIndex.set(newEdge.target, tEdges);

    return newIndex;
};

/**
 * Syncs edges when selection status changes without a full rebuild or per-node search.
 */
const updateSelectionInIndex = (index: Map<string, Edge[]>, newEdges: Edge[], selectedIds: Set<string>): Map<string, Edge[]> => {
    const newIndex = new Map(index);
    const affectedNodeIds = new Set<string>();

    // Create map for O(1) edge lookup only for the newEdges
    // This allows us to find the UPDATED edge object by ID
    const edgeLookup = new Map<string, Edge>();
    for (const edge of newEdges) {
        edgeLookup.set(edge.id, edge);
    }

    // Find affected nodes
    for (const edgeId of selectedIds) {
        const updatedEdge = edgeLookup.get(edgeId);
        if (updatedEdge) {
            affectedNodeIds.add(updatedEdge.source);
            affectedNodeIds.add(updatedEdge.target);
        }
    }

    for (const nodeId of affectedNodeIds) {
        const currentEdges = newIndex.get(nodeId);
        if (currentEdges) {
            const updatedEdges = currentEdges.map(e => edgeLookup.get(e.id) ?? e);
            newIndex.set(nodeId, updatedEdges);
        }
    }

    return newIndex;
};

/**
 * Decision: Should we rebuild the index or apply incremental updates?
 */
export const shouldRebuildIndex = (newEdgesCount: number, changesCount: number, hasReset: boolean): boolean => {
    if (hasReset) return true;

    // Always rebuild for very small graphs as it's negligible and safer
    if (newEdgesCount < 50) return true;

    // Rebuild if changes affect a significant portion of the graph (> 20%)
    // This avoids fragmentation or accumulated overhead in incremental updates
    if (changesCount > newEdgesCount * 0.2) return true;

    return false;
};

/**
 * Intelligently syncs an index after applyEdgeChanges.
 */
export const syncEdgeIndex = (
    oldIndex: Map<string, Edge[]>,
    oldEdges: Edge[],
    newEdges: Edge[],
    changes: EdgeChange[]
): Map<string, Edge[]> => {
    const hasReset = changes.some(c => (c as { type: string }).type === 'reset');

    if (shouldRebuildIndex(newEdges.length, changes.length, hasReset)) {
        return buildEdgeIndex(newEdges);
    }

    const removeChanges = changes.filter((c): c is { type: 'remove', id: string } => c.type === 'remove');
    // Using safer type guard for add changes
    const addChanges = changes.filter((c): c is EdgeAddChange => c.type === 'add').map(c => c.item);
    const selectChanges = changes.filter((c): c is { type: 'select', id: string, selected: boolean } => c.type === 'select');

    let currentIndex = oldIndex;

    if (removeChanges.length > 0) {
        const removedIds = new Set(removeChanges.map(c => c.id));
        const removedEdges = oldEdges.filter(e => removedIds.has(e.id));
        currentIndex = removeFromEdgeIndex(currentIndex, removedEdges);
    }

    if (addChanges.length > 0) {
        currentIndex = addToEdgeIndex(currentIndex, addChanges);
    }

    if (selectChanges.length > 0) {
        const selectedIds = new Set(selectChanges.map(c => c.id));
        currentIndex = updateSelectionInIndex(currentIndex, newEdges, selectedIds);
    }

    return currentIndex;
};
