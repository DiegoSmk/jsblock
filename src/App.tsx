import { useEffect, useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  ReactFlowProvider,
} from '@xyflow/react';
import Editor, { loader, useMonaco } from '@monaco-editor/react';
import { Allotment } from 'allotment';
import {
  Code,
  Box,
  Layers,
  Terminal,
  Zap,
  ZapOff,
  SquareStack,
  Save,
  X,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/useStore';
import { useMonacoDecorations } from './features/execution/hooks/useMonacoDecorations';
import { SideRibbon } from './layout/SideRibbon';
import { ContextRibbon } from './components/ui/ContextRibbon';
import { SidebarContainer } from './layout/SidebarContainer';
import { MainWorkspace } from './components/ui/MainWorkspace';
import i18next from 'i18next';

import 'allotment/dist/style.css';
import '@xyflow/react/dist/style.css';

import type * as Monaco from 'monaco-editor';

// Configure Monaco loader to use local files copied to public/monaco-editor
loader.config({
  paths: {
    vs: '/monaco-editor/vs'
  }
});

import { ScopeBreadcrumbs } from './features/editor/components/ScopeBreadcrumbs';
import { ModernModal } from './components/ui/ModernModal';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { SettingsView } from './features/settings/SettingsView';
import { GitPanel } from './features/git/components/GitPanel';
import { ExtensionDetailsView } from './features/extensions/ExtensionDetailsView';
import { ExtensionLandingPage } from './features/extensions/ExtensionLandingPage';
import { CommandPalette } from './components/ui/CommandPalette';
import { CommitDetailModal } from './features/git/components/CommitDetailModal';
import { FlowContent } from './features/editor/components/FlowContent';
import { AppHeader } from './layout/AppHeader';

function App() {
  const { t } = useTranslation();
  const {
    code, setCode, theme,
    showCode, showCanvas, activeSidebarTab,
    saveFile,
    selectedFile, isBlockFile,
    confirmationModal, git,
    modal,
    selectedPluginId,
    settings,
    projectFiles,

    livePreviewEnabled,
    setLivePreviewEnabled,
    toggleCanvas,
    isDirty,
    setSelectedFile
  } = useStore(useShallow(state => ({
    code: state.code,
    setCode: state.setCode,
    theme: state.theme,
    showCode: state.showCode,
    showCanvas: state.showCanvas,
    activeSidebarTab: state.activeSidebarTab,
    saveFile: state.saveFile,
    selectedFile: state.selectedFile,
    isBlockFile: state.isBlockFile,
    confirmationModal: state.confirmationModal,
    git: state.git,
    modal: state.modal,
    selectedPluginId: state.selectedPluginId,
    settings: state.settings,
    projectFiles: state.projectFiles,

    livePreviewEnabled: state.livePreviewEnabled,
    setLivePreviewEnabled: state.setLivePreviewEnabled,
    toggleCanvas: state.toggleCanvas,
    isDirty: state.isDirty,
    setSelectedFile: state.setSelectedFile
  })));

  const isDark = theme === 'dark';


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
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Specifically catch and silence 'cancelation' errors from Monaco/Allotment
      if (event.reason && typeof event.reason === 'object' && (event.reason as Record<string, unknown>).type === 'cancelation') {
        event.preventDefault();
        return;
      }
      console.warn('Unhandled Promise Rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    const timer = setTimeout(() => {
      // Use the new window.electron pattern
      if (window.electron?.appReady) {
        window.electron.appReady();
      }
    }, 200);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      clearTimeout(timer);
    };
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) setCode(value);
  }, [setCode]);

  const monaco = useMonaco();

  // 1. Configure Monaco once when it's ready
  useEffect(() => {
    if (!monaco) return;

    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
    const m = monaco as any;
    m.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: m.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: m.languages.typescript.ModuleResolutionKind.NodeJs,
      module: m.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: m.languages.typescript.JsxEmit.React,
      allowJs: true,
    });
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
  }, [monaco]);

  // 2. Sync project files (cross-file support)
  useEffect(() => {
    if (!monaco || Object.keys(projectFiles).length === 0) return;

    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
    const m = monaco as any;

    Object.entries(projectFiles).forEach(([filePath, content]) => {
      const uri = m.Uri.file(filePath);
      const model = m.editor.getModel(uri);
      if (!model) {
        m.editor.createModel(content, 'typescript', uri);
      } else if (filePath !== selectedFile) {
        // Only update if content actually differs to avoid canceling internal monaco operations
        if (model.getValue() !== content) {
          model.setValue(content);
        }
      }
    });
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

  }, [monaco, projectFiles, selectedFile]);

  const [editorInstance, setEditorInstance] = useState<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, m: typeof Monaco) => {
    setEditorInstance(editor);
    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => {
      saveFile().catch(console.error);
    });
  }, [saveFile]);

  useMonacoDecorations(editorInstance);

  // Styles moved to src/index.css for reliability

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
              { id: 'status', icon: Layers, label: i18next.t('git.info.title') },
              { icon: Terminal, id: 'terminal', label: i18next.t('git.terminal.title') }
            ]}
          />
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <ModernModal key={modal.isOpen ? 'open' : 'closed'} />
          <CommitDetailModal />

          <AppHeader isDark={isDark} />

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
            {activeSidebarTab === 'settings' ? (
              <SettingsView />
            ) : (
              <ReactFlowProvider>
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
                              padding: '0 0 0 12px',
                              fontSize: '0.75rem',
                              color: isDark ? '#aaa' : '#666',
                              borderBottom: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`,
                              justifyContent: 'space-between'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                color: isDark ? '#aaa' : '#666'
                              }}>
                                <Code size={14} style={{ marginRight: '8px' }} />
                                {selectedFile.split(/[\\/]/).pop()}
                              </div>

                              <div style={{ display: 'flex', height: '100%' }}>
                                <div
                                  onClick={() => setLivePreviewEnabled(!livePreviewEnabled)}
                                  title={livePreviewEnabled ? "Disable Live Execution (Zap)" : "Enable Live Execution (Zap)"}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '38px',
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    color: livePreviewEnabled ? (isDark ? '#4ec9b0' : '#008080') : (isDark ? '#555' : '#ccc'),
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    borderLeft: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`
                                  }}
                                >
                                  {livePreviewEnabled ? <Zap size={18} fill={livePreviewEnabled ? 'currentColor' : 'none'} fillOpacity={0.2} /> : <ZapOff size={18} />}
                                </div>

                                <div
                                  onClick={() => toggleCanvas()}
                                  title={showCanvas ? "Hide Blocks Workspace" : "Show Blocks Workspace"}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '38px',
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    color: showCanvas ? (isDark ? '#6366f1' : '#4f46e5') : (isDark ? '#555' : '#ccc'),
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    borderLeft: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`
                                  }}
                                >
                                  <SquareStack size={18} fill={showCanvas ? 'currentColor' : 'none'} fillOpacity={0.1} />
                                </div>

                                <div
                                  onClick={() => { void saveFile(); }}
                                  title={isDirty ? "Save changes (Ctrl+S)" : "No pending changes"}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '38px',
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    color: isDirty ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#555' : '#ccc'),
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    borderLeft: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`,
                                    opacity: isDirty ? 1 : 0.8
                                  }}
                                >
                                  {isDirty ? (
                                    <Save size={16} strokeWidth={2.5} />
                                  ) : (
                                    <Check size={16} strokeWidth={2} style={{ color: isDark ? '#4ade80' : '#16a34a' }} />
                                  )}
                                </div>

                                <div
                                  onClick={() => void setSelectedFile(null)}
                                  title="Close file"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '38px',
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    color: isDark ? '#555' : '#aaa',
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    borderLeft: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`,
                                    opacity: 0.6
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = isDark ? '#fff' : '#ef4444';
                                    e.currentTarget.style.opacity = '1';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = isDark ? '#555' : '#aaa';
                                    e.currentTarget.style.opacity = '0.6';
                                  }}
                                >
                                  <X size={16} />
                                </div>
                              </div>
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
                              path={selectedFile || undefined}
                              value={code}
                              onChange={handleEditorChange}
                              onMount={handleEditorDidMount}
                              theme={isDark ? "vs-dark" : "light"}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                padding: { top: 10 },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                glyphMargin: true,
                                lineDecorationsWidth: 10,
                                scrollBeyondLastColumn: 50, // Allow space for inline values
                                cursorStyle: 'line',
                                cursorBlinking: 'smooth'
                              }}
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
                          <FlowContent />
                        )}
                      </div>
                    </Allotment.Pane>
                  </Allotment>
                </div>
              </ReactFlowProvider>
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
