/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useStore } from '../useStore';
import type { AppState } from '../../types/store';

describe('File Slice & Store Optimizations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Mock Electron API
        (window as any).electron = {
            fileSystem: {
                readFile: vi.fn(),
                writeFile: vi.fn(),
                readDir: vi.fn(),
            },
            mcpSyncState: vi.fn(),
            windowMinimize: vi.fn(),
            windowMaximize: vi.fn(),
            windowClose: vi.fn(),
        };

        // Reset store state
        useStore.setState({
            nodes: [],
            edges: [],
            code: '',
            isDirty: false,
            selectedFile: null,
            isBlockFile: false,
            viewport: { x: 0, y: 0, zoom: 1 },
            edgeIndex: new Map(),
        });

        // Flush any triggers from the reset itself
        vi.runAllTimers();
        (window as any).electron.mcpSyncState.mockClear();
    });

    it('should load a .block file and correctly populate all fields including index', async () => {
        const mockBlock = {
            nodes: [
                { id: 'n1', position: { x: 10, y: 10 }, data: { label: 'Node 1' } },
                { id: 'n2', position: { x: 50, y: 50 }, data: { label: 'Node 2' } }
            ],
            edges: [
                { id: 'e1', source: 'n1', target: 'n2' }
            ],
            viewport: { x: 100, y: 200, zoom: 1.5 },
            code: '// Some visual code'
        };

        ((window as any).electron.fileSystem.readFile as Mock).mockResolvedValue(JSON.stringify(mockBlock));

        await useStore.getState().loadContentForFile('test.block');

        const state = useStore.getState();
        expect(state.nodes).toHaveLength(2);
        expect(state.edges).toHaveLength(1);
        expect(state.viewport).toEqual(mockBlock.viewport);
        expect(state.code).toBe(mockBlock.code);
        expect(state.isBlockFile).toBe(true);

        // Verify Edge Index optimization
        expect(state.edgeIndex.get('n1')).toHaveLength(1);
        expect(state.edgeIndex.get('n2')).toHaveLength(1);
        expect(state.getEdgesForNode('n1')).toHaveLength(1);
    });

    it('should handle fallback for invalid JSON in .block file', async () => {
        ((window as any).electron.fileSystem.readFile as Mock).mockResolvedValue('{{{ invalid json');

        await useStore.getState().loadContentForFile('bad.block');

        const state = useStore.getState();
        expect(state.nodes).toHaveLength(0);
        expect(state.edges).toHaveLength(0);
        expect(state.isBlockFile).toBe(true);
        expect(state.isDirty).toBe(false);
    });

    it('should save .block file with nodes, edges, viewport and code', async () => {
        useStore.setState({
            selectedFile: 'output.block',
            isBlockFile: true,
            nodes: [{ id: 'n1', type: 'functionCallNode', data: { label: 'n1' }, position: { x: 0, y: 0 } }],
            edges: [{ id: 'e1', source: 'n1', target: 'any' }],
            viewport: { x: -10, y: 20, zoom: 0.5 },
            code: 'const x = 1;'
        } as Partial<AppState>);

        await useStore.getState().saveFile();

        const writeFileCall = (window.electron.fileSystem.writeFile as Mock).mock.calls[0];
        expect(writeFileCall[0]).toBe('output.block');

        const savedData = JSON.parse(writeFileCall[1] as string) as { nodes: unknown[]; edges: unknown[]; viewport: unknown; code: string };
        expect(savedData.nodes).toHaveLength(1);
        expect(savedData.viewport).toEqual({ x: -10, y: 20, zoom: 0.5 });
        expect(savedData.code).toBe('const x = 1;');
    });

    it('should debounce MCP synchronization', () => {
        // Trigger multiple state changes
        useStore.setState({ code: 'char 1' });
        useStore.setState({ code: 'char 2' });
        useStore.setState({ code: 'char 3' });

        // Should NOT have called MCP sync yet
        expect(window.electron.mcpSyncState).not.toHaveBeenCalled();

        // Fast-forward 500ms
        vi.advanceTimersByTime(500);
        expect(window.electron.mcpSyncState).not.toHaveBeenCalled();

        // Fast-forward another 600ms (total > 1000ms)
        vi.advanceTimersByTime(600);
        expect((window as any).electron.mcpSyncState).toHaveBeenCalledTimes(1);
        const syncStateArg = (window as any).electron.mcpSyncState.mock.calls[0][0] as { code: string };
        expect(syncStateArg.code).toBe('char 3');
    });

    it('should only trigger MCP sync for relevant state changes', () => {
        // This assumes subscribeWithSelector and shallow equality are working
        // Reset call count
        (window as any).electron.mcpSyncState.mockClear();

        // Change something irrelevant (like benchmark records or theme - if not in selector)
        // Wait, theme IS in AppState but IS NOT in our MCP selector.
        useStore.setState({ theme: 'dark' } as Partial<AppState>);

        vi.advanceTimersByTime(2000);
        // Should NOT trigger MCP sync if theme is not in the selector
        expect((window as any).electron.mcpSyncState).not.toHaveBeenCalled();

        // Change something relevant
        useStore.setState({ isDirty: true });
        vi.advanceTimersByTime(2000);
        expect((window as any).electron.mcpSyncState).toHaveBeenCalled();
    });
});
