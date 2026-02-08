import React, { useEffect, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useStore } from '../../../store/useStore';

interface GitDiffEditorProps {
    filePath?: string;
    openedFolder?: string;
}

export const GitDiffEditor: React.FC<GitDiffEditorProps> = ({ filePath: propFilePath, openedFolder: propOpenedFolder }) => {
    const { getGitFileContent, theme } = useStore();

    const [currentFilePath, setCurrentFilePath] = useState<string | undefined>(propFilePath);
    const [currentFolder, setCurrentFolder] = useState<string | undefined>(propOpenedFolder);

    const [originalContent, setOriginalContent] = useState<string>('');
    const [modifiedContent, setModifiedContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const isDark = theme === 'dark';

    // Listen for updates from Main process (Singleton mode)
    useEffect(() => {
        if (!window.electron?.on) return;

        const unsubscribe = window.electron.on('window-update-payload', (payload: any) => {
            if (payload?.filePath) {
                setCurrentFilePath(payload.filePath);
            }
            if (payload?.openedFolder) {
                setCurrentFolder(payload.openedFolder);
            }
        });

        return () => { unsubscribe(); };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadContent = async () => {
            if (!currentFilePath || !window.electron) return;
            setIsLoading(true);
            try {
                // Fetch original content (HEAD)
                const original = await getGitFileContent(currentFilePath, 'HEAD');
                if (!isMounted) return;
                setOriginalContent(original);

                // Fetch modified content (disk)
                const folder = currentFolder || useStore.getState().openedFolder;
                if (!folder) return;

                // Safer path join - Check if currentFilePath is already absolute
                let fullPath = currentFilePath;
                if (!currentFilePath.startsWith('/') && !currentFilePath.startsWith('\\') && !(currentFilePath.length > 2 && currentFilePath[1] === ':')) {
                    const cleanFolder = folder.replace(/[/\\]$/, '');
                    fullPath = `${cleanFolder}/${currentFilePath}`;
                }

                try {
                    // Check if file exists before reading to avoid terminal error noise
                    const exists = await window.electron.fileSystem.checkExists(fullPath);
                    if (exists) {
                        const modified = await window.electron.fileSystem.readFile(fullPath);
                        if (isMounted) setModifiedContent(modified);
                    } else {
                        // If relative join failed, try currentFilePath directly if it looks absolute
                        const existsDirect = await window.electron.fileSystem.checkExists(currentFilePath);
                        if (existsDirect) {
                            const modified = await window.electron.fileSystem.readFile(currentFilePath);
                            if (isMounted) setModifiedContent(modified);
                        } else {
                            if (isMounted) setModifiedContent('');
                        }
                    }
                } catch (readErr: any) {
                    if (isMounted) setModifiedContent('');
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
    }, [currentFilePath, currentFolder, getGitFileContent]);

    const editorRef = React.useRef<any>(null);

    if (!currentFilePath) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#444' : '#ccc' }}>
            Selecione um arquivo para ver as alterações
        </div>
    );

    // Detect language from extension
    const extension = currentFilePath.split('.').pop()?.toLowerCase() || 'typescript';
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
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
            {/* Unified Header is now handled by WindowOutlet */}

            {/* Diff Editor - KEEP MOUNTED to avoid disposal errors */}
            <div style={{ flex: 1, position: 'relative' }}>
                <DiffEditor
                    key={currentFilePath}
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
                        wordWrap: 'on',
                        renderOverviewRuler: false,
                        scrollbar: {
                            vertical: 'visible',
                            horizontal: 'visible',
                            useShadows: false,
                            verticalScrollbarSize: 10,
                            horizontalScrollbarSize: 10
                        }
                    }}
                />

                {/* Loading Overlay */}
                {isLoading && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDark ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.4)',
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
