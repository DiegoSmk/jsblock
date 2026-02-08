import React, { useMemo, useState, useEffect } from 'react';
import { GitTerminalView } from '../features/git/components/GitTerminalView';
import { SearchPanel } from '../features/workspace/components/SearchPanel';
import { useStore } from '../store/useStore';
import { X, Move, Pin, PinOff } from 'lucide-react';

export const WindowOutlet: React.FC = () => {
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const type = params.get('type');
    const theme = useStore(state => state.theme);
    const isDark = theme === 'dark';
    const settings = useStore(state => state.settings);
    const { setWorkspaceRoot } = useStore();
    const [isPinned, setIsPinned] = useState(settings.windowAlwaysOnTop); // Inicia com base na configuração default

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

    const handleTogglePin = async () => {
        if (window.electron?.windowToggleAlwaysOnTop) {
            const newState = await window.electron.windowToggleAlwaysOnTop();
            setIsPinned(newState);
        }
    };
    const windowTransparency = settings.windowTransparency ?? 0.85;
    const windowBackground = settings.windowBackground ?? (isDark ? '#0f172a' : '#f8fafc');

    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

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
            case 'execution':
                return <div style={{ padding: '20px', color: isDark ? '#fff' : '#000' }}>Painel de Execução Independente</div>;
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
            backgroundClip: 'padding-box', // Prevents background from bleeding under border
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
            backfaceVisibility: 'hidden', // Forces hardware-accelerated anti-aliasing
            WebkitFontSmoothing: 'antialiased'
        }}>
            {/* Custom Frameless Header */}
            <div style={{
                height: '32px',
                minHeight: '32px',
                background: isDark
                    ? 'linear-gradient(to right, #1e293b, #1e1e1e)'
                    : 'linear-gradient(to right, #f1f5f9, #f3f4f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                ...({ WebkitAppRegion: 'drag' } as any),
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#94a3b8' : '#64748b' }}>
                    <Move size={14} />
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {type || 'Pop-out'} Window
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={handleTogglePin}
                        title={isPinned ? "Desafixar janela" : "Fixar no topo"}
                        style={{
                            ...({ WebkitAppRegion: 'no-drag' } as any),
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
                        onClick={() => window.electron.windowClose()}
                        style={{
                            ...({ WebkitAppRegion: 'no-drag' } as any),
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
