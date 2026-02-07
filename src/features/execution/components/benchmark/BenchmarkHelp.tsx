import React from 'react';
import { X, Info } from 'lucide-react';
import { COLOR_TOKENS } from '../../../../constants/design';

interface BenchmarkHelpProps {
    isExpanded: boolean;
    isDark: boolean;
    onClose: () => void;
}

export const BenchmarkHelp: React.FC<BenchmarkHelpProps> = ({ isExpanded, isDark, onClose }) => {
    const popupWidth = 280;

    return (
        <div style={{
            position: 'absolute',
            bottom: isExpanded ? 'auto' : '36px',
            top: isExpanded ? '36px' : 'auto',
            right: '8px',
            width: `${popupWidth}px`,
            padding: '16px',
            background: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 3000,
            animation: isExpanded ? 'fadeInDown 0.2s ease-out' : 'fadeInUp 0.2s ease-out'
        }}>
            <style>{`
                @keyframes fadeInDown {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeInUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={18} color={COLOR_TOKENS.cyan} />
                    <h3 style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        color: isDark ? '#f8fafc' : '#1e293b'
                    }}>
                        Guia de Uso
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <X size={16} />
                </button>
            </div>

            <p style={{ fontSize: '11px', margin: '0 0 10px 0', lineHeight: 1.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                Para testar a performance do código em diferentes runtimes (Node, Bun, Deno), adicione um comentário acima de uma função:
            </p>
            <div style={{
                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                padding: '10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: isDark ? '#4ade80' : '#16a34a',
                marginBottom: '10px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                lineHeight: 1.6
            }}>
                //@benchmark<br />
                //@bench<br />
                //@performance
            </div>
            <p style={{ fontSize: '11px', margin: 0, lineHeight: 1.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                Um ícone de <strong>Play</strong> aparecerá no editor. Clique nele para rodar a análise.
            </p>
        </div>
    );
};
