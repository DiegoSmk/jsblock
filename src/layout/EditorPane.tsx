import React from 'react';
import Editor from '@monaco-editor/react';
import { Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EditorToolbar } from './EditorToolbar';
import { BenchmarkPanel } from '../features/execution/components/BenchmarkPanel';

import type * as Monaco from 'monaco-editor';

interface EditorPaneProps {
    isDark: boolean;
    code: string;
    selectedFile: string | null;
    livePreviewEnabled: boolean;
    showCanvas: boolean;
    isDirty: boolean;
    onEditorChange: (value: string | undefined) => void;
    onEditorDidMount: (editor: Monaco.editor.IStandaloneCodeEditor, m: typeof Monaco) => void;
    onToggleLivePreview: () => void;
    onToggleCanvas: () => void;
    onSave: () => void;
    onClose: () => void;
}

/**
 * Complete editor pane: toolbar + Monaco editor + benchmark panel.
 * Extracted from App.tsx — all styles and behavior preserved exactly.
 */
export const EditorPane: React.FC<EditorPaneProps> = ({
    isDark,
    code,
    selectedFile,
    livePreviewEnabled,
    showCanvas,
    isDirty,
    onEditorChange,
    onEditorDidMount,
    onToggleLivePreview,
    onToggleCanvas,
    onSave,
    onClose,
}) => {
    const { t } = useTranslation();

    return (
        <div
            style={{ height: '100%', borderRight: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`, display: 'flex', flexDirection: 'column', background: isDark ? '#1a1a1a' : '#fff' }}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <EditorToolbar
                isDark={isDark}
                selectedFile={selectedFile}
                livePreviewEnabled={livePreviewEnabled}
                showCanvas={showCanvas}
                isDirty={isDirty}
                onToggleLivePreview={onToggleLivePreview}
                onToggleCanvas={onToggleCanvas}
                onSave={onSave}
                onClose={onClose}
            />
            <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
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
                        onChange={onEditorChange}
                        onMount={onEditorDidMount}
                        theme={isDark ? "vs-dark" : "light"}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            padding: { top: 10 },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            glyphMargin: true,
                            lineDecorationsWidth: 10,
                            scrollBeyondLastColumn: 50,
                            cursorStyle: 'line',
                            cursorBlinking: 'smooth'
                        }}
                    />
                )}
            </div>
            <BenchmarkPanel />
        </div>
    );
};
