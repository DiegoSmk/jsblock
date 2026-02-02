import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  ReactFlowProvider,
} from '@xyflow/react';
import Editor, { loader } from '@monaco-editor/react';
import { Allotment } from 'allotment';
import {
  FolderOpen, X, Minus, Square, Info, LogOut,
  History as HistoryIcon, Network, RefreshCw, PanelLeft, Code, Files,
  Library, Box, Layers, Terminal
} from 'lucide-react';
import { GitPanel } from './components/GitPanel';
import { CommitHistory } from './components/git/CommitHistory';
import { GitInfoPanel } from './components/git/GitInfoPanel';
import { CommitDetailModal } from './components/git/CommitDetailModal';
import { SideRibbon } from './components/SideRibbon';
import { ContextRibbon } from './components/ui/ContextRibbon';
import { SidebarContainer } from './components/SidebarContainer';
import { MainWorkspace } from './components/ui/MainWorkspace';
import { useTranslation } from 'react-i18next';
import 'allotment/dist/style.css';
import '@xyflow/react/dist/style.css';
import type { ElectronAPI } from './types/electron';

// Configure Monaco loader to use local files copied to public/monaco-editor
loader.config({
  paths: {
    vs: '/monaco-editor/vs'
  }
});

import { useStore } from './store/useStore';
import { ScopeBreadcrumbs } from './components/ScopeBreadcrumbs';
import { ModernModal } from './components/ModernModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { FileControls } from './components/FileControls';
import { ToastContainer } from './components/ToastContainer';
import { SettingsView } from './components/SettingsView';
import { ExtensionsView } from './components/ExtensionsView';
import { ExtensionDetailsView } from './components/ExtensionDetailsView';
import { ExtensionLandingPage } from './components/ExtensionLandingPage';
import { CommandPalette } from './components/CommandPalette';
import { DESIGN_TOKENS } from './constants/design';
import { FlowContent } from './components/FlowContent';

function App() {
  const { t } = useTranslation();
  const {
    code, setCode, forceLayout, theme,
    showCode, showCanvas, activeSidebarTab, toggleSidebar, setSidebarTab,
    saveFile, setOpenedFolder, setSelectedFile,
    selectedFile, openedFolder, isBlockFile,
    confirmationModal, isDirty, openModal, git,
    modal,
    setGitSidebarView,
    layout,
    selectedPluginId,
    settings
  } = useStore(useShallow(state => ({
    code: state.code,
    setCode: state.setCode,
    forceLayout: state.forceLayout,
    theme: state.theme,
    showCode: state.showCode,
    showCanvas: state.showCanvas,
    activeSidebarTab: state.activeSidebarTab,
    toggleSidebar: state.toggleSidebar,
    setSidebarTab: state.setSidebarTab,
    saveFile: state.saveFile,
    setOpenedFolder: state.setOpenedFolder,
    setSelectedFile: state.setSelectedFile,
    selectedFile: state.selectedFile,
    openedFolder: state.openedFolder,
    isBlockFile: state.isBlockFile,
    confirmationModal: state.confirmationModal,
    isDirty: state.isDirty,
    openModal: state.openModal,
    git: state.git,
    modal: state.modal,
    setGitSidebarView: state.setGitSidebarView,
    layout: state.layout,
    selectedPluginId: state.selectedPluginId,
    settings: state.settings
  })));

  const showSidebar = layout.sidebar.isVisible;
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
        saveFile().catch(console.error);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  useEffect(() => {
    // Professional approach: Wait for the next tick to ensure DOM is rendered
    const timer = setTimeout(() => {
      const electronAPI = (window as unknown as { electronAPI?: ElectronAPI }).electronAPI;
      if (electronAPI?.appReady) {
        void electronAPI.appReady();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) setCode(value);
  }, [setCode]);

  const handleEditorDidMount = useCallback((editor: unknown, monaco: unknown) => {
    const editorInstance = editor as { addCommand: (keyMod: number, callback: () => void) => void };
    const monacoInstance = monaco as { KeyMod: { CtrlCmd: number }; KeyCode: { KeyS: number } };

    editorInstance.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      saveFile().catch(console.error);
    });
  }, [saveFile]);

  const handleSaveFile = useCallback(() => {
    void saveFile();
  }, [saveFile]);

  const showAppBorder = settings.showAppBorder;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: isDark ? '#000' : '#fff',
      color: isDark ? '#fff' : '#000',
      overflow: 'hidden',
      padding: showAppBorder ? '4px' : '0',
      transition: 'padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative'
    }}>
      {showAppBorder && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(45deg, #6366f1, #a855f7, #ec4899, #3b82f6)',
          backgroundSize: '300% 300%',
          animation: 'border-pulse 8s linear infinite',
          zIndex: 0
        }} />
      )}
      <style>
        {`
          @keyframes border-pulse {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
      <div style={{
        flex: 1,
        display: 'flex',
        color: isDark ? '#e0e0e0' : '#333',
        backgroundColor: isDark ? '#121212' : '#fff',
        overflow: 'hidden',
        borderRadius: showAppBorder ? '8px' : '0',
        position: 'relative',
        zIndex: 1,
        boxShadow: showAppBorder ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
        transition: 'border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <SideRibbon />

        {activeSidebarTab === 'git' && (
          <ContextRibbon
            activeId={git.activeView === 'terminal' ? 'terminal' : 'status'}
            onSelect={(id) => {
              if (id === 'terminal') {
                useStore.getState().setGitView('terminal');
              } else {
                useStore.getState().setGitView('status');
              }
            }}
            items={[
              { id: 'status', icon: Layers, label: t('git.info.title') },
              { icon: Terminal, id: 'terminal', label: t('git.terminal.title') }
            ]}
          />
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <ModernModal key={modal.isOpen ? 'open' : 'closed'} />
          <CommitDetailModal />
          <header style={{
            height: DESIGN_TOKENS.RIBBON_WIDTH,
            padding: '0 8px',
            background: isDark ? '#1e1e1e' : '#f3f4f6',
            borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            userSelect: 'none',
            WebkitAppRegion: 'drag'
          } as React.CSSProperties}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              {['explorer', 'library', 'git'].includes(activeSidebarTab) && (
                <button
                  onClick={() => toggleSidebar()}
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
                    title={t('git.info.title')}
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
                    title={t('git.status.history_list')}
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
                    title={t('git.graph.title')}
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
                    title: 'About',
                    initialValue: '',
                    type: 'about',
                    payload: { fallenIndex: randomIndex },
                    confirmLabel: 'Close',
                    onSubmit: () => {
                      // Modal closed
                    }
                  });
                }}
              >
                <span className="logo-js" style={{ fontSize: '14px' }}>JS</span>
                <div className="logo-blocks" style={{ gap: '2px' }}>
                  {['B', 'L', 'O', 'C', 'K'].map((letter) => (
                    <div
                      key={`logo-${letter}`}
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
                        const randomIndex = Math.floor(Math.random() * 5);
                        openModal({
                          title: 'About',
                          initialValue: '',
                          type: 'about',
                          payload: { fallenIndex: randomIndex },
                          confirmLabel: 'Close',
                          onSubmit: () => {
                            // Modal closed
                          }
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
                  System / Settings
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
                  onSave={handleSaveFile}
                  onClose={() => {
                    void setSelectedFile(null);
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              <div
                style={{
                  marginRight: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <button
                  onClick={() => {
                    forceLayout();
                  }}
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
                  onClick={() => {
                    if (openedFolder) {
                      setOpenedFolder(null);
                      void setSelectedFile(null);
                    } else {
                      const electronAPI = (window as unknown as { electronAPI?: ElectronAPI }).electronAPI;
                      if (electronAPI) {
                        electronAPI.selectFolder()
                          .then((path) => {
                            if (path) setOpenedFolder(path);
                          })
                          .catch(console.error);
                      }
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
                  {openedFolder ? <LogOut size={14} /> : <FolderOpen size={14} />}
                  <span>{openedFolder ? t('app.window_controls.close') : t('app.open')}</span>
                </button>

                {/* Window Controls */}
                <div style={{ display: 'flex', marginLeft: '8px', borderLeft: `1px solid ${isDark ? '#333' : '#ddd'}`, paddingLeft: '8px' }}>
                  <button
                    onClick={() => {
                      void window.electronAPI.windowMinimize();
                    }}
                    title={t('app.window_controls.minimize')}
                    style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', padding: '4px 8px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    onClick={() => {
                      void window.electronAPI.windowMaximize();
                    }}
                    title={t('app.window_controls.maximize')}
                    style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', padding: '4px 8px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
                  >
                    <Square size={14} />
                  </button>
                  <button
                    onClick={() => {
                      void window.electronAPI.windowClose();
                    }}
                    title={t('app.window_controls.close')}
                    style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', padding: '4px 8px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
            {activeSidebarTab === 'settings' ? (
              <SettingsView />
            ) : (
              <>
                 <SidebarContainer />
                 <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative' }}>
                    <Allotment>
                    <Allotment.Pane
                      minSize={activeSidebarTab === 'git' || activeSidebarTab === 'extensions' || (!isBlockFile && showCode) ? 200 : 0}
                      preferredSize={activeSidebarTab === 'git' || activeSidebarTab === 'extensions' || (!isBlockFile && showCode) ? 350 : 0}
                      visible={activeSidebarTab === 'git' || activeSidebarTab === 'extensions' || (!isBlockFile && showCode)}
                    >
                      {activeSidebarTab === 'git' ? (
                        <MainWorkspace isDark={isDark}>
                          <GitPanel />
                        </MainWorkspace>
                      ) : activeSidebarTab === 'extensions' ? (
                        <MainWorkspace isDark={isDark}>
                          {selectedPluginId ? <ExtensionDetailsView /> : <ExtensionLandingPage />}
                        </MainWorkspace>
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

                    <Allotment.Pane minSize={400} visible={activeSidebarTab !== 'git' && activeSidebarTab !== 'extensions' && (isBlockFile || showCanvas)}>
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
                 </div>
              </>
            )}
          </div>
          {
            confirmationModal && (
              <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                title={confirmationModal.title}
                message={confirmationModal.message}
                onConfirm={() => { if (confirmationModal.onConfirm) void confirmationModal.onConfirm(); }}
                onCancel={() => { if (confirmationModal.onCancel) void confirmationModal.onCancel(); }}
                onDiscard={() => { if (confirmationModal.onDiscard) void confirmationModal.onDiscard(); }}
                confirmLabel={confirmationModal.confirmLabel}
                cancelLabel={confirmationModal.cancelLabel}
                discardLabel={confirmationModal.discardLabel}
                variant={confirmationModal.variant}
                discardVariant={confirmationModal.discardVariant}
              />
            )
          }
          <ToastContainer />
          <CommandPalette />
        </div>
      </div>
    </div>
  );
}

export default App;
