import React from 'react';
import { BarChart3 } from 'lucide-react';
import { COLOR_TOKENS } from '../../../../constants/design';

interface BenchmarkEmptyStateProps {
    isDark: boolean;
    neutralColor: string;
}

export const BenchmarkEmptyState: React.FC<BenchmarkEmptyStateProps> = ({ isDark, neutralColor }) => {
    return (
        <div style={{
            height: '220px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '32px',
            textAlign: 'center'
        }}>
            <div style={{
                position: 'relative',
                width: '64px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                marginBottom: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
            }}>
                <BarChart3 size={32} color={neutralColor} style={{ opacity: 0.3 }} />
                <div style={{
                    position: 'absolute',
                    inset: -8,
                    borderRadius: '20px',
                    border: `1px dashed ${neutralColor}`,
                    opacity: 0.15,
                    animation: 'pulseScale 3s ease-in-out infinite'
                }} />
                <style>{`
                    @keyframes pulseScale {
                        0%, 100% { transform: scale(1); opacity: 0.1; }
                        50% { transform: scale(1.1); opacity: 0.25; }
                    }
                `}</style>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: neutralColor
                }}>
                    Nenhuma análise registrada
                </span>
                <span style={{
                    fontSize: '11px',
                    color: neutralColor,
                    opacity: 0.8,
                    maxWidth: '220px',
                    lineHeight: 1.5
                }}>
                    Compare a performance do seu código usando <strong style={{ color: COLOR_TOKENS.cyan }}>//@benchmark</strong> acima de suas funções.
                </span>
            </div>
        </div>
    );
};
