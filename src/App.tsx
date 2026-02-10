import { useEffect, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  ReactFlowProvider,
} from '@xyflow/react';
import { loader } from '@monaco-editor/react';
import { Allotment } from 'allotment';
import {
  Layers,
  Terminal,
} from 'lucide-react';
import { useStore } from './store/useStore';
import { useGlobalEventListeners } from './hooks/useGlobalEventListeners';
import { useMonacoSetup } from './hooks/useMonacoSetup';
import { SideRibbon } from './layout/SideRibbon';
import { ContextRibbon } from './components/ui/ContextRibbon';
import { SidebarContainer } from './layout/SidebarContainer';
import { MainWorkspace } from './components/ui/MainWorkspace';
import i18next from 'i18next';

import 'allotment/dist/style.css';
import '@xyflow/react/dist/style.css';

// Configure Monaco loader to use local files copied to public/monaco-editor
loader.config({
  paths: {
    vs: '/monaco-editor/vs'
  }
});

import { ModernModal } from './components/ui/ModernModal';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { SettingsView } from './features/settings/SettingsView';
import { GitPanel } from './features/git/components/GitPanel';
import { ExtensionDetailsView } from './features/extensions/ExtensionDetailsView';
import { ExtensionLandingPage } from './features/extensions/ExtensionLandingPage';
import { CommandPalette } from './components/ui/CommandPalette';
import { CommitDetailModal } from './features/git/components/CommitDetailModal';
import { AppHeader } from './layout/AppHeader';
import { AppFooter } from './layout/AppFooter';
import { EditorPane } from './layout/EditorPane';
import { CanvasPane } from './layout/CanvasPane';
import { WindowOutlet } from './routes/WindowOutlet';

function App() {
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
    setSelectedFile,
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
    isDirty: state.isDirty,
    setSelectedFile: state.setSelectedFile,
    setLivePreviewEnabled: state.setLivePreviewEnabled,
    toggleCanvas: state.toggleCanvas,
  })));

  const isDark = theme === 'dark';

  // Detect windowed mode via URL search params (set by WindowManager)
  const isWindowed = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'window';
  }, []);

  useEffect(() => {
    if (!isWindowed) {
      document.body.style.backgroundColor = isDark ? '#121212' : '#ffffff';
      document.body.classList.remove('is-windowed');
      document.documentElement.classList.remove('is-windowed');
    } else {
      document.body.style.backgroundColor = 'transparent';
      document.body.classList.add('is-windowed');
      document.documentElement.classList.add('is-windowed');
    }
    document.body.setAttribute('data-theme', theme);
  }, [theme, isDark, isWindowed]);

  // Notify Electron that the app is ready as soon as the basic component mounts
  useEffect(() => {
    if (window.electron?.appReady) {
      window.electron.appReady();
    }
  }, []);

  // CRITICAL: These hooks are MANDATORY for app functionality
  // - useGlobalEventListeners: Storage sync, keyboard shortcuts, rejection handler
  // - useMonacoSetup: Monaco configuration, project file sync, editor decorations
  useGlobalEventListeners();
  const { handleEditorDidMount } = useMonacoSetup({ projectFiles, selectedFile, saveFile });

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) setCode(value);
  }, [setCode]);

  // Styles moved to src/index.css for reliability

  const showAppBorder = settings.showAppBorder;

  // If in windowed mode, we only render the specific component requested
  if (isWindowed) {
    return (
      <div style={{
        background: 'none',
        backgroundColor: 'transparent',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}>
        <WindowOutlet />
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: isDark ? '#000' : '#fff',
      color: isDark ? '#fff' : '#000',
      overflow: 'hidden',
      padding: '6px', // Permanent padding to allow resize grip on edges
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
                <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
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
                        <EditorPane
                          isDark={isDark}
                          code={code}
                          selectedFile={selectedFile}
                          livePreviewEnabled={livePreviewEnabled}
                          showCanvas={showCanvas}
                          isDirty={isDirty}
                          onEditorChange={handleEditorChange}
                          onEditorDidMount={handleEditorDidMount}
                          onToggleLivePreview={() => setLivePreviewEnabled(!livePreviewEnabled)}
                          onToggleCanvas={() => toggleCanvas()}
                          onSave={() => { void saveFile(); }}
                          onClose={() => void setSelectedFile(null)}
                        />
                      )}
                    </Allotment.Pane>

                    <Allotment.Pane minSize={400} visible={activeSidebarTab !== 'git' && activeSidebarTab !== 'extensions' && (isBlockFile || showCanvas)}>
                      <CanvasPane isDark={isDark} selectedFile={selectedFile} />
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
          <AppFooter />
        </div>
      </div>
    </div>
  );
}

export default App;
