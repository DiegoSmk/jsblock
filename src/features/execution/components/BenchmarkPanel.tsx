import React, { useState, useEffect } from 'react';
import { Zap, ChevronUp, ChevronDown, BarChart3, Trash2, Info } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { COLOR_TOKENS, LAYOUT_TOKENS } from '../../../constants/design';
import { BenchmarkOverlay } from './BenchmarkOverlay';
import type { BenchmarkRecord } from '../types';
import { ScrollArea } from '../../../components/ui/ScrollArea';
import { BenchmarkHelp } from './benchmark/BenchmarkHelp';
import { BenchmarkHistoryItem } from './benchmark/BenchmarkHistoryItem';
import { BenchmarkEmptyState } from './benchmark/BenchmarkEmptyState';

import './BenchmarkPanel.css';

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
        if (!isExpanded && benchmarkHistory.length > 0) {
            setTimeout(() => setHasUnread(true), 0);
        } else if (isExpanded) {
            setTimeout(() => setHasUnread(false), 0);
        }
    }, [benchmarkHistory.length, isExpanded]);

    // Auto-open modal when a benchmark finishes
    useEffect(() => {
        if (!isBenchmarking && benchmarkHistory.length > 0) {
            // Find the most recent record (within the last 2 seconds to avoid popping up on load)
            const newest = benchmarkHistory[0];
            const now = Date.now();
            if (now - newest.timestamp < 2000) {
                setTimeout(() => setSelectedRecord(newest), 0);
            }
        }
    }, [isBenchmarking, benchmarkHistory]);

    const tokens = isDark ? COLOR_TOKENS.dark : COLOR_TOKENS.light;
    const neutralColor = tokens.subtext;

    return (
        <div className="benchmark-panel-container" style={{
            background: tokens.bg,
            borderTop: `1px solid ${tokens.border}`,
            maxHeight: isExpanded ? '300px' : '32px',
            height: isExpanded ? '300px' : '32px',
            overflow: isExpanded ? 'hidden' : 'visible'
        }}>
            {showHelp && <BenchmarkHelp isExpanded={isExpanded} isDark={isDark} onClose={() => setShowHelp(false)} />}
            {showHelp && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 2999 }}
                    onClick={() => setShowHelp(false)}
                />
            )}

            {/* Header / Toggle Bar */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="benchmark-header-toggle"
                style={{
                    padding: `0 ${LAYOUT_TOKENS.padding.lg}`,
                    background: tokens.hover,
                }}
            >
                <div className="benchmark-header-left">
                    <BarChart3 size={14} color={isDark ? '#666' : '#999'} />
                    <span className="benchmark-title" style={{
                        color: isDark ? '#888' : '#666',
                    }}>
                        Benchmarks
                    </span>
                    {hasUnread && !isExpanded && (
                        <div className="unread-signal" />
                    )}
                    {isBenchmarking && (
                        <div className="benchmarking-signal" style={{
                            background: isDark ? 'rgba(250, 204, 21, 0.1)' : 'rgba(250, 204, 21, 0.05)',
                            border: `1px solid ${isDark ? 'rgba(250, 204, 21, 0.2)' : 'rgba(250, 204, 21, 0.1)'}`,
                        }}>
                            <Zap size={10} className="animate-pulse" color="#facc15" fill="#facc15" />
                        </div>
                    )}
                </div>

                <div className="benchmark-header-right">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowHelp(!showHelp);
                        }}
                        title="Como usar"
                        className="benchmark-help-btn"
                        style={{
                            color: showHelp ? COLOR_TOKENS.cyan : (isDark ? '#666' : '#999'),
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
                            className="clear-history-btn"
                            style={{
                                color: isDark ? '#555' : '#aaa',
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
                            <BenchmarkEmptyState isDark={isDark} neutralColor={neutralColor} />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {benchmarkHistory.map(record => (
                                    <BenchmarkHistoryItem
                                        key={record.id}
                                        record={record}
                                        isDark={isDark}
                                        isSelected={selectedRecord?.id === record.id}
                                        isCurrentFile={record.filePath === selectedFile}
                                        onClick={() => setSelectedRecord(record)}
                                        onRemove={() => removeBenchmarkRecord(record.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div >

            {/* Details Modal (Overlaying the App) */}
            {
                selectedRecord && (
                    <div
                        onClick={() => setSelectedRecord(null)}
                        className="benchmark-modal-overlay"
                    >
                        <div onClick={(e) => e.stopPropagation()} className="benchmark-modal-container">
                            <BenchmarkOverlay
                                results={selectedRecord.results}
                                onClose={() => setSelectedRecord(null)}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
};
