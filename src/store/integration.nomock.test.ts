import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from 'zustand';
import { createFlowSlice } from './slices/flowSlice';
import { createFileSlice } from './slices/fileSlice';
import type { AppState } from '../types/store';

// This test intentionally avoids mocking CodeParser to ensure compatibility with real implementation.
// In the test environment, Worker is undefined so parseCodeToFlowAsync returns empty flow.

describe('Store Integration (no mocks)', () => {
    let store: ReturnType<typeof createStore<AppState>>;

    beforeEach(() => {
        store = createStore<AppState>((set, get, api) => ({
            ...createFlowSlice(set as any, get as any, api as any),
            ...createFileSlice(set as any, get as any, api as any),
            // Minimal stubs for required actions
            runExecution: vi.fn(),
            runExecutionDebounced: vi.fn(),
            checkTaskRecurse: vi.fn(),
        } as any));
    });

    it('should keep edgeIndex consistent after setCode with real parser fallback', async () => {
        const state = store.getState();
        state.setCode('const x = 1;', false, false);

        // Wait for parseCodeToFlowAsync promise resolution
        await new Promise((resolve) => setTimeout(resolve, 0));

        const next = store.getState();
        expect(next.edges).toHaveLength(0);
        expect(next.nodes).toHaveLength(0);
        expect(next.edgeIndex.size).toBe(0);
    });
});
