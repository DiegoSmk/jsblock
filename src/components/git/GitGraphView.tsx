import React from 'react';
import { useStore } from '../../store/useStore';
import { ScrollArea } from '../ui/ScrollArea';
import { GitBranch, History, User, Calendar, Tag } from 'lucide-react';

export const GitGraphView: React.FC = () => {
    const { git, theme, checkoutCommit } = useStore();
    const isDark = theme === 'dark';

    const parseRefs = (refs: string) => {
        if (!refs) return [];
        // refs usually looks like "(HEAD -> main, origin/main, tag: v1.0)"
        return refs
            .replace(/[()]/g, '')
            .split(',')
            .map(r => r.trim())
            .map(r => {
                let type: 'branch' | 'remote' | 'tag' | 'head' = 'branch';
                let name = r;
                if (r.startsWith('HEAD ->')) {
                    type = 'head';
                    name = r.replace('HEAD ->', '').trim();
                } else if (r.startsWith('tag:')) {
                    type = 'tag';
                    name = r.replace('tag:', '').trim();
                } else if (r.includes('/')) {
                    type = 'remote';
                }
                return { type, name };
            });
    };

    const getRefColor = (type: string) => {
        switch (type) {
            case 'head': return isDark ? '#4fc3f7' : '#0070f3';
            case 'branch': return isDark ? '#10b981' : '#059669';
            case 'tag': return isDark ? '#fbbf24' : '#d97706';
            case 'remote': return isDark ? '#f472b6' : '#db2777';
            default: return isDark ? '#888' : '#666';
        }
    };

    const getGraphColor = (char: string) => {
        // Standard git log graph colors logic (simplified)
        switch (char) {
            case '*': return isDark ? '#fff' : '#000';
            case '|': return isDark ? '#333' : '#eee';
            case '/': return isDark ? '#4fc3f7' : '#0070f3';
            case '\\': return isDark ? '#f472b6' : '#db2777';
            default: return isDark ? '#555' : '#ccc';
        }
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: isDark ? '#1a1a1a' : '#fff'
        }} className="git-graph-view">
            <ScrollArea style={{ flex: 1 }}>
                <div style={{ padding: '20px', width: '100%' }}>
                    {git.log.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#444' : '#ccc' }}>
                            <History size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                            <p>Nenhum histórico disponível</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {git.log.map((entry, idx) => {
                                const refs = parseRefs((entry as any).refs || '');
                                const isCommit = entry.hash !== '';

                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'stretch',
                                            minHeight: '28px',
                                            cursor: isCommit ? 'pointer' : 'default',
                                            transition: 'background 0.1s',
                                            borderRadius: '4px',
                                            margin: '0 -4px'
                                        }}
                                        className="git-graph-row"
                                        onMouseEnter={(e) => {
                                            if (isCommit) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (isCommit) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        {/* Graph Visualization Column */}
                                        <div style={{
                                            width: '100px',
                                            fontFamily: 'monospace',
                                            fontSize: '14px',
                                            lineHeight: '28px',
                                            whiteSpace: 'pre',
                                            color: isDark ? '#555' : '#ccc',
                                            paddingLeft: '12px',
                                            position: 'relative',
                                            userSelect: 'none'
                                        }}>
                                            {(entry.graph || '').split('').map((char, cIdx) => (
                                                <span key={cIdx} style={{ color: getGraphColor(char) }}>{char}</span>
                                            ))}
                                        </div>

                                        {/* Commit Info Column */}
                                        {isCommit ? (
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '0 12px',
                                                minWidth: 0
                                            }}>
                                                {/* Hash */}
                                                <div style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.7rem',
                                                    color: isDark ? '#555' : '#999',
                                                    width: '55px',
                                                    flexShrink: 0
                                                }}>
                                                    {entry.hash.substring(0, 7)}
                                                </div>

                                                {/* Refs / Branches */}
                                                {refs.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                        {refs.map((ref, rIdx) => (
                                                            <div
                                                                key={rIdx}
                                                                style={{
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 700,
                                                                    padding: '1px 6px',
                                                                    borderRadius: '4px',
                                                                    background: `${getRefColor(ref.type)}22`,
                                                                    border: `1px solid ${getRefColor(ref.type)}44`,
                                                                    color: getRefColor(ref.type),
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}
                                                            >
                                                                {ref.type === 'tag' ? <Tag size={8} /> : <GitBranch size={8} />}
                                                                {ref.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Message */}
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    color: isDark ? '#ddd' : '#333',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    flex: 1
                                                }}>
                                                    {entry.message}
                                                </div>

                                                {/* Author & Date */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '0.7rem',
                                                    color: isDark ? '#555' : '#999',
                                                    flexShrink: 0,
                                                    marginLeft: 'auto'
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <User size={10} />
                                                        {entry.author.split('<')[0].trim()}
                                                    </span>
                                                    <span>•</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Calendar size={10} />
                                                        {new Date(entry.date).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {/* Simple Actions */}
                                                <div style={{ display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }} className="graph-actions">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); checkoutCommit(entry.hash); }}
                                                        style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: isDark ? '#888' : '#777' }}
                                                        title="Checkout"
                                                    >
                                                        <History size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ flex: 1 }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </ScrollArea>

        </div>
    );
};
