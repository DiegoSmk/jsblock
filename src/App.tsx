import { useEffect, useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes
} from '@xyflow/react';
import Editor from '@monaco-editor/react';
import { Allotment } from 'allotment';
import { RefreshCw, Code, FolderOpen, Minus, Square, X, PanelLeft, Files, Library, Box, Edit2, Trash2, History as HistoryIcon, Network, Layers, Terminal, Info } from 'lucide-react';
import { GitPanel } from './components/GitPanel';
import { CommitHistory } from './components/git/CommitHistory';
import { GitGraphView } from './components/git/GitGraphView';
import { GitInfoPanel } from './components/git/GitInfoPanel';
import { CommitDetailModal } from './components/git/CommitDetailModal';
import { SideRibbon } from './components/SideRibbon';
import { ContextRibbon } from './components/ui/ContextRibbon';
import { useTranslation } from 'react-i18next';
import 'allotment/dist/style.css';
import '@xyflow/react/dist/style.css';
import { loader } from '@monaco-editor/react';

// Configure Monaco loader to use local files copied to public/monaco-editor
loader.config({
  paths: {
    vs: '/monaco-editor/vs'
  }
});

import { useStore } from './store/useStore';
import { ScopeBreadcrumbs } from './components/ScopeBreadcrumbs';
import { VariableNode } from './components/VariableNode';
import { FunctionCallNode } from './components/FunctionCallNode';
import { LiteralNode } from './components/LiteralNode';
import { LogicNode } from './components/LogicNode';
import { IfNode } from './components/IfNode';
import { SwitchNode } from './components/SwitchNode';
import { WhileNode } from './components/WhileNode';
import { ForNode } from './components/ForNode';
import { TryCatchNode } from './components/TryCatchNode';
import { GroupNode } from './components/GroupNode';
import { NativeApiNode } from './components/NativeApiNode';
import { ModernModal } from './components/ModernModal';
import { FunctionLibrary } from './components/FunctionLibrary';
import { FileExplorer } from './components/FileExplorer';
import { NoteNode } from './components/NoteNode';
import { Tooltip } from './components/Tooltip';
import { ConfirmationModal } from './components/ConfirmationModal';
import { FileControls } from './components/FileControls';
import { ToastContainer } from './components/ToastContainer';
import { SettingsView } from './components/SettingsView';

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
  noteNode: NoteNode
};

function FlowContent() {
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
    saveFile
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);


  const { fitView, deleteElements, getEdge, updateEdge } = useReactFlow();
  const isDark = theme === 'dark';

  // Edge Context Menu state
  const [edgeMenu, setEdgeMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    event.preventDefault();
    event.stopPropagation();
    setEdgeMenu({
      id: edge.id,
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setEdgeMenu(null);
  }, []);

  const handleEdgeAction = (action: 'comment' | 'delete') => {
    if (!edgeMenu) return;

    if (action === 'delete') {
      deleteElements({ edges: [{ id: edgeMenu.id }] });
    } else if (action === 'comment') {
      const edge = getEdge(edgeMenu.id);
      if (edge) {
        const currentLabel = edge.label as string || '';
        openModal({
          title: currentLabel ? t('edge.edit_comment') : t('edge.add_comment'),
          initialValue: currentLabel,
          type: 'prompt',
          placeholder: t('edge.comment_prompt'),
          confirmLabel: 'Salvar',
          onSubmit: (newLabel: string) => {
            updateEdge(edgeMenu.id, { label: newLabel });
          }
        });
      }
    }
    setEdgeMenu(null);
  };

  const scopeNodes = nodes.filter((n: any) =>
    n.id !== 'node-js-runtime' && (
      n.data?.scopeId === activeScopeId ||
      (activeScopeId === 'root' && (!n.data?.scopeId || n.data?.scopeId === 'root'))
    )
  );

  const hasNativeCalls = edges.some((e: any) =>
    e.source === 'node-js-runtime' &&
    scopeNodes.some((n: any) => n.id === e.target)
  );

  const runtimeNode = nodes.find(n => n.id === 'node-js-runtime');
  const filteredNodes: any[] = (hasNativeCalls && runtimeNode)
    ? [...scopeNodes, runtimeNode]
    : scopeNodes;

  const visibleNodeIds = new Set(filteredNodes.map((n: any) => n.id));
  const filteredEdges = edges.filter(e => {
    if (visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)) return true;
    if (e.source === 'node-js-runtime' && visibleNodeIds.has(e.target)) return true;
    return false;
  });

  useEffect(() => {
    if (filteredNodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 400, includeHiddenNodes: false });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeScopeId, fitView, filteredNodes.length]);

  // Determine if the currently selected edge (in context menu) has a label/comment
  const currentEdgeLabel = edgeMenu ? getEdge(edgeMenu.id)?.label : null;
  const hasComment = !!currentEdgeLabel;

  const isValidConnection = useCallback(
    (connection: any) => connection.source !== connection.target,
    []
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
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
        connectionRadius={50}
        defaultEdgeOptions={{
          style: { strokeWidth: 3, stroke: isDark ? '#4fc3f7' : '#0070f3' },
          animated: true,
          labelStyle: { fill: isDark ? '#fff' : '#000', fontWeight: 700, fontSize: 12 },
          labelBgStyle: { fill: isDark ? '#1e1e1e' : '#fff', fillOpacity: 0.8 }
        }}
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
      </ReactFlow>
    </div>
  );
}

function App() {
  const { t } = useTranslation();
  const {
    code, setCode, forceLayout, theme,
    showCode, showCanvas, showSidebar, activeSidebarTab, toggleSidebar, setSidebarTab,
    saveFile, setOpenedFolder, setSelectedFile,
    selectedFile, openedFolder, isBlockFile,
    confirmationModal, isDirty, openModal, git,
    setGitView, setGitSidebarView
  } = useStore();

  const isDark = theme === 'dark';
  const folderName = openedFolder ? openedFolder.split(/[\\/]/).pop() : null;

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? '#121212' : '#ffffff';
    document.body.setAttribute('data-theme', theme);
  }, [theme, isDark]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  useEffect(() => {
    // Professional approach: Wait for the next tick to ensure DOM is rendered
    const timer = setTimeout(() => {
      if ((window as any).electronAPI?.appReady) {
        (window as any).electronAPI.appReady();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) setCode(value);
  }, [setCode]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile();
    });
  }, [saveFile]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      color: isDark ? '#e0e0e0' : '#333',
      backgroundColor: isDark ? '#121212' : '#fff',
      overflow: 'hidden'
    }}>
      <SideRibbon />

      {activeSidebarTab === 'git' && (
        <ContextRibbon
          activeId={git.activeView}
          onSelect={(id) => setGitView(id as 'status' | 'terminal')}
          items={[
            { id: 'status', icon: Layers, label: 'Status & Alterações' },
            { id: 'terminal', icon: Terminal, label: 'Terminal Integrado' }
          ]}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ModernModal />
        <CommitDetailModal />
        <header style={{
          height: '40px',
          padding: '0 16px',
          background: isDark ? '#1e1e1e' : '#f3f4f6',
          borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          userSelect: 'none',
          WebkitAppRegion: 'drag'
        } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', WebkitAppRegion: 'no-drag' } as any}>
            {['explorer', 'library', 'git'].includes(activeSidebarTab) && (
              <button
                onClick={toggleSidebar}
                title={showSidebar ? t('app.hide_explorer') : t('app.show_explorer')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: showSidebar ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#888' : '#666'),
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PanelLeft size={20} strokeWidth={2} />
              </button>
            )}

            {showSidebar && (activeSidebarTab === 'explorer' || activeSidebarTab === 'library') && (
              <div style={{ display: 'flex', gap: '2px', marginLeft: '4px', paddingRight: '12px', borderRight: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
                <button
                  onClick={() => setSidebarTab('explorer')}
                  title="Explorador de Arquivos"
                  style={{
                    background: activeSidebarTab === 'explorer' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: activeSidebarTab === 'explorer' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                    padding: '6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Files size={18} />
                </button>
                <button
                  onClick={() => openedFolder && setSidebarTab('library')}
                  title="Biblioteca de Funções"
                  disabled={!openedFolder}
                  style={{
                    background: activeSidebarTab === 'library' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                    border: 'none',
                    cursor: !openedFolder ? 'default' : 'pointer',
                    color: !openedFolder ? (isDark ? '#333' : '#ccc') : activeSidebarTab === 'library' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                    padding: '6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: !openedFolder ? 0.5 : 1
                  }}
                >
                  <Library size={18} />
                </button>
              </div>
            )}

            {showSidebar && activeSidebarTab === 'git' && (
              <div style={{ display: 'flex', gap: '2px', marginLeft: '4px', paddingRight: '12px', borderRight: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
                <button
                  onClick={() => setGitSidebarView('info')}
                  title="Informações do Repositório"
                  style={{
                    background: git.sidebarView === 'info' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: git.sidebarView === 'info' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                    padding: '6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Info size={18} />
                </button>
                <button
                  onClick={() => setGitSidebarView('history')}
                  title="Histórico de Commits"
                  style={{
                    background: git.sidebarView === 'history' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: git.sidebarView === 'history' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                    padding: '6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <HistoryIcon size={18} />
                </button>
                <button
                  onClick={() => setGitSidebarView('graph')}
                  title="Grafo de Commits"
                  style={{
                    background: git.sidebarView === 'graph' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: git.sidebarView === 'graph' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                    padding: '6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Network size={18} />
                </button>
              </div>
            )}

            <div
              className="app-logo"
              style={{ transform: 'scale(0.8)', cursor: 'pointer', marginLeft: '8px' }}
              onClick={() => {
                const randomIndex = Math.floor(Math.random() * 5); // Fallback random
                openModal({
                  title: 'SOBRE',
                  initialValue: '',
                  type: 'about',
                  payload: { fallenIndex: randomIndex },
                  confirmLabel: 'Fechar',
                  onSubmit: () => { }
                });
              }}
            >
              <span className="logo-js" style={{ fontSize: '14px' }}>JS</span>
              <div className="logo-blocks" style={{ gap: '2px' }}>
                {['B', 'L', 'O', 'C', 'K'].map((letter, i) => (
                  <div
                    key={i}
                    className="logo-block"
                    style={{
                      width: '14px',
                      height: '14px',
                      fontSize: '9px',
                      borderRadius: '3px',
                      background: 'transparent',
                      color: isDark ? '#fff' : '#000',
                      fontWeight: 700
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal({
                        title: 'SOBRE',
                        initialValue: '',
                        type: 'about',
                        payload: { fallenIndex: i },
                        confirmLabel: 'Fechar',
                        onSubmit: () => { }
                      });
                    }}
                  >
                    <span className="logo-letter-visual">{letter}</span>
                  </div>
                ))}
              </div>
            </div>

            {activeSidebarTab === 'settings' && (
              <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.5, color: isDark ? '#fff' : '#000', marginLeft: '12px' }}>
                SISTEMA / CONFIGURAÇÕES
              </div>
            )}

            {folderName && activeSidebarTab !== 'settings' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                opacity: 0.8,
                padding: '2px 8px',
                borderRadius: '4px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                color: isDark ? '#aaa' : '#666'
              }}>
                <FolderOpen size={12} />
                <span style={{ fontWeight: 500 }}>{folderName}</span>
              </div>
            )}

            {/* Global Save Button - Only visible when a file is open */}
            {selectedFile && (
              <FileControls
                isDark={isDark}
                isDirty={isDirty}
                onSave={saveFile}
                onClose={() => setSelectedFile(null)}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', WebkitAppRegion: 'no-drag' } as any}>
            <button
              onClick={forceLayout}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#aaa' : '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <RefreshCw size={14} />
              <span>{t('app.layout')}</span>
            </button>

            <button
              onClick={async () => {
                if ((window as any).electronAPI) {
                  const path = await (window as any).electronAPI.selectFolder();
                  if (path) setOpenedFolder(path);
                }
              }}
              style={{
                background: isDark ? '#2d2d2d' : '#fff',
                border: `1px solid ${isDark ? '#444' : '#ccc'}`,
                cursor: 'pointer',
                color: isDark ? '#ddd' : '#444',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '4px'
              }}
            >
              <FolderOpen size={14} />
              <span>{t('app.open')}</span>
            </button>

            {/* Window Controls */}
            <div style={{ display: 'flex', marginLeft: '8px', borderLeft: `1px solid ${isDark ? '#333' : '#ddd'}`, paddingLeft: '8px' }}>
              <button
                onClick={() => (window as any).electronAPI?.windowMinimize()}
                title={t('app.window_controls.minimize')}
                style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', padding: '4px 8px', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => (window as any).electronAPI?.windowMaximize()}
                title={t('app.window_controls.maximize')}
                style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', padding: '4px 8px', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
              >
                <Square size={14} />
              </button>
              <button
                onClick={() => (window as any).electronAPI?.windowClose()}
                title={t('app.window_controls.close')}
                style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', padding: '4px 8px', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {activeSidebarTab === 'settings' ? (
            <SettingsView />
          ) : (
            <Allotment>
              <Allotment.Pane minSize={150} preferredSize={240} maxSize={450} visible={showSidebar}>
                {activeSidebarTab === 'git' ? (
                  <div style={{ height: '100%', borderRight: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`, background: isDark ? '#1a1a1a' : '#fff', overflow: 'hidden' }}>
                    {git.sidebarView === 'graph' ? (
                      <div
                        style={{
                          height: '100%',
                          background: isDark ? '#1a1a1a' : '#fff'
                        }}
                        className="git-graph-view"
                      >
                        <GitGraphView />
                        <style>{`
                          .git-graph-view .git-graph-row:hover .graph-actions {
                              opacity: 1 !important;
                          }
                        `}</style>
                      </div>
                    ) : git.sidebarView === 'info' ? (
                      <div style={{ height: '100%', background: isDark ? '#1a1a1a' : '#fff', overflow: 'hidden' }}>
                        <GitInfoPanel isDark={isDark} logs={git.log} />
                      </div>
                    ) : (
                      <CommitHistory
                        isDark={isDark}
                        logs={git.log}
                        isOpen={true}
                        onToggle={() => { }}
                      />
                    )}
                  </div>
                ) : (!openedFolder || activeSidebarTab === 'explorer') ? (
                  <FileExplorer />
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <ReactFlowProvider>
                      <FunctionLibrary />
                    </ReactFlowProvider>
                  </div>
                )}
              </Allotment.Pane>

              <Allotment.Pane minSize={200} preferredSize={350} visible={activeSidebarTab === 'git' || (!isBlockFile && showCode)}>
                {activeSidebarTab === 'git' ? (
                  <GitPanel />
                ) : (
                  <div
                    style={{ height: '100%', borderRight: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`, display: 'flex', flexDirection: 'column', background: isDark ? '#1a1a1a' : '#fff' }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {selectedFile && (
                      <div style={{
                        height: '32px',
                        background: isDark ? '#2d2d2d' : '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        fontSize: '0.75rem',
                        color: isDark ? '#aaa' : '#666',
                        borderBottom: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`
                      }}>
                        <Code size={14} style={{ marginRight: '8px' }} />
                        {selectedFile.split(/[\\/]/).pop()}
                      </div>
                    )}
                    {!selectedFile ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#444' : '#ccc', flexDirection: 'column', gap: '20px' }}>
                        <Code size={48} opacity={0.3} />
                        <p>{t('app.select_file')}</p>
                      </div>
                    ) : (
                      <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        value={code}
                        onChange={handleEditorChange}
                        onMount={handleEditorDidMount}
                        theme={isDark ? "vs-dark" : "light"}
                        options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 10 }, scrollBeyondLastLine: false }}
                      />
                    )}
                  </div>
                )}
              </Allotment.Pane>

              <Allotment.Pane minSize={400} visible={activeSidebarTab !== 'git' && (isBlockFile || showCanvas)}>
                <div style={{ width: '100%', height: '100%', background: isDark ? '#121212' : '#fafafa', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 10, pointerEvents: 'none' }}>
                    <div style={{ pointerEvents: 'auto', display: 'inline-block' }}>
                      <ScopeBreadcrumbs />
                    </div>
                  </div>
                  {!selectedFile ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#444' : '#ccc', flexDirection: 'column', gap: '20px' }}>
                      <Box size={64} style={{ opacity: 0.1, color: isDark ? '#fff' : '#000' }} />
                      <p style={{ fontSize: '1.1rem' }}>{t('app.open_folder_hint')}</p>
                    </div>
                  ) : (
                    <ReactFlowProvider>
                      <FlowContent />
                    </ReactFlowProvider>
                  )}
                </div>
              </Allotment.Pane>
            </Allotment>
          )}
        </div>
      </div>
      {confirmationModal && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          title={confirmationModal.title}
          message={confirmationModal.message}
          onConfirm={confirmationModal.onConfirm}
          onCancel={confirmationModal.onCancel}
          onDiscard={confirmationModal.onDiscard}
          confirmLabel={confirmationModal.confirmLabel}
          cancelLabel={confirmationModal.cancelLabel}
          discardLabel={confirmationModal.discardLabel}
          variant={confirmationModal.variant}
        />
      )}
      <ToastContainer />
    </div>
  );
}

export default App;
