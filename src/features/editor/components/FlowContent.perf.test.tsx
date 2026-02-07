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
    init: () => {},
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
        init: () => {},
      }),
    }),
  },
}));


// We need to capture the props passed to ReactFlow
const capturedProps: any[] = [];

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
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
  let root: any = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
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

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    if (container) {
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it('re-creates defaultEdgeOptions object on every render even if theme is unchanged', async () => {
    // Initial Render
    await act(async () => {
      root.render(<FlowContent />);
    });

    expect(capturedProps.length).toBeGreaterThan(0);
    const initialOptions = capturedProps[capturedProps.length - 1].defaultEdgeOptions;

    // Trigger a re-render by updating nodes in the store
    // We update nodes to force the component to re-render, but keep theme 'light'
    await act(async () => {
      useStore.setState({
        nodes: [{ id: '1', type: 'variableNode', position: { x: 0, y: 0 }, data: {} }]
      });
    });

    // Component should have re-rendered
    expect(capturedProps.length).toBeGreaterThan(1);
    const nextOptions = capturedProps[capturedProps.length - 1].defaultEdgeOptions;

    // Verify content is visually identical (sanity check)
    expect(JSON.stringify(initialOptions)).toBe(JSON.stringify(nextOptions));

    // THE PERFORMANCE FIX:
    // References should be the same now
    expect(initialOptions).toBe(nextOptions);
  });
});
