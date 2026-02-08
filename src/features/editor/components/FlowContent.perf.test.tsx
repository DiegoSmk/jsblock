import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { FlowContent } from './FlowContent';
import { useStore } from '../../../store/useStore';

// Mock Dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: {
    type: '3rdParty',
    init: () => { /* no-op */ },
  },
}));

// Mock i18next-browser-languagedetector
vi.mock('i18next-browser-languagedetector', () => ({
  default: {},
}));

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    use: () => ({
      use: () => ({
        init: () => { /* no-op */ },
      }),
    }),
  },
}));


// We need to capture the props passed to ReactFlow
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const capturedProps: any[] = [];

vi.mock('@xyflow/react', async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReactFlow: (props: any) => {
      capturedProps.push(props);
      return <div data-testid="react-flow-mock">ReactFlow Mock</div>;
    },
    useReactFlow: () => ({
      fitView: vi.fn().mockResolvedValue(true),
    }),
    Controls: () => null,
    Background: () => null,
    MiniMap: () => null,
  };
});

// Mock CanvasToolbar as it might have internal state or complex rendering
vi.mock('./CanvasToolbar', () => ({
  CanvasToolbar: () => null,
}));

// Mock EdgeStylePopup
vi.mock('./EdgeStylePopup', () => ({
  EdgeStylePopup: () => null,
}));

describe('FlowContent Performance', () => {
  let container: HTMLDivElement | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let root: any = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    root = createRoot(container);
    capturedProps.length = 0; // Reset captured props

    // Reset store to a clean state
    useStore.setState({
      nodes: [],
      edges: [],
      theme: 'light',
      activeScopeId: 'root',
    });
  });

  afterEach(async () => {
    if (root) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      await act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it('maintains stable defaultEdgeOptions reference across renders', async () => {
    // Initial Render
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      root.render(<FlowContent />);
    });

    expect(capturedProps.length).toBeGreaterThan(0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const initialOptions = capturedProps[capturedProps.length - 1].defaultEdgeOptions;

    // Trigger a re-render by updating nodes in the store
    // We update nodes to force the component to re-render, but keep theme 'light'
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useStore.setState({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        nodes: [{ id: '1', type: 'variableNode', position: { x: 0, y: 0 }, data: {} }] as any
      });
    });

    // Component should have re-rendered
    expect(capturedProps.length).toBeGreaterThan(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const nextOptions = capturedProps[capturedProps.length - 1].defaultEdgeOptions;

    // Verify content is visually identical (sanity check)
    expect(JSON.stringify(initialOptions)).toBe(JSON.stringify(nextOptions));

    // THE PERFORMANCE FIX:
    // References should be the same now
    expect(initialOptions).toBe(nextOptions);
  });
});
