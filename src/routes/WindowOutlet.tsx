import React, { useMemo } from 'react';
import { GitTerminalView } from '../features/git/components/GitTerminalView';
import { SearchPanel } from '../features/workspace/components/SearchPanel';
import { useStore } from '../store/useStore';
import { X, Move } from 'lucide-react';

export const WindowOutlet: React.FC = () => {
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const type = params.get('type');
    const theme = useStore(state => state.theme);
    const isDark = theme === 'dark';

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
            width: '100vw',
            height: '100vh',
            background: isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(248, 250, 252, 0.45)',
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            isolation: 'isolate',
            WebkitMaskImage: 'linear-gradient(#000, #000)', // Technical trick to force clipping
            transform: 'translateZ(0)'
        }}>
            {/* Custom Frameless Header */}
            <div style={{
                height: '32px',
                minHeight: '32px',
                background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                ...({ WebkitAppRegion: 'drag' } as any),
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#94a3b8' : '#64748b' }}>
                    <Move size={14} />
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {type || 'Pop-out'} Window
                    </span>
                </div>

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
