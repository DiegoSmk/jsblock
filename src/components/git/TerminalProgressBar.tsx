import React from 'react';

interface TerminalProgressBarProps {
    progress: number; // 0 to 100
    label?: string;
    isDark: boolean;
}

export const TerminalProgressBar: React.FC<TerminalProgressBarProps> = ({ progress, label, isDark }) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            padding: '12px 16px',
            background: isDark ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            borderTop: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.1)'}`,
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes progressShimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: isDark ? '#4fc3f7' : '#0070f3',

                    letterSpacing: '0.5px'
                }}>
                    {label ?? 'Processando...'}
                </span>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: isDark ? '#fff' : '#333',
                    fontFamily: 'monospace'
                }}>
                    {Math.round(progress)}%
                </span>
            </div>

            <div style={{
                height: '6px',
                background: isDark ? '#333' : '#eee',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${progress}%`,
                    background: isDark
                        ? 'linear-gradient(90deg, #4fc3f7, #60a5fa)'
                        : 'linear-gradient(90deg, #0070f3, #4fc3f7)',
                    borderRadius: '10px',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isDark ? '0 0 10px rgba(79, 195, 247, 0.5)' : 'none'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        animation: 'progressShimmer 2s infinite linear'
                    }} />
                </div>
            </div>
        </div>
    );
};
