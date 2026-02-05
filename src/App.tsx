import { useEffect, useCallback, useState, useRef } from 'react';
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
  Eye,
  EyeOff
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
import type * as Monaco from 'monaco-editor';

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
    projectFiles,
    executionResults,
    executionErrors,
    executionCoverage,
    livePreviewEnabled,
    setLivePreviewEnabled
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
    executionResults: state.executionResults,
    executionErrors: state.executionErrors,
    executionCoverage: state.executionCoverage,
    livePreviewEnabled: state.livePreviewEnabled,
    setLivePreviewEnabled: state.setLivePreviewEnabled
  })));

  const isDark = theme === 'dark';
  const cursorLineRef = useRef<number>(-1); // Track cursor line to hide decorations

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

  const monaco = useMonaco();

  useEffect(() => {
    if (!monaco || Object.keys(projectFiles).length === 0) return;

    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
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
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

  }, [monaco, projectFiles, selectedFile]);

  const [editorInstance, setEditorInstance] = useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const handleEditorDidMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, m: typeof Monaco) => {
    setEditorInstance(editor);
    editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => {
      saveFile().catch(console.error);
    });
  }, [saveFile]);

  // Quokka-like decorations
  useEffect(() => {
    if (!editorInstance || !monaco) return;

    // Track cursor position to hide decorations on current line
    const disposable = editorInstance.onDidChangeCursorPosition((e) => {
      cursorLineRef.current = e.position.lineNumber;
      // Trigger re-render of decorations (this might be expensive, so we might want to debounce or use a different strategy)
      // For now, we rely on the next render cycle or code change. 
      // Actually, to make it instant, we need to force update decorations.
      // Let's just update the ref, and let the decoration logic handle it on next cycle.
      // To force refresh, we can toggle a dummy state or just call the decoration logic if we extracted it.
    });

    const model = editorInstance.getModel();
    if (!model) return;

    // Clear decorations if disabled
    if (!livePreviewEnabled) {
      decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, []);
      const styleId = 'dynamic-execution-styles';
      const styleEl = document.getElementById(styleId);
      if (styleEl) styleEl.textContent = '';
      return;
    }

    const decorations: Monaco.editor.IModelDeltaDecoration[] = [];

    // Dynamic CSS Injection Strategy
    let dynamicCss = '';

    // Helper to process text (clean emojis, escape CSS)
    const processText = (text: string) => {
      return (text.length > 50 ? text.substring(0, 47) + '...' : text)
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\A ');
    };

    interface ExecutionEntry {
      value: string;
      type: string;
    }

    const processEntries = (map: Map<number, ExecutionEntry[] | string>, type: 'result' | 'error') => {
      if (!map || map.size === 0) return;

      map.forEach((entry, lineKey) => {
        const line = Number(lineKey);
        if (isNaN(line) || line < 1 || line > model.getLineCount()) return;

        // SKIP DECORATION IF CURSOR IS ON THIS LINE (Requested feature)
        // But mainly for errors, maybe keep values? User said "log only appear when I'm not on the line".
        // Let's apply this rule generally for cleaner typing.
        if (line === cursorLineRef.current) return;

        let text = '';
        let isLog = false;

        if (type === 'result') {
          // Entry is array of { value, type }
          const entries = entry as ExecutionEntry[];

          // Deduplicate values
          const uniqueValues = new Set();
          const uniqueEntries = entries.filter(e => {
            if (uniqueValues.has(e.value)) return false;
            uniqueValues.add(e.value);
            return true;
          });

          text = uniqueEntries.map(e => processText(e.value)).join(' | ');
          isLog = entries.some(e => e.type === 'log');
        } else {
          // Entry is string (error message)
          text = processText(typeof entry === 'string' ? entry : entry.map(e => e.value).join(' | '));
        }

        const className = `deco-${type}-${line}`;
        dynamicCss += `.${className}::after { content: "${text}"; }\n`;

        const maxCol = model.getLineMaxColumn(line);

        let baseClass = 'execution-decoration-base';
        if (type === 'error') baseClass += ' execution-decoration-error';
        else if (isLog) baseClass += ' execution-decoration-log';
        else baseClass += ' execution-decoration-val';

        decorations.push({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
          range: new (monaco as any).Range(line, maxCol, line, maxCol),
          options: {
            isWholeLine: false,
            afterContentClassName: `${baseClass} ${className}`,
            linesDecorationsClassName: type === 'error' ? 'execution-error-gutter' : 'execution-coverage-gutter'
          }
        });
      });
    };

    // 1. Process Results
    processEntries(executionResults as unknown as Map<number, ExecutionEntry[] | string>, 'result');

    // 2. Process Errors
    processEntries(executionErrors as unknown as Map<number, ExecutionEntry[] | string>, 'error');

    // Inject CSS
    const styleId = 'dynamic-execution-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = dynamicCss;

    // Apply decorations
    decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, decorations);

    return () => {
      disposable.dispose();
    };

  }, [executionResults, executionErrors, executionCoverage, editorInstance, monaco, selectedFile, code, livePreviewEnabled]); // Added livePreviewEnabled and code

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

                              <div
                                onClick={() => setLivePreviewEnabled(!livePreviewEnabled)}
                                title={livePreviewEnabled ? "Disable Live Preview" : "Enable Live Preview"}
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
                                {livePreviewEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
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
                                scrollBeyondLastColumn: 50 // Allow space for inline values
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
