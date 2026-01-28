import React from 'react';
import { SectionHeader } from './SharedComponents';

interface GitHistoryProps {
    isDark: boolean;
    logs: any[];
    isOpen: boolean;
    onToggle: () => void;
}

export const CommitHistory: React.FC<GitHistoryProps> = ({
    isDark, logs, isOpen, onToggle
}) => (
    <>
        <SectionHeader
            title="Histórico de Commits"
            count={logs.length}
            isOpen={isOpen}
            onToggle={onToggle}
            isDark={isDark}
        />
        {isOpen && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                {logs.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: isDark ? '#555' : '#ccc', textAlign: 'center' }}>Sem histórico de commits</p>
                ) : (
                    logs.map((entry, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            gap: '16px',
                            fontSize: '0.75rem',
                            position: 'relative',
                            paddingBottom: '20px'
                        }}>
                            {i !== logs.length - 1 && (
                                <div style={{
                                    position: 'absolute',
                                    left: '7px',
                                    top: '16px',
                                    bottom: '0',
                                    width: '1px',
                                    background: isDark ? '#333' : '#eee'
                                }} />
                            )}
                            <div style={{
                                width: '15px',
                                height: '15px',
                                borderRadius: '50%',
                                background: isDark ? '#1a1a1a' : '#fff',
                                border: `2px solid ${isDark ? '#0070f3' : '#0070f3'}`,
                                zIndex: 2,
                                marginTop: '2px',
                                flexShrink: 0
                            }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{entry.message}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                                    <span style={{ fontFamily: 'monospace', background: isDark ? '#2d2d2d' : '#f0f0f0', padding: '1px 4px', borderRadius: '4px' }}>{entry.hash}</span>
                                    <span style={{ fontSize: '0.7rem' }}>• {entry.author}</span>
                                    <span style={{ fontSize: '0.7rem' }}>• {entry.date}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
    </>
);
