import React, { useEffect, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useStore } from '../../../store/useStore';
import { X } from 'lucide-react';

export const GitDiffEditor: React.FC = () => {
    const { git, closeGitDiffFile, getGitFileContent, theme } = useStore();

    const [originalContent, setOriginalContent] = useState<string>('');
    const [modifiedContent, setModifiedContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const filePath = git.selectedDiffFile;
    const isDark = theme === 'dark';

    useEffect(() => {
        let isMounted = true;
        const loadContent = async () => {
            if (!filePath || !window.electron) return;
            setIsLoading(true);
            try {
                // Fetch original content (HEAD)
                const original = await getGitFileContent(filePath, 'HEAD');
                if (!isMounted) return;
                setOriginalContent(original);

                // Fetch modified content (disk)
                const folder = useStore.getState().openedFolder;
                if (!folder) return;

                // Safer path join
                const fullPath = folder.replace(/[/\\]$/, '') + (filePath.startsWith('/') || filePath.startsWith('\\') ? filePath : '/' + filePath);

                try {
                    const modified = await window.electron.fileSystem.readFile(fullPath);
                    if (isMounted) setModifiedContent(modified);
                } catch (readErr: any) {
                    // If file is deleted on disk, show empty modified side
                    if (readErr?.message?.includes('ENOENT')) {
                        if (isMounted) setModifiedContent('');
                    } else {
                        throw readErr;
                    }
                }
            } catch (err) {
                console.error('Failed to load diff content:', err);
                if (isMounted) {
                    setOriginalContent('');
                    setModifiedContent('');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void loadContent();
        return () => { isMounted = false; };
    }, [filePath, getGitFileContent]);

    const editorRef = React.useRef<any>(null);

    if (!filePath) return null;

    // Detect language from extension
    const extension = filePath.split('.').pop()?.toLowerCase() || 'typescript';
    const langMap: Record<string, string> = {
        'js': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'jsx': 'javascript',
        'css': 'css',
        'json': 'json',
        'html': 'html',
        'py': 'python',
        'md': 'markdown'
    };
    const language = langMap[extension] || 'typescript';

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 600 }}>Diff:</span>
                    <span style={{ opacity: 0.8, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{filePath}</span>
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

            {/* Diff Editor - KEEP MOUNTED to avoid disposal errors */}
            <div style={{ flex: 1, position: 'relative' }}>
                <DiffEditor
                    key={filePath}
                    height="100%"
                    onMount={(editor) => { editorRef.current = editor; }}
                    theme={isDark ? "vs-dark" : "light"}
                    original={originalContent}
                    modified={modifiedContent}
                    language={language}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        renderSideBySide: true,
                        folding: true,
                        wordWrap: 'on'
                    }}
                />

                {/* Loading Overlay */}
                {isLoading && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDark ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                        zIndex: 10,
                        color: isDark ? '#888' : '#aaa',
                        backdropFilter: 'blur(2px)'
                    }}>
                        Loading Diff...
                    </div>
                )}
            </div>
        </div>
    );
};
