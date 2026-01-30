import React from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { FileText, User, Calendar, Hash, History } from 'lucide-react';

export const CommitDetailModal: React.FC = () => {
    const { commitDetail, closeCommitDetail, theme, checkoutCommit } = useStore();
    const isDark = theme === 'dark';

    if (!commitDetail.isOpen || !commitDetail.commit) return null;

    const { commit, files, fullMessage } = commitDetail;

    const handleCheckout = async () => {
        if (commit) {
            await checkoutCommit(commit.hash);
            closeCommitDetail();
        }
    };

    return (
        <Modal
            isOpen={commitDetail.isOpen}
            onClose={closeCommitDetail}
            title="Detalhes do Commit"
            isDark={isDark}
            maxWidth="600px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
                {/* Header Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#4fc3f7' : '#0070f3' }}>
                        <Hash size={16} />
                        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700 }}>
                            {commit.hash}
                        </span>
                    </div>

                    <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: isDark ? '#fff' : '#111',
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {fullMessage}
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: `1px solid ${isDark ? '#333' : '#eee'}`, margin: 0 }} />

                {/* Meta Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#aaa' : '#666' }}>
                        <User size={16} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6 }}>Autor</span>
                            <span style={{ fontSize: '0.85rem' }}>{commit.author}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#aaa' : '#666' }}>
                        <Calendar size={16} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6 }}>Data</span>
                            <span style={{ fontSize: '0.85rem' }}>{new Date(commit.date).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Files Changed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: isDark ? '#666' : '#999',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <FileText size={14} />
                        Arquivos Alterados ({files.length})
                    </div>

                    <div style={{
                        maxHeight: '250px',
                        overflowY: 'auto',
                        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                        borderRadius: '8px',
                        padding: '8px'
                    }}>
                        {files.map((file, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '6px 8px',
                                fontSize: '0.85rem',
                                color: isDark ? '#ddd' : '#444'
                            }}>
                                <span style={{
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    background: file.status === 'A' ? '#10b98122' : file.status === 'M' ? '#fbbf2422' : '#ef444422',
                                    color: file.status === 'A' ? '#10b981' : file.status === 'M' ? '#fbbf24' : '#ef4444',
                                    border: `1px solid ${file.status === 'A' ? '#10b98144' : file.status === 'M' ? '#fbbf2444' : '#ef444444'}`
                                }}>
                                    {file.status}
                                </span>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.path}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={closeCommitDetail}
                        style={{
                            padding: '10px 20px',
                            background: isDark ? 'transparent' : '#fff',
                            color: isDark ? '#aaa' : '#666',
                            border: `1px solid ${isDark ? '#333' : '#eee'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}
                    >
                        Fechar
                    </button>
                    <button
                        onClick={handleCheckout}
                        style={{
                            padding: '10px 20px',
                            background: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)',
                            color: isDark ? '#4fc3f7' : '#0070f3',
                            border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <History size={16} />
                        Visualizar Versão
                    </button>
                </div>
            </div>
        </Modal>
    );
};
