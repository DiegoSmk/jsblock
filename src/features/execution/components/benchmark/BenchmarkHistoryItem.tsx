import React from 'react';
import { X, Zap } from 'lucide-react';
import type { BenchmarkRecord } from '../../types';

interface BenchmarkHistoryItemProps {
    record: BenchmarkRecord;
    isDark: boolean;
    isSelected: boolean;
    isCurrentFile: boolean;
    onClick: () => void;
    onRemove: () => void;
}

export const BenchmarkHistoryItem: React.FC<BenchmarkHistoryItemProps> = ({
    record,
    isDark,
    isCurrentFile,
    onClick,
    onRemove
}) => {
    const date = new Date(record.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fileName = record.filePath?.split(/[\\/]/).pop() ?? 'Untitled';
    const winner = record.results.find(r => r.isWinner);

    return (
        <div
            onClick={onClick}
            style={{
                padding: '10px 14px',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: isCurrentFile ? (isDark ? 'rgba(79, 195, 247, 0.05)' : 'rgba(7, 137, 203, 0.03)') : 'transparent'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                if (isCurrentFile) e.currentTarget.style.background = isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(7, 137, 203, 0.05)';
                const actions = e.currentTarget.querySelector('.benchmark-actions');
                if (actions instanceof HTMLElement) actions.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = isCurrentFile ? (isDark ? 'rgba(79, 195, 247, 0.05)' : 'rgba(7, 137, 203, 0.03)') : 'transparent';
                const actions = e.currentTarget.querySelector('.benchmark-actions');
                if (actions instanceof HTMLElement) actions.style.opacity = '0';
            }}
        >
            {/* Time & File Info */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                    fontSize: '10px',
                    color: isDark ? '#64748b' : '#94a3b8',
                    fontVariantNumeric: 'tabular-nums',
                    width: '42px'
                }}>
                    {timeStr}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: isCurrentFile ? 700 : 500,
                            color: isCurrentFile ? (isDark ? '#f8fafc' : '#1e293b') : (isDark ? '#cbd5e1' : '#475569'),
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {fileName}
                        </span>
                        <span style={{ fontSize: '10px', color: isDark ? '#475569' : '#94a3b8', opacity: 0.7 }}>
                            line {record.line}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {winner && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: isDark ? '#4ade80' : '#16a34a',
                        background: isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(74, 222, 128, 0.06)',
                        border: `1px solid ${isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(74, 222, 128, 0.2)'}`
                    }}>
                        <Zap size={10} fill="currentColor" />
                        <span>{winner.avgTime.toFixed(2)}ms</span>
                    </div>
                )}

                <div className="benchmark-actions" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: 0,
                    transition: 'opacity 0.2s ease'
                }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: isDark ? '#475569' : '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#475569' : '#94a3b8'}
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
