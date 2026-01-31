import React from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { FileText, User, Calendar, Hash, History, GitCommit, Copy, Check, GitBranch, Plus, Minus } from 'lucide-react';

export const CommitDetailModal: React.FC = () => {
    const { commitDetail, closeCommitDetail, theme, checkoutCommit, openModal, createBranch } = useStore();
    const isDark = theme === 'dark';
    const [copiedHash, setCopiedHash] = React.useState(false);

    if (!commitDetail.isOpen || !commitDetail.commit) return null;

    const { commit, files, fullMessage, stats } = commitDetail;

    const handleCheckout = async () => {
        if (commit) {
            await checkoutCommit(commit.hash);
            closeCommitDetail();
        }
    };

    const handleCreateBranch = () => {
        if (commit) {
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
        }
    };

    const copyHashToClipboard = () => {
        navigator.clipboard.writeText(commit.hash);
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { bg: string, color: string, label: string }> = {
            'A': { bg: '#10b98122', color: '#10b981', label: 'Added' },
            'M': { bg: '#fbbf2422', color: '#fbbf24', label: 'Modified' },
            'D': { bg: '#ef444422', color: '#ef4444', label: 'Deleted' },
            'R': { bg: '#8b5cf622', color: '#8b5cf6', label: 'Renamed' },
        };
        return configs[status] || { bg: '#88888822', color: '#888888', label: 'Unknown' };
    };

    return (
        <Modal
            isOpen={commitDetail.isOpen}
            onClose={closeCommitDetail}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'space-between', paddingRight: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>Detalhes</span>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace'
                        }}>
                            <Hash size={12} style={{ color: isDark ? '#888' : '#666', opacity: 0.7 }} />
                            <span style={{ color: isDark ? '#ddd' : '#333' }}>{commit.hash.substring(0, 7)}</span>
                            <button
                                onClick={copyHashToClipboard}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: isDark ? '#888' : '#666'
                                }}
                                title="Copiar hash completo"
                            >
                                {copiedHash ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                            </button>
                        </div>
                    </div>

                    {stats && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                                <Plus size={12} />
                                {stats.insertions}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                                <Minus size={12} />
                                {stats.deletions}
                            </div>
                        </div>
                    )}
                </div>
            }
            isDark={isDark}
            maxWidth="650px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '2px 0' }}>
                {/* Commit Message */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                        borderRadius: '7px',
                        flexShrink: 0
                    }}>
                        <GitCommit size={16} style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', minHeight: '32px' }}>
                        {(() => {
                            const lines = fullMessage.split('\n');
                            const title = lines[0];
                            const description = lines.slice(1).join('\n').trim();

                            return (
                                <>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        color: isDark ? '#fff' : '#111',
                                        lineHeight: '1.4',
                                        wordBreak: 'break-word'
                                    }}>
                                        {title}
                                    </div>
                                    {description && (
                                        <div style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 400,
                                            color: isDark ? '#aaa' : '#666',
                                            lineHeight: '1.5',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            marginTop: '4px'
                                        }}>
                                            {description}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Meta Info Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDark ? 'rgba(236, 72, 153, 0.1)' : 'rgba(219, 39, 119, 0.08)',
                            borderRadius: '7px',
                            flexShrink: 0
                        }}>
                            <User size={16} style={{ color: isDark ? '#f472b6' : '#db2777' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, marginBottom: '1px', color: isDark ? '#999' : '#666' }}>Autor</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#eee' : '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {commit.author.split('<')[0].trim()}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDark ? 'rgba(45, 212, 191, 0.1)' : 'rgba(13, 148, 136, 0.08)',
                            borderRadius: '7px',
                            flexShrink: 0
                        }}>
                            <Calendar size={16} style={{ color: isDark ? '#2dd4bf' : '#0d9488' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, marginBottom: '1px', color: isDark ? '#999' : '#666' }}>Data</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#eee' : '#222' }}>
                                {new Date(commit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Files Changed Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isDark ? '#888' : '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <FileText size={14} />
                        <span>Arquivos Alterados</span>
                        <span style={{
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            color: isDark ? '#aaa' : '#555',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            fontSize: '0.7rem',
                            fontWeight: 700
                        }}>
                            {files.length}
                        </span>
                    </div>

                    <div style={{
                        maxHeight: '240px',
                        overflowY: 'auto',
                        background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.02)',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
                        padding: '3px'
                    }}>
                        {files.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#555' : '#999', fontSize: '0.8rem' }}>
                                Nenhuma alteração de arquivo detectada
                            </div>
                        ) : (
                            files.map((file, idx) => {
                                const badge = getStatusBadge(file.status);
                                return (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px 10px',
                                        marginBottom: '2px',
                                        fontSize: '0.8rem',
                                        color: isDark ? '#ddd' : '#444',
                                        background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
                                        borderRadius: '5px',
                                        transition: 'background 0.15s',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : '#fff'}
                                    >
                                        <div style={{
                                            minWidth: '58px',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            background: badge.bg,
                                            color: badge.color,
                                            border: `1px solid ${badge.color}44`,
                                            textAlign: 'center'
                                        }}>
                                            {badge.label}
                                        </div>
                                        <span style={{
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontFamily: 'monospace',
                                            fontSize: '0.75rem'
                                        }}>
                                            {file.path}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    paddingTop: '6px',
                    borderTop: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`
                }}>
                    <button
                        onClick={closeCommitDetail}
                        style={{
                            padding: '9px 16px',
                            background: 'transparent',
                            color: isDark ? '#999' : '#666',
                            border: `1.5px solid ${isDark ? '#3a3a3a' : '#d1d5db'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Fechar
                    </button>

                    <button
                        onClick={handleCreateBranch}
                        style={{
                            padding: '9px 16px',
                            background: 'transparent',
                            color: isDark ? '#999' : '#666',
                            border: `1.5px solid ${isDark ? '#3a3a3a' : '#d1d5db'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <GitBranch size={15} />
                        Nova Branch
                    </button>

                    <button
                        onClick={handleCheckout}
                        style={{
                            padding: '9px 18px',
                            background: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                            color: isDark ? '#60a5fa' : '#2563eb',
                            border: `1.5px solid ${isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <History size={15} />
                        Checkout
                    </button>
                </div>
            </div>
        </Modal>
    );
};
