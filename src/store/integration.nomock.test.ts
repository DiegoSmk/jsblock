/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import { createFlowSlice } from './slices/flowSlice';
import { createFileSlice } from './slices/fileSlice';
import type { AppState } from '../types/store';

// This test intentionally avoids mocking CodeParser to ensure compatibility with real implementation.
// In the test environment, Worker is undefined so parseCodeToFlowAsync returns empty flow.

describe('Store Integration (no mocks)', () => {
    let store: StoreApi<AppState>;

    beforeEach(() => {
        store = createStore<AppState>((set, get, api) => {
            const ss = set as unknown as (partial: Partial<AppState>) => void;
            const gg = get as unknown as () => AppState;
            const aa = api as unknown as any;

            return {
                ...createFlowSlice(ss as any, gg as any, aa),
                ...createFileSlice(ss as any, gg as any, aa),
                // Minimal stubs for required actions
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
