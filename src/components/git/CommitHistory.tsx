import React, { useState, useMemo } from 'react';
import { SectionHeader } from './SharedComponents';
import { Search, RefreshCw, ChevronDown, ChevronRight, History, GitBranch, FileText, Plus, Minus } from 'lucide-react';
import { ScrollArea } from '../ui/ScrollArea';
import { useStore } from '../../store/useStore';

interface GitHistoryProps {
    isDark: boolean;
    logs: any[];
    isOpen: boolean;
    onToggle: () => void;
}

export const CommitHistory: React.FC<GitHistoryProps> = ({
    isDark, logs, isOpen, onToggle
}) => {
    const { getCommitFiles, openModal, checkoutCommit, createBranch, openedFolder } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
    const [commitFiles, setCommitFiles] = useState<Record<string, any[]>>({});
    const [commitStats, setCommitStats] = useState<Record<string, { insertions: number, deletions: number }>>({});
    const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString();
        } catch (e) {
            return dateStr;
        }
    };

    const toggleCommit = async (hash: string) => {
        const newExpanded = new Set(expandedCommits);
        if (newExpanded.has(hash)) {
            newExpanded.delete(hash);
        } else {
            newExpanded.add(hash);
            if (!commitFiles[hash]) {
                setLoadingFiles(prev => new Set(prev).add(hash));
                try {
                    // Fetch files
                    const files = await getCommitFiles(hash);

                    // Fetch stats
                    let stats = { insertions: 0, deletions: 0 };
                    try {
                        if ((window as any).electronAPI && openedFolder) {
                            const statRes = await (window as any).electronAPI.gitCommand(openedFolder, ['show', '--shortstat', '--format=', hash]);
                            const statLine = statRes.stdout.trim();
                            if (statLine) {
                                const insMatch = statLine.match(/(\d+) insertions?\(\+\)/);
                                const delMatch = statLine.match(/(\d+) deletions?\(-\)/);
                                stats = {
                                    insertions: insMatch ? parseInt(insMatch[1]) : 0,
                                    deletions: delMatch ? parseInt(delMatch[1]) : 0
                                };
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to fetch stats for history:', e);
                    }

                    setCommitFiles(prev => ({ ...prev, [hash]: files }));
                    setCommitStats(prev => ({ ...prev, [hash]: stats }));

                } catch (err) {
                    console.error('Erro ao buscar arquivos do commit:', err);
                } finally {
                    setLoadingFiles(prev => {
                        const next = new Set(prev);
                        next.delete(hash);
                        return next;
                    });
                }
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





    return (
        <div
            className="animate-entrance"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: isDark ? '#1a1a1a' : '#fff',
                opacity: 0 // Start hidden for animation
            }}
        >
            <SectionHeader
                title="Lista de Commits"
                count={logs.length}
                isOpen={isOpen}
                onToggle={onToggle}
                isDark={isDark}
                rightElement={
                    <button
                        onClick={(e) => { e.stopPropagation(); useStore.getState().refreshGit(); }}
                        title="Atualizar Histórico"
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


                    </div>

                    <ScrollArea style={{ flex: 1 }}>
                        <div style={{ padding: '0' }}>
                            {filteredCommits.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: isDark ? '#444' : '#ccc', fontSize: '0.75rem' }}>
                                    Nenhum commit encontrado
                                </div>
                            ) : (
                                filteredCommits.map((commit, i) => {
                                    const isExpanded = expandedCommits.has(commit.hash);
                                    const files = commitFiles[commit.hash] || [];
                                    const isLoading = loadingFiles.has(commit.hash);

                                    return (
                                        <div
                                            key={commit.hash}
                                            style={{
                                                borderBottom: `1px solid ${isDark ? '#252525' : '#f5f5f5'}`,
                                                transition: 'background 0.2s',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: '10px 16px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '10px',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                onClick={() => toggleCommit(commit.hash)}
                                            >
                                                <div style={{ marginTop: '4px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        background: isDark ? '#1a1a1a' : '#fff',
                                                        border: `2px solid #0070f3`,
                                                        zIndex: 2,
                                                        flexShrink: 0
                                                    }} />
                                                    {i !== filteredCommits.length - 1 && (
                                                        <div style={{
                                                            width: '1px',
                                                            height: '100%',
                                                            minHeight: '20px',
                                                            background: isDark ? '#333' : '#eee',
                                                            position: 'absolute',
                                                            top: '10px',
                                                            zIndex: 1
                                                        }} />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            color: isDark ? '#ddd' : '#333',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            flex: 1
                                                        }}>
                                                            {commit.message}
                                                        </div>
                                                        <div style={{ color: isDark ? '#555' : '#ccc' }}>
                                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: isDark ? '#666' : '#999' }}>
                                                        <span style={{ fontWeight: 500 }}>{(commit.author || 'Desconhecido').split('<')[0].trim()}</span>
                                                        <span>•</span>
                                                        <span>{formatDate(commit.date)}</span>
                                                        <span style={{ fontFamily: 'monospace', opacity: 0.6 }}>{commit.hash.substring(0, 7)}</span>
                                                        {isExpanded && commitStats && commitStats[commit.hash] && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '2px' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0px', color: '#10b981' }} title={`${commitStats[commit.hash].insertions} inserções`}>
                                                                    <Plus size={8} strokeWidth={3} />{commitStats[commit.hash].insertions}
                                                                </span>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0px', color: '#ef4444' }} title={`${commitStats[commit.hash].deletions} deleções`}>
                                                                    <Minus size={8} strokeWidth={3} />{commitStats[commit.hash].deletions}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div style={{
                                                    padding: '0 16px 12px 36px',
                                                    background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {/* Quick Actions */}
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); checkoutCommit(commit.hash); }}
                                                            style={{
                                                                background: isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)',
                                                                border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.1)'}`,
                                                                color: isDark ? '#4fc3f7' : '#0070f3',
                                                                padding: '4px 10px',
                                                                borderRadius: '4px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <History size={12} /> Checkout
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openModal({
                                                                    title: 'Criar Branch a partir deste Commit',
                                                                    type: 'input',
                                                                    placeholder: 'Nome da nova branch',
                                                                    confirmLabel: 'Criar',
                                                                    initialValue: '',
                                                                    onSubmit: (name) => {
                                                                        if (name) createBranch(name, commit.hash);
                                                                    }
                                                                });
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                                                color: isDark ? '#999' : '#666',
                                                                padding: '4px 10px',
                                                                borderRadius: '4px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <GitBranch size={12} /> Branch
                                                        </button>
                                                    </div>

                                                    {/* Files List */}
                                                    <div style={{ color: isDark ? '#666' : '#999', marginBottom: '8px', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FileText size={10} /> Arquivos Alterados
                                                    </div>

                                                    {isLoading ? (
                                                        <div style={{ padding: '10px 0', color: isDark ? '#444' : '#ccc' }}>Carregando arquivos...</div>
                                                    ) : files.length === 0 ? (
                                                        <div style={{ padding: '10px 0', color: isDark ? '#444' : '#ccc' }}>Nenhum arquivo listado</div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {files.map((file, idx) => (
                                                                <div key={idx} style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    color: isDark ? '#bbb' : '#555',
                                                                    fontFamily: 'monospace'
                                                                }}>
                                                                    <span style={{
                                                                        fontSize: '0.6rem',
                                                                        fontWeight: 800,
                                                                        color: file.status === 'A' ? '#10b981' : file.status === 'M' ? '#fbbf24' : '#ef4444',
                                                                        width: '12px'
                                                                    }}>{file.status}</span>
                                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </>
            )}
        </div>
    );
};
