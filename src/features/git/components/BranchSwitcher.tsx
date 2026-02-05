import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../../components/../../store/useStore';
import { GitBranch, Plus, Trash2, Check, Search, X, CornerDownLeft } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';

interface BranchSwitcherProps {
    isDark: boolean;
}

export const BranchSwitcher: React.FC<BranchSwitcherProps> = ({ isDark }) => {
    const { git, changeBranch, createBranch, deleteBranch } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState('');

    // Dropdown ref for clicking outside
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const filteredBranches = git.branches?.filter(b =>
        b.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleCreateBranch = async () => {
        if (!newBranchName.trim()) return;
        await createBranch(newBranchName.trim());
        setNewBranchName('');
        setShowCreateModal(false);
        setIsOpen(false);
    };

    const handleDeleteBranch = (e: React.MouseEvent, branch: string) => {
        e.stopPropagation();
        setBranchToDelete(branch);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!branchToDelete) return;
        await deleteBranch(branchToDelete);
        setShowDeleteModal(false);
        setBranchToDelete('');
    };

    const handleSelectBranch = async (branch: string) => {
        if (branch === git.currentBranch) return;
        await changeBranch(branch);
        setIsOpen(false);
    };

    const createModalFooter = (
        <>
            <button
                onClick={() => setShowCreateModal(false)}
                style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: isDark ? '#888' : '#666',
                    border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600
                }}
            >
                Cancelar
            </button>
            <button
                onClick={() => void handleCreateBranch()}
                disabled={!newBranchName.trim()}
                style={{
                    padding: '8px 20px',
                    background: !newBranchName.trim() ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                    color: !newBranchName.trim() ? (isDark ? '#444' : '#999') : (isDark ? '#4fc3f7' : '#0070f3'),
                    border: `1px solid ${!newBranchName.trim() ? (isDark ? '#333' : '#eee') : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                }}
            >
                Criar Branch
            </button>
        </>
    );

    const deleteModalFooter = (
        <>
            <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: isDark ? '#888' : '#666',
                    border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600
                }}
            >
                Cancelar
            </button>
            <button
                onClick={() => void handleConfirmDelete()}
                style={{
                    padding: '8px 20px',
                    background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(248, 113, 113, 0.1)',
                    color: '#f87171',
                    border: `1px solid ${isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(248, 113, 113, 0.2)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(248, 113, 113, 0.25)' : 'rgba(248, 113, 113, 0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(248, 113, 113, 0.1)';
                }}
            >
                Deletar Branch
            </button>
        </>
    );

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#4fc3f7' : '#0070f3'
                }}>
                    <GitBranch size={18} />
                </div>
                <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{git.currentBranch || 'master'}</div>
                    <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>Repositório Ativo</div>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    background: isDark ? '#1a1a1a' : '#fff',
                    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    minWidth: '280px',
                    boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.15s ease-out'
                }}>
                    {/* Search Header */}
                    <div style={{ padding: '8px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: isDark ? '#252525' : '#f5f5f5',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            border: `1px solid ${isDark ? '#333' : '#ddd'}`
                        }}>
                            <Search size={14} color={isDark ? '#666' : '#999'} />
                            <input
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filtrar branches..."
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isDark ? '#fff' : '#000',
                                    fontSize: '0.8rem',
                                    marginLeft: '8px',
                                    flex: 1,
                                    outline: 'none'
                                }}
                            />
                            {searchTerm && (
                                <X
                                    size={14}
                                    color={isDark ? '#666' : '#999'}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSearchTerm('')}
                                />
                            )}
                        </div>
                    </div>

                    {/* Branch List */}
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {filteredBranches.map(branch => (
                            <div
                                key={branch}
                                onClick={() => void handleSelectBranch(branch)}
                                style={{
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    color: isDark ? '#eee' : '#333',
                                    background: branch === git.currentBranch ? (isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)') : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    if (branch !== git.currentBranch) {
                                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (branch !== git.currentBranch) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <GitBranch size={14} color={branch === git.currentBranch ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#666' : '#999')} />
                                    <span style={{ fontWeight: branch === git.currentBranch ? 700 : 400 }}>{branch}</span>
                                </div>

                                {branch === git.currentBranch ? (
                                    <Check size={14} color={isDark ? '#4fc3f7' : '#0070f3'} />
                                ) : (
                                    <button
                                        onClick={(e) => handleDeleteBranch(e, branch)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: isDark ? '#666' : '#999',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            display: 'flex'
                                        }}
                                        title="Deletar Branch"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#f87171';
                                            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = isDark ? '#666' : '#999';
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {filteredBranches.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: isDark ? '#666' : '#999' }}>
                                Nenhum branch encontrado.
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div style={{
                        padding: '8px',
                        borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                        background: isDark ? '#1a1a1a' : '#fafafa'
                    }}>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '6px',
                                borderRadius: '6px',
                                border: `1px dashed ${isDark ? '#444' : '#ccc'}`,
                                background: 'transparent',
                                color: isDark ? '#4fc3f7' : '#0070f3',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)';
                                e.currentTarget.style.borderColor = isDark ? '#4fc3f7' : '#0070f3';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = isDark ? '#444' : '#ccc';
                            }}
                        >
                            <Plus size={14} />
                            Criar Novo Branch
                        </button>
                    </div>
                </div>
            )}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Criar Novo Branch"
                isDark={isDark}
                headerIcon={<GitBranch size={16} color={isDark ? '#4fc3f7' : '#0070f3'} />}
                footer={createModalFooter}
                maxWidth="400px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Nome do Branch</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                autoFocus
                                placeholder="ex: feature/nova-funcionalidade"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: isDark ? '#252525' : '#fff',
                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    padding: '10px 12px',
                                    paddingRight: '35px',
                                    color: isDark ? '#fff' : '#000',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && void handleCreateBranch()}
                            />
                            <div style={{
                                position: 'absolute',
                                right: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '22px',
                                height: '22px',
                                background: isDark ? '#333' : '#f0f0f0',
                                border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                borderRadius: '4px',
                                color: isDark ? '#888' : '#999',
                                pointerEvents: 'none',
                                userSelect: 'none',
                                boxShadow: isDark ? '0 1px 0 rgba(0,0,0,0.5)' : '0 1px 0 rgba(0,0,0,0.1)'
                            }}>
                                <CornerDownLeft size={12} />
                            </div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.7rem', color: isDark ? '#666' : '#888' }}>
                            O novo branch será criado a partir de <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{git.currentBranch}</span>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}>Prefixos Sugeridos</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                            {['feature/', 'fix/', 'bugfix/', 'hotfix/', 'refactor/', 'chore/', 'docs/'].map(prefix => (
                                <button
                                    key={prefix}
                                    tabIndex={-1}
                                    onClick={() => {
                                        setNewBranchName(prev => {
                                            const nameWithoutPrefix = prev.includes('/') ? prev.split('/').slice(1).join('/') : prev;
                                            return prefix + nameWithoutPrefix;
                                        });
                                    }}
                                    style={{
                                        padding: '4px 10px',
                                        background: isDark ? '#2d2d2d' : '#f5f5f5',
                                        border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        color: isDark ? '#ccc' : '#666',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: 600
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = isDark ? '#4fc3f7' : '#0070f3';
                                        e.currentTarget.style.color = isDark ? '#4fc3f7' : '#0070f3';
                                        e.currentTarget.style.background = isDark ? 'rgba(79, 195, 247, 0.05)' : 'rgba(0, 112, 243, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd';
                                        e.currentTarget.style.color = isDark ? '#ccc' : '#666';
                                        e.currentTarget.style.background = isDark ? '#2d2d2d' : '#f5f5f5';
                                    }}
                                >
                                    {prefix.replace('/', '')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Deletar Branch"
                isDark={isDark}
                headerIcon={<Trash2 size={16} color="#f87171" />}
                footer={deleteModalFooter}
                maxWidth="450px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '0.9rem', color: isDark ? '#eee' : '#333', lineHeight: 1.5 }}>
                        Você tem certeza que deseja deletar o branch <span style={{ fontFamily: 'monospace', fontWeight: 700, color: isDark ? '#4fc3f7' : '#0070f3' }}>{branchToDelete}</span>?
                    </div>
                    <div style={{
                        padding: '12px',
                        background: isDark ? 'rgba(248, 113, 113, 0.05)' : 'rgba(248, 113, 113, 0.03)',
                        border: `1px solid ${isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(248, 113, 113, 0.1)'}`,
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: isDark ? '#f87171' : '#dc2626',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ fontWeight: 700 }}>Atenção:</div>
                        <div>Esta ação é irreversível se o branch contiver commits que não foram mergeados em outros branches.</div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
