import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  type NodeTypes,
  type Node,
  type Edge,
  type Connection,
  ConnectionMode
} from '@xyflow/react';
import type { EdgeCustomStyle } from '../types';
import { Edit2, Trash2, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store/useStore';
import { Tooltip } from '../../../components/ui/Tooltip';
import { EdgeStylePopup } from './EdgeStylePopup';
import { CanvasToolbar } from './CanvasToolbar';

import { VariableNode } from '../nodes/VariableNode';
import { FunctionCallNode } from '../nodes/FunctionCallNode';
import { LiteralNode } from '../nodes/LiteralNode';
import { LogicNode } from '../nodes/LogicNode';
import { IfNode } from '../nodes/IfNode';
import { SwitchNode } from '../nodes/SwitchNode';
import { WhileNode } from '../nodes/WhileNode';
import { ForNode } from '../nodes/ForNode';
import { TryCatchNode } from '../nodes/TryCatchNode';
import { GroupNode } from '../nodes/GroupNode';
import { NativeApiNode } from '../nodes/NativeApiNode';
import { NoteNode } from '../nodes/NoteNode/index';
import { UtilityNode } from '../nodes/UtilityNode';
import { ImportNode } from '../nodes/ImportNode';
import { CanvasNode } from '../nodes/CanvasNode';
import { validateConnection } from '../logic/connectionLogic';

const nodeTypes: NodeTypes = {
  variableNode: VariableNode,
  functionCallNode: FunctionCallNode,
  literalNode: LiteralNode,
  logicNode: LogicNode,
  ifNode: IfNode,
  switchNode: SwitchNode,
  whileNode: WhileNode,
  forNode: ForNode,
  tryCatchNode: TryCatchNode,
  groupNode: GroupNode,
  nativeApiNode: NativeApiNode,
  noteNode: NoteNode,
  utilityNode: UtilityNode,
  importNode: ImportNode,
  canvasNode: CanvasNode
};

export function FlowContent() {
  const { t } = useTranslation();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    theme,
    activeScopeId,
    openModal,
    saveFile,
    removeEdges,
    updateEdge
  } = useStore(useShallow(state => ({
    nodes: state.nodes,
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    theme: state.theme,
    activeScopeId: state.activeScopeId,
    saveFile: state.saveFile,
    openModal: state.openModal,
    updateNodeData: state.updateNodeData,
    updateEdge: state.updateEdge,
    removeEdges: state.removeEdges
  })));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile().catch(console.error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);


  const { fitView } = useReactFlow();
  const isDark = theme === 'dark';

  const defaultEdgeOptions = useMemo(() => ({
    style: { strokeWidth: 3, stroke: isDark ? '#4fc3f7' : '#0070f3' },
    animated: true,
    labelStyle: { fill: isDark ? '#fff' : '#000', fontWeight: 700, fontSize: 12 },
    labelBgStyle: { fill: isDark ? '#1e1e1e' : '#fff', fillOpacity: 0.8 }
  }), [isDark]);

  // Edge Context Menu state
  const [edgeMenu, setEdgeMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [edgeStyleMenu, setEdgeStyleMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    event.stopPropagation();
    setEdgeMenu({
      id: edge.id,
      x: event.clientX,
      y: event.clientY
    });
    setEdgeStyleMenu(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setEdgeMenu(null);
    setEdgeStyleMenu(null);
  }, []);

  const handleEdgeAction = (action: 'comment' | 'delete' | 'style') => {
    if (!edgeMenu) return;

    if (action === 'delete') {
      removeEdges([edgeMenu.id]);
      setEdgeMenu(null);
    } else if (action === 'comment') {
      const edge = edges.find(e => e.id === edgeMenu.id);
      if (edge) {
        const currentLabel = (edge.label as string) ?? '';
        openModal({
          title: currentLabel ? t('edge.edit_comment') : t('edge.add_comment'),
          initialValue: currentLabel,
          type: 'prompt',
          placeholder: t('edge.comment_prompt'),
          confirmLabel: 'Save',
          onSubmit: (newLabel: string) => {
            updateEdge(edgeMenu.id, { label: newLabel });
          }
        });
      }
      setEdgeMenu(null);
    } else if (action === 'style') {
      setEdgeStyleMenu({
        id: edgeMenu.id,
        x: edgeMenu.x,
        y: edgeMenu.y
      });
      setEdgeMenu(null);
    }
  };

  const handleStyleUpdate = (updates: EdgeCustomStyle) => {
    if (!edgeStyleMenu) return;
    const edge = edges.find(e => e.id === edgeStyleMenu.id);
    if (!edge) return;

    // Persist to data.customStyle for later use/serialization
    const currentCustomStyle = (edge.data?.customStyle as EdgeCustomStyle) ?? {};
    const newCustomStyle = { ...currentCustomStyle, ...updates };

    const edgeUpdates: Partial<Edge> = {
      data: { ...edge.data, customStyle: newCustomStyle }
    };

    if ('type' in updates) {
      edgeUpdates.type = updates.type;
    }

    // Force fresh style object construction to ensure React Flow reactivity
    if ('stroke' in updates || 'strokeWidth' in updates || 'strokeDasharray' in updates) {
      const currentStyle = (edge.style ?? {});

      // Construct new style object starting from current
      const newStyle = { ...currentStyle };

      // Apply updates or remove keys if undefined
      if ('stroke' in updates) {
        if (updates.stroke === undefined) delete newStyle.stroke;
        else newStyle.stroke = updates.stroke;
      }

      if ('strokeWidth' in updates) {
        if (updates.strokeWidth === undefined) delete newStyle.strokeWidth;
        else newStyle.strokeWidth = updates.strokeWidth;
      }

      if ('strokeDasharray' in updates) {
        if (updates.strokeDasharray === undefined) delete newStyle.strokeDasharray;
        else newStyle.strokeDasharray = updates.strokeDasharray;
      }

      edgeUpdates.style = newStyle;
    }

    if ('animated' in updates) {
      edgeUpdates.animated = updates.animated;
    }

    updateEdge(edgeStyleMenu.id, edgeUpdates);
  };

  const scopeNodes = nodes.filter((n: Node) =>
    n.id !== 'node-js-runtime' && (
      n.data?.scopeId === activeScopeId ||
      (activeScopeId === 'root' && (!n.data?.scopeId || n.data?.scopeId === 'root'))
    )
  );

  const hasNativeCalls = edges.some((e: Edge) =>
    e.source === 'node-js-runtime' &&
    scopeNodes.some((n: Node) => n.id === e.target)
  );

  const runtimeNode = nodes.find(n => n.id === 'node-js-runtime');
  const filteredNodes: Node[] = (hasNativeCalls && runtimeNode)
    ? [...scopeNodes, runtimeNode]
    : scopeNodes;

  const visibleNodeIds = new Set(filteredNodes.map((n: Node) => n.id));
  const filteredEdges = edges.filter(e => {
    if (visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)) return true;
    if (e.source === 'node-js-runtime' && visibleNodeIds.has(e.target)) return true;
    return false;
  });

  useEffect(() => {
    if (filteredNodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 400, includeHiddenNodes: false }).catch(console.error);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeScopeId, fitView, filteredNodes.length]);

  // Determine if the currently selected edge (in context menu) has a label/comment
  const currentEdgeLabel = edgeMenu ? edges.find(e => e.id === edgeMenu.id)?.label : null;
  const hasComment = !!currentEdgeLabel;

  const isValidConnection = useCallback(
    (edge: Connection | Edge) => validateConnection(edge, nodes),
    [nodes]
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '200px', minWidth: '200px' }}>
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        colorMode={isDark ? 'dark' : 'light'}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        snapToGrid={true}
        snapGrid={[15, 15]}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={30}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Background color={isDark ? '#333' : '#ddd'} gap={20} />
        <Controls />
        <MiniMap style={{ background: isDark ? '#1e1e1e' : '#fff' }} nodeColor={isDark ? '#444' : '#eee'} maskColor={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'} />

        {edgeMenu && (
          <div
            style={{
              position: 'fixed',
              top: edgeMenu.y - 40,
              left: edgeMenu.x - 40,
              background: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              borderRadius: '50px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              zIndex: 1000,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <Tooltip content={hasComment ? t('edge.edit_comment') : t('edge.add_comment')} side="top">
              <button
                onClick={() => handleEdgeAction('comment')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#e0e0e0' : '#444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '50%',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Edit2 size={18} color={hasComment ? (isDark ? '#4ade80' : '#22c55e') : (isDark ? '#a855f7' : '#8b5cf6')} />
              </button>
            </Tooltip>

            <div style={{ width: '1px', height: '16px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

            <Tooltip content="Estilo da Conexão" side="top">
              <button
                onClick={() => handleEdgeAction('style')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#e0e0e0' : '#444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '50%',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Palette size={18} color={isDark ? '#4fc3f7' : '#0070f3'} />
              </button>
            </Tooltip>

            <div style={{ width: '1px', height: '16px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

            <Tooltip content={t('edge.delete_connection')} side="top">
              <button
                onClick={() => handleEdgeAction('delete')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '50%',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Trash2 size={18} />
              </button>
            </Tooltip>
          </div>
        )}
        {edgeStyleMenu && createPortal(
          <>
            {/* Backdrop Overlay to close menu on click outside */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                cursor: 'default'
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setEdgeStyleMenu(null);
              }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEdgeStyleMenu(null);
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: edgeStyleMenu.y + 10,
                left: edgeStyleMenu.x - 120,
                zIndex: 1001,
              }}
            >
              {(() => {
                const selectedEdge = edges.find(e => e.id === edgeStyleMenu.id);
                if (!selectedEdge) return null;
                return (
                  <EdgeStylePopup
                    isDark={isDark}
                    onClose={() => setEdgeStyleMenu(null)}
                    currentStyle={{
                      type: selectedEdge.type ?? 'default',
                      stroke: (selectedEdge.style?.stroke as string) ?? undefined,
                      strokeWidth: Number(selectedEdge.style?.strokeWidth ?? 3),
                      strokeDasharray: (selectedEdge.style?.strokeDasharray as string) ?? undefined,
                      animated: selectedEdge.animated
                    }}
                    onUpdate={handleStyleUpdate}
                  />
                );
              })()}
            </div>
          </>,
          document.body
        )}
      </ReactFlow>
      <CanvasToolbar isDark={isDark} />
    </div>
  );
}
