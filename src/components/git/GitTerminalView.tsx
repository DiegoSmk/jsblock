import React from 'react';
import { useStore } from '../../store/useStore';
import { Terminal, ExternalLink } from 'lucide-react';

export const GitTerminalView: React.FC = () => {
    const { theme } = useStore();
    const isDark = theme === 'dark';

    const handleOpenTerminal = async () => {
        // checks if API exists
        if ((window as any).electronAPI?.openTerminal) {
            // await (window as any).electronAPI.openTerminal(openedFolder);
            alert("Em breve: Integração com Terminal do Sistema");
        } else {
            alert("Em breve: Integração com Terminal do Sistema");
        }
    };

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? '#1a1a1a' : '#fff',
            color: isDark ? '#aaa' : '#666',
            gap: '16px',
            height: '100%'
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#4fc3f7' : '#0070f3'
            }}>
                <Terminal size={32} />
            </div>

            <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: isDark ? '#e0e0e0' : '#333' }}>Terminal Integrado</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '300px' }}>
                    Execute comandos Git complexos diretamente.
                </p>
            </div>

            <button
                onClick={handleOpenTerminal}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: isDark ? '#2d2d2d' : '#f0f0f0',
                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                    borderRadius: '8px',
                    color: isDark ? '#e0e0e0' : '#333',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    marginTop: '16px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? '#3d3d3d' : '#e5e5e5';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? '#2d2d2d' : '#f0f0f0';
                }}
            >
                <ExternalLink size={16} />
                Abrir Terminal do Sistema
            </button>
        </div>
    );
};
