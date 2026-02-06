import { X, Trophy, Zap, Clock, Info } from 'lucide-react';
import type { BenchmarkResult } from '../types';

interface BenchmarkOverlayProps {
    results: BenchmarkResult[];
    onClose: () => void;
}

import { useStore } from '../../../store/useStore';

export function BenchmarkOverlay({ results, onClose }: BenchmarkOverlayProps) {
    const theme = useStore(state => state.theme);
    const isDark = theme === 'dark';

    if (!results || results.length === 0) return null;

    const sortedResults = [...results].sort((a, b) => a.avgTime - b.avgTime);
    const maxTime = Math.max(...results.map(r => r.avgTime));

    return (
        <div className="benchmark-results-overlay" style={{
            background: isDark ? 'rgba(23, 25, 28, 0.97)' : 'rgba(250, 252, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            width: '400px',
            padding: '20px',
            borderRadius: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
                    }}>
                        <Zap size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em', color: isDark ? '#f8fafc' : '#1e293b' }}>
                        Análise de Performance
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <X size={16} />
                </button>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '4px'
            }}>
                {sortedResults.map((res) => {
                    const percentage = (res.avgTime / maxTime) * 100;
                    const isWinner = res.isWinner;

                    return (
                        <div key={res.runtime} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isWinner ? (
                                        <Trophy size={14} color="#facc15" />
                                    ) : (
                                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }} />
                                    )}
                                    <span style={{ fontWeight: 600, color: isWinner ? (isDark ? '#f8fafc' : '#1e293b') : (isDark ? '#94a3b8' : '#64748b') }}>
                                        {res.runtime.charAt(0).toUpperCase() + res.runtime.slice(1)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isWinner ? '#4ade80' : (isDark ? '#f8fafc' : '#1e293b'), fontWeight: 600 }}>
                                    <Clock size={12} />
                                    <span>{res.avgTime.toFixed(2)}ms</span>
                                </div>
                            </div>

                            <div className="benchmark-bar-container">
                                <div
                                    className="benchmark-bar-fill"
                                    style={{
                                        width: `${percentage}%`,
                                        background: isWinner
                                            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                            : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                                        boxShadow: isWinner ? '0 0 10px rgba(74, 222, 128, 0.3)' : 'none'
                                    }}
                                />
                            </div>

                            {res.avgTime === 0 && res.output && (
                                <div style={{
                                    fontSize: '10px',
                                    color: '#ef4444',
                                    padding: '4px 8px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                    marginTop: '2px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    {res.output}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{
                marginTop: '16px',
                padding: '8px',
                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11px',
                color: isDark ? '#94a3b8' : '#64748b',
                lineHeight: 1.4
            }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                    Execution time includes process spawning overhead. Results provide a relative comparison of runtime performance for this specific snippet.
                </span>
            </div>
        </div>
    );
}
