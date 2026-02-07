import React, { useEffect, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useStore } from '../../../store/useStore';
import { X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const GitDiffEditor: React.FC = () => {
    const { git, closeGitDiffFile, getGitFileContent, saveFile, theme } = useStore();
    const { t } = useTranslation();

    const [originalContent, setOriginalContent] = useState<string>('');
    const [modifiedContent, setModifiedContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const filePath = git.selectedDiffFile;
    const isDark = theme === 'dark';

    useEffect(() => {
        const loadContent = async () => {
            if (!filePath || !window.electron) return;
            setIsLoading(true);
            try {
                // Fetch original content (HEAD)
                const original = await getGitFileContent(filePath, 'HEAD');
                setOriginalContent(original);

                // Fetch modified content (disk)
                const folder = useStore.getState().openedFolder;
                const fullPath = folder?.endsWith('/')
                    ? `${folder}${filePath}`
                    : `${folder}/${filePath}`;

                const modified = await window.electron.fileSystem.readFile(fullPath);
                setModifiedContent(modified);
            } catch (err) {
                console.error('Failed to load diff content:', err);
                setOriginalContent('');
                setModifiedContent('');
            } finally {
                setIsLoading(false);
            }
        };

        void loadContent();
    }, [filePath, getGitFileContent]);

    if (!filePath) return null;

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: isDark ? '#1e1e1e' : '#fff' }}>
            {/* Header */}
            <div style={{
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                background: isDark ? '#2d2d2d' : '#f0f0f0',
                borderBottom: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`,
                color: isDark ? '#ccc' : '#555',
                fontSize: '0.8rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>Diff:</span>
                    <span>{filePath}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     {/* Close Button */}
                    <button
                        onClick={closeGitDiffFile}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDark ? '#aaa' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#3c3c3c' : '#e0e0e0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Diff Editor */}
            <div style={{ flex: 1, position: 'relative' }}>
                {isLoading ? (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isDark ? '#888' : '#aaa'
                    }}>
                        Loading Diff...
                    </div>
                ) : (
                    <DiffEditor
                        height="100%"
                        theme={isDark ? "vs-dark" : "light"}
                        original={originalContent}
                        modified={modifiedContent}
                        language="typescript" // Auto-detect would be better but simple default is fine
                        options={{
                            readOnly: true, // Typically diff view is read-only, or at least the original side
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            renderSideBySide: true
                        }}
                    />
                )}
            </div>
        </div>
    );
};
