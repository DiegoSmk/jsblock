import React, { useState, useEffect } from 'react';
import { X, Zap, ChevronUp, ChevronDown, BarChart3, Trash2, Info } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { DESIGN_TOKENS } from '../../../constants/design';
import { BenchmarkOverlay } from './BenchmarkOverlay';
import type { BenchmarkRecord } from '../types';
import { ScrollArea } from '../../../components/ui/ScrollArea';

export const BenchmarkPanel: React.FC = () => {
    const {
        benchmarkHistory,
        clearBenchmarkHistory,
        removeBenchmarkRecord,
        theme,
        selectedFile,
        isBenchmarking,
        setConfirmationModal
    } = useStore(useShallow(state => ({
        benchmarkHistory: state.benchmarkHistory,
        clearBenchmarkHistory: state.clearBenchmarkHistory,
        removeBenchmarkRecord: state.removeBenchmarkRecord,
        theme: state.theme,
        selectedFile: state.selectedFile,
        isBenchmarking: state.isBenchmarking,
        setConfirmationModal: state.setConfirmationModal
    })));

    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<BenchmarkRecord | null>(null);
    const [hasUnread, setHasUnread] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const isDark = theme === 'dark';

    // Show signal when new benchmark arrives and panel is collapsed
    useEffect(() => {
        if (benchmarkHistory.length > 0 && !isExpanded) {
            setHasUnread(true);
        }
    }, [benchmarkHistory.length]);

    // Clear signal when expanded
    useEffect(() => {
        if (isExpanded) {
            setHasUnread(false);
        }
    }, [isExpanded]);

    // Auto-open modal when a benchmark finishes
    useEffect(() => {
        if (!isBenchmarking && benchmarkHistory.length > 0) {
            // Find the most recent record (within the last 2 seconds to avoid popping up on load)
            const newest = benchmarkHistory[0];
            const now = Date.now();
            if (now - newest.timestamp < 2000) {
                setSelectedRecord(newest);
                // Panel remains in its current state as requested
            }
        }
    }, [isBenchmarking, benchmarkHistory.length]);

    const panelBg = isDark ? '#1a1a1a' : '#fff';
    const borderColor = isDark ? '#2d2d2d' : '#e5e7eb';
    const headerBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
    const neutralColor = isDark ? '#888' : '#666'; // Matches the "Benchmarks" header label

    const renderHelpContent = () => {
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

                {/* Header matching BenchmarkOverlay */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Info size={18} color={DESIGN_TOKENS.COLORS.ACCENT.DARK} />
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
                        onClick={() => setShowHelp(false)}
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

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: panelBg,
            borderTop: `1px solid ${borderColor}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            maxHeight: isExpanded ? '300px' : '32px',
            height: isExpanded ? '300px' : '32px',
            width: '100%',
            zIndex: 100,
            flexShrink: 0,
            position: 'relative',
            overflow: isExpanded ? 'hidden' : 'visible'
        }}>
            {showHelp && renderHelpContent()}
            {showHelp && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 2999 }}
                    onClick={() => setShowHelp(false)}
                />
            )}

            {/* Header / Toggle Bar */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    height: '32px',
                    minHeight: '32px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: headerBg,
                    cursor: 'pointer',
                    userSelect: 'none',
                    position: 'relative',
                    zIndex: 2001
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
                    <BarChart3 size={14} color={isDark ? '#666' : '#999'} />
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: isDark ? '#888' : '#666',
                        lineHeight: '14px', // Standardize with icon height
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        Benchmarks
                    </span>
                    {hasUnread && !isExpanded && (
                        <div style={{
                            width: '14px',
                            height: '14px',
                            background: DESIGN_TOKENS.COLORS.ACCENT.DARK,
                            borderRadius: '3px',
                            boxShadow: `0 0 8px ${DESIGN_TOKENS.COLORS.ACCENT.DARK}44`
                        }} />
                    )}
                    {isBenchmarking && (
                        <div style={{
                            width: '14px',
                            height: '14px',
                            background: isDark ? 'rgba(250, 204, 21, 0.1)' : 'rgba(250, 204, 21, 0.05)',
                            borderRadius: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${isDark ? 'rgba(250, 204, 21, 0.2)' : 'rgba(250, 204, 21, 0.1)'}`,
                        }}>
                            <Zap size={10} className="animate-pulse" color="#facc15" fill="#facc15" />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowHelp(!showHelp);
                        }}
                        title="Como usar"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: showHelp ? DESIGN_TOKENS.COLORS.ACCENT.DARK : (isDark ? '#666' : '#999'),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => {
                            if (!showHelp) e.currentTarget.style.color = isDark ? '#aaa' : '#666';
                            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
                        }}
                        onMouseLeave={(e) => {
                            if (!showHelp) e.currentTarget.style.color = isDark ? '#666' : '#999';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <Info size={14} />
                        Como usar
                    </button>
                    {isExpanded && benchmarkHistory.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmationModal({
                                    isOpen: true,
                                    title: 'Limpar Histórico',
                                    message: 'Tem certeza que deseja apagar todos os registros de performance? Esta ação não pode ser desfeita.',
                                    confirmLabel: 'Limpar Tudo',
                                    cancelLabel: 'Cancelar',
                                    variant: 'danger',
                                    onConfirm: () => {
                                        clearBenchmarkHistory();
                                        setConfirmationModal(null);
                                    },
                                    onCancel: () => setConfirmationModal(null)
                                });
                            }}
                            title="Limpar histórico"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: isDark ? '#555' : '#aaa',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#555' : '#aaa'}
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                    <div style={{ color: isDark ? '#444' : '#ccc', display: 'flex' }}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <ScrollArea visibility="hover">
                    <div style={{ paddingBottom: '20px' }}>
                        {benchmarkHistory.length === 0 ? (
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
                                        Compare a performance do seu código usando <strong style={{ color: DESIGN_TOKENS.COLORS.ACCENT.DARK }}>//@benchmark</strong> acima de suas funções.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {benchmarkHistory.map(record => {
                                    const date = new Date(record.timestamp);
                                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const fileName = record.filePath?.split(/[\\/]/).pop() || 'Untitled';
                                    const isCurrentFile = record.filePath === selectedFile;
                                    const winner = record.results.find(r => r.isWinner);

                                    return (
                                        <div
                                            key={record.id}
                                            onClick={() => setSelectedRecord(record)}
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
                                                const actions = e.currentTarget.querySelector('.benchmark-actions') as HTMLElement;
                                                if (actions) actions.style.opacity = '1';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = isCurrentFile ? (isDark ? 'rgba(79, 195, 247, 0.05)' : 'rgba(7, 137, 203, 0.03)') : 'transparent';
                                                const actions = e.currentTarget.querySelector('.benchmark-actions') as HTMLElement;
                                                if (actions) actions.style.opacity = '0';
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
                                                            removeBenchmarkRecord(record.id);
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
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Details Modal (Overlaying the App) */}
            {selectedRecord && (
                <div
                    onClick={() => setSelectedRecord(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '20px'
                    }}
                >
                    <div onClick={(e) => e.stopPropagation()} style={{ animation: 'modalAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        <style>{`
                            @keyframes modalAppear {
                                from { transform: scale(0.9); opacity: 0; }
                                to { transform: scale(1); opacity: 1; }
                            }
                        `}</style>
                        <BenchmarkOverlay
                            results={selectedRecord.results}
                            onClose={() => setSelectedRecord(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
