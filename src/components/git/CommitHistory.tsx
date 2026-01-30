import React, { useState, useMemo } from 'react';
import { SectionHeader } from './SharedComponents';
import { Search, Copy, ChevronRight, ChevronDown, GitBranch, History } from 'lucide-react';
import { ScrollArea } from '../ui/ScrollArea';
import { useStore } from '../../store/useStore';

interface GitHistoryProps {
    isDark: boolean;
    logs: any[];
    isOpen: boolean;
    onToggle: () => void;
    hideToggle?: boolean;
}

export const CommitHistory: React.FC<GitHistoryProps> = ({
    isDark, logs, isOpen, onToggle, hideToggle = false
}) => {
    const { getCommitFiles, openModal, checkoutCommit, createBranch } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
    const [commitFiles, setCommitFiles] = useState<Record<string, { path: string, status: string }[]>>({});
    const [showHeatmap, setShowHeatmap] = useState(true);

    const formatDate = (dateStr: string, detailed = false) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return detailed ? date.toLocaleString() : date.toLocaleDateString();
        } catch (e) {
            return dateStr;
        }
    };

    const getFileStatusColor = (status: string) => {
        if (!status) return isDark ? '#888' : '#666';
        switch (status[0]) {
            case 'A': return isDark ? '#10b981' : '#059669'; // Added
            case 'M': return isDark ? '#3b82f6' : '#2563eb'; // Modified
            case 'D': return isDark ? '#ef4444' : '#dc2626'; // Deleted
            case 'R': return isDark ? '#f59e0b' : '#d97706'; // Renamed
            default: return isDark ? '#888' : '#666';
        }
    };

    const toggleCommit = async (hash: string) => {
        const newExpanded = new Set(expandedCommits);
        if (newExpanded.has(hash)) {
            newExpanded.delete(hash);
        } else {
            newExpanded.add(hash);
            if (!commitFiles[hash]) {
                const files = await getCommitFiles(hash);
                setCommitFiles(prev => ({ ...prev, [hash]: files }));
            }
        }
        setExpandedCommits(newExpanded);
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

    const heatmapData = useMemo(() => {
        const data: Record<string, number> = {};
        logs.forEach(commit => {
            try {
                const date = new Date(commit.date);
                if (isNaN(date.getTime())) return;
                const key = date.toISOString().split('T')[0];
                data[key] = (data[key] || 0) + 1;
            } catch (e) { }
        });
        return data;
    }, [logs]);

    const renderHeatmap = () => {
        const weeks = [];
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - (15 * 7));

        while (startDate.getDay() !== 0) {
            startDate.setDate(startDate.getDate() - 1);
        }

        let currentDate = new Date(startDate);
        while (currentDate <= today) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                const dayKey = currentDate.toISOString().split('T')[0];
                const count = heatmapData[dayKey] || 0;
                week.push({ date: dayKey, count });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeks.push(week);
        }

        const getGithubColor = (count: number) => {
            if (count === 0) return isDark ? '#2d2d2d' : '#ebedf0';
            if (count <= 2) return isDark ? '#0e4429' : '#9be9a8';
            if (count <= 5) return isDark ? '#006d32' : '#40c463';
            if (count <= 10) return isDark ? '#26a641' : '#30a14e';
            return isDark ? '#39d353' : '#216e39';
        };

        return (
            <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', padding: '10px 0' }} className="no-scrollbar">
                {weeks.map((week, wIndex) => (
                    <div key={wIndex} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {week.map((day) => (
                            <div
                                key={day.date}
                                title={`${day.date}: ${day.count} commits`}
                                style={{
                                    width: '9px',
                                    height: '9px',
                                    borderRadius: '1px',
                                    backgroundColor: getGithubColor(day.count),
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: isDark ? '#1a1a1a' : '#fff' }}>
            {!hideToggle ? (
                <SectionHeader
                    title="Histórico de Commits"
                    count={logs.length}
                    isOpen={isOpen}
                    onToggle={onToggle}
                    isDark={isDark}
                />
            ) : (
                <div style={{
                    padding: '12px 16px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: isDark ? '#666' : '#999',
                    borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                    background: isDark ? '#1a1a1a' : '#fafafa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    <span>HISTÓRICO</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{logs.length}</span>
                </div>
            )}

            {isOpen && (
                <>
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}` }}>
                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: isDark ? '#555' : '#999' }} />
                            <input
                                type="text"
                                placeholder="Filtrar commits..."
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

                        {!searchTerm && (
                            <div style={{ marginTop: '8px' }}>
                                <div
                                    onClick={() => setShowHeatmap(!showHeatmap)}
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        color: isDark ? '#555' : '#999',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        marginBottom: showHeatmap ? '4px' : '0'
                                    }}
                                >
                                    {showHeatmap ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                    ATIVIDADE RECENTE
                                </div>
                                {showHeatmap && renderHeatmap()}
                            </div>
                        )}
                    </div>

                    <ScrollArea style={{ flex: 1 }}>
                        <div style={{ padding: '0' }}>
                            {filteredCommits.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: isDark ? '#444' : '#ccc', fontSize: '0.75rem' }}>
                                    Nenhum commit encontrado
                                </div>
                            ) : (
                                filteredCommits.map((commit, i) => (
                                    <div
                                        key={commit.hash}
                                        style={{
                                            borderBottom: `1px solid ${isDark ? '#252525' : '#f5f5f5'}`,
                                            padding: '10px 16px',
                                            cursor: 'pointer',
                                            background: expandedCommits.has(commit.hash) ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : 'transparent',
                                            transition: 'background 0.2s',
                                            position: 'relative'
                                        }}
                                        onClick={() => toggleCommit(commit.hash)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <div style={{ marginTop: '4px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '50%',
                                                    background: isDark ? '#1a1a1a' : '#fff',
                                                    border: `2px solid ${isDark ? '#0070f3' : '#0070f3'}`,
                                                    zIndex: 2,
                                                    flexShrink: 0
                                                }} />
                                                {i !== filteredCommits.length - 1 && (
                                                    <div style={{
                                                        width: '1px',
                                                        height: '40px',
                                                        background: isDark ? '#333' : '#eee',
                                                        position: 'absolute',
                                                        top: '10px',
                                                        zIndex: 1
                                                    }} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    color: isDark ? '#ddd' : '#333',
                                                    marginBottom: '2px',
                                                    whiteSpace: expandedCommits.has(commit.hash) ? 'normal' : 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {commit.message}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: isDark ? '#666' : '#999' }}>
                                                    <span style={{ fontWeight: 500 }}>{(commit.author || 'Desconhecido').split('<')[0].trim()}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(commit.date)}</span>
                                                </div>
                                            </div>
                                            <div style={{ color: isDark ? '#333' : '#ccc' }}>
                                                {expandedCommits.has(commit.hash) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                        </div>

                                        {expandedCommits.has(commit.hash) && (
                                            <div style={{
                                                marginTop: '8px',
                                                paddingLeft: '20px',
                                                fontSize: '0.7rem',
                                                color: isDark ? '#888' : '#666',
                                                borderLeft: `1px solid ${isDark ? '#333' : '#eee'}`,
                                                marginLeft: '4px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <strong>Hash:</strong>
                                                    <span style={{ fontFamily: 'monospace' }}>{commit.hash}</span>
                                                    <Copy
                                                        size={10}
                                                        style={{ cursor: 'pointer', marginLeft: '4px', opacity: 0.6 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(commit.hash);
                                                        }}
                                                    />
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            checkoutCommit(commit.hash);
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px',
                                                            padding: '4px',
                                                            fontSize: '0.65rem',
                                                            background: isDark ? '#2d2d2d' : '#f0f0f0',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            color: isDark ? '#ccc' : '#666',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Viajar no tempo (Detached HEAD)"
                                                    >
                                                        <History size={10} />
                                                        Checkout
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openModal({
                                                                title: 'Criar Branch',
                                                                type: 'text',
                                                                initialValue: '',
                                                                placeholder: 'Nome do novo branch',
                                                                confirmLabel: 'Criar',
                                                                onSubmit: (name) => {
                                                                    if (name) createBranch(name, commit.hash);
                                                                }
                                                            });
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px',
                                                            padding: '4px',
                                                            fontSize: '0.65rem',
                                                            background: isDark ? '#2d2d2d' : '#f0f0f0',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            color: isDark ? '#ccc' : '#666',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Criar novo branch a partir deste commit"
                                                    >
                                                        <GitBranch size={10} />
                                                        Branch
                                                    </button>
                                                </div>

                                                {commitFiles[commit.hash] && (
                                                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: isDark ? '#444' : '#999', marginBottom: '2px', textTransform: 'uppercase' }}>Arquivos</div>
                                                        {commitFiles[commit.hash].map((file: any, idx: number) => (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem' }}>
                                                                <span style={{
                                                                    color: getFileStatusColor(file.status),
                                                                    fontWeight: 800,
                                                                    width: '12px',
                                                                    textAlign: 'center'
                                                                }}>{file.status[0]}</span>
                                                                <span style={{
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    opacity: 0.8
                                                                }} title={file.path}>{file.path}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </>
            )}
        </div>
    );
};
