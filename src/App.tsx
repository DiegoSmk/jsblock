import { useEffect, useCallback, useRef } from 'react';
import { useMonacoDecorations } from './hooks/useMonacoDecorations';
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
  Terminal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/useStore';
import { SideRibbon } from './components/SideRibbon';
import { ContextRibbon } from './components/ui/ContextRibbon';
import { SidebarContainer } from './components/SidebarContainer';
import { MainWorkspace } from './components/ui/MainWorkspace';
import i18next from 'i18next';

import 'allotment/dist/style.css';
import '@xyflow/react/dist/style.css';
import type { ElectronAPI } from './types/electron';

// Configure Monaco loader to use local files copied to public/monaco-editor
loader.config({
  paths: {
    vs: '/monaco-editor/vs'
  }
});

import { ScopeBreadcrumbs } from './components/ScopeBreadcrumbs';
import { ModernModal } from './components/ModernModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ToastContainer } from './components/ToastContainer';
import { SettingsView } from './components/SettingsView';
import { GitPanel } from './components/GitPanel';
import { ExtensionDetailsView } from './components/ExtensionDetailsView';
import { ExtensionLandingPage } from './components/ExtensionLandingPage';
import { CommandPalette } from './components/CommandPalette';
import { CommitDetailModal } from './components/git/CommitDetailModal';
import { FlowContent } from './components/FlowContent';
import { AppHeader } from './components/layout/AppHeader';

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
    projectFiles
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
    projectFiles: state.projectFiles
  })));

  const isDark = theme === 'dark';

  const editorRef = useRef<any>(null);
  const monaco = useMonaco();

  // Use the new hook for Quokka-like decorations
  useMonacoDecorations(editorRef.current, monaco);

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

  /* Removed duplicate monaco declaration */

  useEffect(() => {
    if (!monaco || Object.keys(projectFiles).length === 0) return;

    const m = monaco as any;

    // TypeScript compiler options
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

    Object.entries(projectFiles).forEach(([filePath, content]) => {
      const uri = m.Uri.file(filePath);
      const model = m.editor.getModel(uri);
      if (!model) {
        m.editor.createModel(content, 'typescript', uri);
      } else if (filePath !== selectedFile) {
        model.setValue(content);
      }
    });

  }, [monaco, projectFiles, selectedFile]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile().catch(console.error);
    });
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
                                automaticLayout: true
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
