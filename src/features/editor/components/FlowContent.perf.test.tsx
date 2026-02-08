import { render } from '@testing-library/react';
import { FlowContent } from './FlowContent';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { useStore } from '../../../store/useStore';
import React from 'react';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: {
    type: '3rdParty',
    init: () => { /* no-op */ },
  }
}));

vi.mock('lucide-react', () => ({
  Edit2: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Palette: () => <div data-testid="palette-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Merge: () => <div data-testid="merge-icon" />,
  ArrowUpRight: () => <div data-testid="arrow-icon" />,
}));

// Mock ReactFlow components and hooks
const ReactFlowMock = vi.fn(({ children }: { children: React.ReactNode; defaultEdgeOptions: unknown }) => {
  return <div data-testid="react-flow">{children}</div>;
});

vi.mock('@xyflow/react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  ReactFlow: (props: any) => ReactFlowMock(props),
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />,
  MiniMap: () => <div data-testid="minimap" />,
  useReactFlow: () => ({ fitView: vi.fn() }),
  ConnectionMode: { Loose: 'loose' },
}));

// Mock internal components
vi.mock('./EdgeStylePopup', () => ({
  EdgeStylePopup: () => <div data-testid="edge-style-popup" />,
}));
vi.mock('./CanvasToolbar', () => ({
  CanvasToolbar: () => <div data-testid="canvas-toolbar" />,
}));

// Mock nodes to avoid import issues or rendering complex children
vi.mock('../nodes/VariableNode', () => ({ VariableNode: () => <div /> }));
vi.mock('../nodes/FunctionCallNode', () => ({ FunctionCallNode: () => <div /> }));
vi.mock('../nodes/LiteralNode', () => ({ LiteralNode: () => <div /> }));
vi.mock('../nodes/LogicNode', () => ({ LogicNode: () => <div /> }));
vi.mock('../nodes/IfNode', () => ({ IfNode: () => <div /> }));
vi.mock('../nodes/SwitchNode', () => ({ SwitchNode: () => <div /> }));
vi.mock('../nodes/WhileNode', () => ({ WhileNode: () => <div /> }));
vi.mock('../nodes/ForNode', () => ({ ForNode: () => <div /> }));
vi.mock('../nodes/TryCatchNode', () => ({ TryCatchNode: () => <div /> }));
vi.mock('../nodes/GroupNode', () => ({ GroupNode: () => <div /> }));
vi.mock('../nodes/NativeApiNode', () => ({ NativeApiNode: () => <div /> }));
vi.mock('../nodes/NoteNode/index', () => ({ NoteNode: () => <div /> }));
vi.mock('../nodes/UtilityNode', () => ({ UtilityNode: () => <div /> }));
vi.mock('../nodes/ImportNode', () => ({ ImportNode: () => <div /> }));
vi.mock('../nodes/CanvasNode', () => ({ CanvasNode: () => <div /> }));


describe('FlowContent Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      nodes: [],
      edges: [],
      theme: 'dark',
    });
  });

  it('maintains stable defaultEdgeOptions reference across renders', () => {
    const { rerender } = render(<FlowContent />);

    expect(ReactFlowMock).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const firstCallProps = (ReactFlowMock as Mock).mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const firstOptions = firstCallProps.defaultEdgeOptions;

    // Force a re-render
    rerender(<FlowContent />);

    expect(ReactFlowMock).toHaveBeenCalledTimes(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const secondCallProps = (ReactFlowMock as Mock).mock.calls[1][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const secondOptions = secondCallProps.defaultEdgeOptions;

    // The Fix: They SHOULD be the same reference if dependencies didn't change
    expect(firstOptions).toBe(secondOptions);
  });
});
