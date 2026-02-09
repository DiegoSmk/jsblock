import React, { useMemo, useState, useEffect } from 'react';
import { GitTerminalView } from '../features/git/components/GitTerminalView';
import { GitDiffEditor } from '../features/git/components/GitDiffEditor';
import { SearchPanel } from '../features/workspace/components/SearchPanel';
import { useStore } from '../store/useStore';
import { hexToRgba } from '../utils/colors';
import { X, Move, Pin, PinOff } from 'lucide-react';

export const WindowOutlet: React.FC = () => {
    const params = useMemo(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('mode')) return searchParams;

        // Fallback to hash if search is empty (common in some Electron packaged modes)
        const hash = window.location.hash;
        if (hash.includes('?')) {
            return new URLSearchParams(hash.split('?')[1]);
        }
        return searchParams;
    }, []);
    const type = params.get('type');
    const theme = useStore(state => state.theme);
    const isDark = theme === 'dark';
    const settings = useStore(state => state.settings);
    const { setWorkspaceRoot, closeGitDiffFile } = useStore();
    const [isPinned, setIsPinned] = useState(settings.windowAlwaysOnTop);
    const [dynamicTitle, setDynamicTitle] = useState<string | null>(() => {
        const payloadStr = params.get('payload');
        if (payloadStr) {
            try {
                const p = JSON.parse(payloadStr) as { filePath?: string };
                if (type === 'git-diff' && p?.filePath) {
                    const fileName = p.filePath.split(/[\\/]/).pop() ?? '';
                    return `GIT-DIFF: ${fileName}`;
                }
            } catch { /* ignore */ }
        }
        return null;
    });

    // Listen for title updates (Diff file changes)
    useEffect(() => {
        if (!window.electron?.on) return;
        const unsubscribe = window.electron.on('window-update-payload', (payload: unknown) => {
            const p = payload as { filePath?: string };
            if (p?.filePath) {
                const fileName = p.filePath.split(/[\\/]/).pop();
                setDynamicTitle(`GIT-DIFF: ${fileName}`);
            }
        });
        return () => unsubscribe();
    }, []);

    // Parse payload from URL
    const payload = useMemo(() => {
        const p = params.get('payload');
        if (p) {
            try {
                return JSON.parse(p) as { openedFolder?: string };
            } catch {
                return null;
            }
        }
        return null;
    }, [params]);

    // Initialize workspace if openedFolder is provided in payload
    useEffect(() => {
        if (payload?.openedFolder) {
            setWorkspaceRoot(payload.openedFolder);
        }
    }, [payload, setWorkspaceRoot]);

    // Add is-windowed class to html and inject Monaco transparency CSS
    useEffect(() => {
        document.documentElement.classList.add('is-windowed');
        document.body.classList.add('is-windowed');

        const styleId = 'monaco-transparency-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .monaco-diff-editor .monaco-editor,
                .monaco-diff-editor .monaco-editor .margin,
                .monaco-diff-editor .monaco-editor-background,
                .monaco-diff-editor .monaco-editor .inputarea.ime-input,
                .monaco-diff-editor .monaco-component,
                .monaco-diff-editor .monaco-scrollable-element,
                .monaco-diff-editor .margin-view-overlays,
                .monaco-diff-editor .monaco-editor .scroll-decoration,
                .monaco-diff-editor .decorationsOverviewRuler,
                .monaco-diff-editor .lines-content.monaco-editor-background {
                    background-color: transparent !important;
                    background: transparent !important;
                }
                .monaco-diff-editor .diffOverview {
                    background-color: rgba(255, 255, 255, 0.02) !important;
                }
                .monaco-diff-editor .editor-container {
                    background-color: transparent !important;
                }
                /* Target nested editors in diff view */
                .monaco-diff-editor .editor {
                    background-color: transparent !important;
                }
            `;
            document.head.appendChild(style);
        }

        return () => {
            document.documentElement.classList.remove('is-windowed');
            document.body.classList.remove('is-windowed');
            if (type === 'git-diff') {
                closeGitDiffFile();
            }
        };
    }, [type, closeGitDiffFile]);

    const handleTogglePin = async () => {
        if (window.electron?.windowToggleAlwaysOnTop) {
            const newState = await window.electron.windowToggleAlwaysOnTop();
            setIsPinned(newState);
        }
    };
    const windowTransparency = settings.windowTransparency ?? 0.85;
    const windowBackground = settings.windowBackground ?? (isDark ? '#0f172a' : '#f8fafc');

    const bgColor = useMemo(() => {
        try {
            return hexToRgba(windowBackground, windowTransparency);
        } catch {
            return isDark ? `rgba(15, 23, 42, ${windowTransparency})` : `rgba(248, 250, 252, ${windowTransparency})`;
        }
    }, [windowBackground, windowTransparency, isDark]);

    const renderContent = () => {
        switch (type) {
            case 'terminal':
                return <GitTerminalView />;
            case 'search':
                return <SearchPanel />;
            case 'git-diff': {
                const diffPayload = payload as { filePath?: string, openedFolder?: string };
                return <GitDiffEditor filePath={diffPayload?.filePath} openedFolder={diffPayload?.openedFolder} />;
            }
            case 'execution':
            default:
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        color: isDark ? '#888' : '#aaa',
                        fontSize: '1.2rem',
                        fontWeight: 500
                    }}>
                        Janela de Teste Vazia
                    </div>
                );
        }
    };

    return (
        <div style={{
            width: 'calc(100vw - 10px)',
            height: 'calc(100vh - 10px)',
            margin: '5px',
            background: bgColor,
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            backgroundClip: 'padding-box',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            boxShadow: isDark
                ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
                : 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
            isolation: 'isolate',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased'
        }}>
            {/* Custom Frameless Header */}
            <div style={{
                height: '32px',
                minHeight: '32px',
                background: isDark
                    ? 'linear-gradient(to right, rgba(30, 41, 59, 0.4), rgba(30, 30, 30, 0.4))'
                    : 'linear-gradient(to right, rgba(241, 245, 249, 0.4), rgba(243, 244, 246, 0.4))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                ...({ WebkitAppRegion: 'drag' } as React.CSSProperties),
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#94a3b8' : '#64748b' }}>
                    <Move size={14} />
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {dynamicTitle ?? `${type ?? 'Pop-out'} Window`}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={() => void handleTogglePin()}
                        title={isPinned ? "Desafixar janela" : "Fixar no topo"}
                        style={{
                            ...({ WebkitAppRegion: 'no-drag' } as React.CSSProperties),
                            background: isPinned ? (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)') : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isPinned ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#94a3b8' : '#64748b'),
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                    </button>

                    <button
                        onClick={() => window.electron?.windowClose()}
                        style={{
                            ...({ WebkitAppRegion: 'no-drag' } as React.CSSProperties),
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#94a3b8' : '#64748b',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div style={{
                flex: 1,
                overflow: 'hidden',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px'
            }}>
                {renderContent()}
            </div>
        </div>
    );
};
