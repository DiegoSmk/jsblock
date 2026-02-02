import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from './SharedComponents';
import { Search, RefreshCw, ChevronRight } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { useStore } from '../../store/useStore';
import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

import type { GitLogEntry } from '../../types/store';

interface GitHistoryProps {
    isDark: boolean;
    logs: GitLogEntry[];
    isOpen: boolean;
    onToggle?: () => void;
    hideHeader?: boolean;
}

export const CommitHistory: React.FC<GitHistoryProps> = ({
    isDark, logs, isOpen, onToggle = () => { /* no-op */ }, hideHeader = false
}) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString();
        } catch {
            return dateStr;
        }
    };

    const filteredCommits = useMemo(() => {
        if (!searchTerm) return logs;
        const lowerSearch = searchTerm.toLowerCase();
        return logs.filter(commit =>
            (commit.message || '').toLowerCase().includes(lowerSearch) ||
            (commit.hash || '').toLowerCase().includes(lowerSearch) ||
            (commit.author || '').toLowerCase().includes(lowerSearch)
        );
    }, [logs, searchTerm]);

    const handleRowClick = (commit: GitLogEntry) => {
        // Use existing store action to open detail modal
        void useStore.getState().openCommitDetail(commit);
    };

    const OptimizedRow = ({ index, style }: RowComponentProps) => {
        const commit = filteredCommits[index];
        return (
            <div style={style}>
                <div
                    onClick={() => handleRowClick(commit)}
                    style={{
                        padding: '10px 16px',
                        borderBottom: `1px solid ${isDark ? '#252525' : '#f5f5f5'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        height: '100%',
                        boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#ddd' : '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {commit.message}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: isDark ? '#666' : '#999', display: 'flex', gap: '6px' }}>
                            <span>{commit.hash.substring(0, 7)}</span>
                            <span>•</span>
                            <span>{formatDate(commit.date)}</span>
                            <span>•</span>
                            <span>{commit.author.split('<')[0]}</span>
                        </div>
                    </div>
                    <ChevronRight size={14} color={isDark ? '#555' : '#ccc'} />
                </div>
            </div>
        );
    };

    return (
        <div
            className="animate-entrance"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: isDark ? '#1a1a1a' : '#fff',
                opacity: 0
            }}
        >
            {!hideHeader && (
                <SectionHeader
                    title={t('git.status.history_list')}
                    count={logs.length}
                    isOpen={isOpen}
                    onToggle={onToggle}
                    isDark={isDark}
                    rightElement={
                        <Tooltip content={t('git.status.history_refresh')} side="bottom">
                            <button
                                onClick={(e) => { e.stopPropagation(); void useStore.getState().refreshGit(); }}
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
                            >
                                <RefreshCw size={14} />
                            </button>
                        </Tooltip>
                    }
                />
            )}

            {isOpen && (
                <>
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}` }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: isDark ? '#555' : '#999' }} />
                            <input
                                type="text"
                                placeholder={t('git.status.history_filter_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px 6px 28px',
                                    borderRadius: '6px',
                                    border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                    background: isDark ? '#252525' : '#f9f9f9',
                                    color: isDark ? '#fff' : '#000',
                                    fontSize: '0.75rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <AutoSizer
                            renderProp={({ height, width }) => (
                                <List
                                    style={{ height, width }}
                                    rowCount={filteredCommits.length}
                                    rowHeight={50}
                                    rowComponent={OptimizedRow}
                                    rowProps={{}}
                                />
                            )}
                        />
                    </div>
                </>
            )}
        </div>
    );
};
