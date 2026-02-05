import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../components/../../store/useStore';
import type { GitLogEntry } from '../../../components/../../types/store';
import { ScrollArea } from '../../../components/ui/ScrollArea';
import { GitBranch, History, Tag, RefreshCw } from 'lucide-react';
import { SectionHeader } from './SharedComponents';

const LANE_COLORS_DARK = ['#60a5fa', '#f472b6', '#2dd4bf', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee', '#fb923c'];
const LANE_COLORS_LIGHT = ['#2563eb', '#db2777', '#0d9488', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#ea580c'];

const parseRefs = (refs: string) => {
    if (!refs) return [];
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

const getRefColor = (type: string, isDark: boolean) => {
    switch (type) {
        case 'head': return isDark ? '#3b82f6' : '#2563eb';
        case 'branch': return isDark ? '#ec4899' : '#db2777';
        case 'remote': return isDark ? '#14b8a6' : '#0d9488';
        case 'tag': return isDark ? '#f59e0b' : '#d97706';
        default: return isDark ? '#888' : '#666';
    }
};

const renderGraphRow = (graph: string, isDark: boolean) => {
    const charWidth = 16; // Increased width for better spacing
    const rowHeight = 32;
    const nodeRadius = 5; // Radius for the main circle
    const haloRadius = 9; // Radius for the halo
    const centerX = charWidth / 2;
    const centerY = rowHeight / 2;
    const laneColors = isDark ? LANE_COLORS_DARK : LANE_COLORS_LIGHT;

    return (
        <svg width={charWidth * Math.max(graph.length, 2) + 20} height={rowHeight} style={{ overflow: 'visible' }}>
            {graph.split('').map((char, cIdx) => {
                const x = cIdx * charWidth + centerX;
                const color = laneColors[cIdx % laneColors.length];
                const nextColor = laneColors[(cIdx + 1) % laneColors.length];

                const elements = [];

                // Vertical lines
                if (char === '|' || char === '*') {
                    elements.push(
                        <line
                            // eslint-disable-next-line react/no-array-index-key
                            key={`v-${cIdx}`}
                            x1={x} y1={0} x2={x} y2={rowHeight}
                            stroke={color} strokeWidth="2.5" strokeLinecap="round"
                            opacity={char === '|' ? 0.5 : 1}
                        />
                    );
                }

                // Branching paths (Fork: /)
                // Moves from right (top) to left (bottom) effectively in this text-graph mapping
                // Actually ' / ' usually means from (bottom-left) to (top-right) or similar depending on tool.
                // In git log --graph:
                // * |   commit
                // |\ \  merge
                // | \ \
                //
                // The character mapping needs to be precise.
                // / : connects (x+1, top) to (x, bottom) or vice versa?
                // Typically in git log graph:
                // \ : (x, top) -> (x+1, bottom) -- fork/split to right
                // / : (x+1, top) -> (x, bottom) -- merge from right

                if (char === '/') {
                    elements.push(
                        <path
                            // eslint-disable-next-line react/no-array-index-key
                            key={`d-f-${cIdx}`}
                            d={`M ${x + charWidth} 0 C ${x + charWidth} ${centerY}, ${x} ${centerY}, ${x} ${rowHeight}`}
                            fill="none" stroke={nextColor}
                            strokeWidth="2.5" strokeLinecap="round" opacity="0.6"
                        />
                    );
                }

                if (char === '\\') {
                    elements.push(
                        <path
                            // eslint-disable-next-line react/no-array-index-key
                            key={`d-b-${cIdx}`}
                            d={`M ${x} 0 C ${x} ${centerY}, ${x + charWidth} ${centerY}, ${x + charWidth} ${rowHeight}`}
                            fill="none" stroke={color}
                            strokeWidth="2.5" strokeLinecap="round" opacity="0.6"
                        />
                    );
                }

                // Node (Commit)
                if (char === '*') {
                    elements.push(
                        <circle
                            // eslint-disable-next-line react/no-array-index-key
                            key={`n-halo-${cIdx}`}
                            cx={x} cy={centerY}
                            r={haloRadius}
                            fill={color} opacity="0.25"
                        />
                    );
                    elements.push(
                        <circle
                            // eslint-disable-next-line react/no-array-index-key
                            key={`n-${cIdx}`}
                            cx={x} cy={centerY}
                            r={nodeRadius}
                            fill={isDark ? '#1a1a1a' : '#fff'}
                            stroke={color} strokeWidth="2.5"
                        />
                    );
                }

                // Fix for the underscore/horizontal bar if present in some git graphs (less common but possible)
                if (char === '_') {
                    elements.push(
                        <line
                            // eslint-disable-next-line react/no-array-index-key
                            key={`h-${cIdx}`}
                            x1={x} y1={rowHeight} x2={x + charWidth} y2={rowHeight}
                            stroke={color} strokeWidth="2.5" strokeLinecap="round"
                        />
                    );
                }

                return elements;
            })}
        </svg>
    );
};

export const GitGraphView: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
    const { git, theme, openCommitDetail, refreshGit } = useStore();
    const { t, i18n } = useTranslation();
    const isDark = theme === 'dark';

    return (
        <div
            className="git-graph-view animate-entrance"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: isDark ? '#1a1a1a' : '#fff',
                opacity: 0
            }}
        >
            {!hideHeader && (
                <div className="animate-entrance" style={{ animationDelay: '0.05s', opacity: 0 }}>
                    <SectionHeader
                        title={t('git.graph.title')}
                        count={git.log.filter((l: GitLogEntry) => l.hash !== '').length}
                        isDark={isDark}
                        rightElement={
                            <button
                                onClick={(e) => { e.stopPropagation(); void refreshGit(); }}
                                title={t('git.common.refresh')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    color: isDark ? '#888' : '#777',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <RefreshCw size={14} />
                            </button>
                        }
                    />
                </div>
            )}

            <div className="animate-entrance" style={{ animationDelay: '0.1s', opacity: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ScrollArea style={{ flex: 1 }}>
                    <div style={{ padding: '8px 4px', width: '100%' }}>
                        {git.log.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#444' : '#ccc' }}>
                                <History size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                <p>{t('git.graph.no_commits')}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {git.log.map((entry: GitLogEntry, idx: number) => {
                                    const refs = parseRefs(entry.refs ?? '');
                                    const isCommit = entry.hash !== '';
                                    const tooltipText = isCommit ? `${entry.author} • ${new Date(entry.date).toLocaleString(i18n.language)}\n${entry.hash}` : '';

                                    return (
                                        <div
                                            key={entry.hash || idx}
                                            title={tooltipText}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'stretch',
                                                height: '32px',
                                                cursor: isCommit ? 'pointer' : 'default',
                                                transition: 'background 0.1s',
                                                borderRadius: '4px'
                                            }}
                                            className="git-graph-row"
                                            onMouseEnter={(e) => {
                                                if (isCommit) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (isCommit) e.currentTarget.style.background = 'transparent';
                                            }}
                                            onClick={() => isCommit && void openCommitDetail(entry)}
                                        >
                                            {/* Graph Column */}
                                            <div style={{
                                                width: '65px',
                                                flexShrink: 0,
                                                paddingLeft: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                overflow: 'visible'
                                            }}>
                                                {renderGraphRow(entry.graph ?? '', isDark)}
                                            </div>

                                            {/* Commit Info Column */}
                                            {isCommit ? (
                                                <div style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '0 4px',
                                                    minWidth: 0,
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.7rem',
                                                        color: isDark ? '#888' : '#666',
                                                        width: '55px',
                                                        flexShrink: 0
                                                    }}>
                                                        {entry.hash.substring(0, 7)}
                                                    </div>

                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        color: isDark ? '#eee' : '#111',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        flex: 1,
                                                        minWidth: 0
                                                    }}>
                                                        {entry.message}
                                                    </div>

                                                    <div style={{
                                                        fontSize: '0.7rem',
                                                        color: isDark ? '#666' : '#888',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        opacity: 0.7,
                                                        paddingRight: '4px'
                                                    }}>
                                                        {entry.author ? (entry.author.split('<')[0].trim() || t('git.common.unknown_author')) : '...'}
                                                    </div>

                                                    {refs.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                            {refs.map((ref) => (
                                                                <div
                                                                    key={ref.name}
                                                                    style={{
                                                                        fontSize: '0.6rem',
                                                                        fontWeight: 700,
                                                                        padding: '1px 6px',
                                                                        borderRadius: '4px',
                                                                        background: ref.type === 'head'
                                                                            ? (isDark ? '#3b82f622' : '#2563eb11')
                                                                            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                                                                        border: `1px solid ${getRefColor(ref.type, isDark)}55`,
                                                                        color: getRefColor(ref.type, isDark),
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '2px'
                                                                    }}
                                                                >
                                                                    {ref.type === 'tag' ? <Tag size={8} /> : <GitBranch size={8} />}
                                                                    {ref.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
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
        </div>
    );
};
