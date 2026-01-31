import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Archive, ArrowUpCircle, RotateCcw, Layers, Trash2, ChevronDown, Monitor, ChevronRight } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { ScrollArea } from '../ui/ScrollArea';

interface ProductivityToolbarProps {
    isDark: boolean;
    children?: React.ReactNode;
}

export const ProductivityToolbar: React.FC<ProductivityToolbarProps> = ({ isDark, children }) => {
    const { git, gitStash, gitPopStash, gitUndoLastCommit, gitApplyStash, gitDropStash, setConfirmationModal } = useStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const hasChanges = git.changes.length > 0;
    const stashCount = git.stashes.length;
    const hasStashes = stashCount > 0;
    const hasHistory = git.log.length > 0;

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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleAction = async (action: () => Promise<void>) => {
        setIsProcessing(true);
        try {
            await action();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUndo = async () => {
        setConfirmationModal({
            isOpen: true,
            title: 'Desfazer Último Commit',
            message: 'Isso irá remover o último commit do histórico, mas manterá todas as alterações nos seus arquivos (Soft Reset). Deseja continuar?',
            confirmLabel: 'Desfazer Commit',
            cancelLabel: 'Cancelar',
            variant: 'danger',
            onConfirm: () => {
                handleAction(gitUndoLastCommit);
                setConfirmationModal(null);
            },
            onCancel: () => setConfirmationModal(null)
        });
    };

    const handleStash = async () => {
        if (!hasChanges) return;
        await handleAction(() => gitStash());
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
            background: isDark ? '#1f1f1f' : '#f9fafb',
            position: 'relative'
        }}>
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChevronRight size={12} color={isDark ? '#666' : '#999'} />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#666' : '#999', textTransform: 'uppercase' }}>
                    Ações Rápidas
                </span>
            </div>

            {/* Stash Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} ref={dropdownRef}>
                <Tooltip content={hasChanges ? "Guardar alterações atuais na gaveta (Stash)" : "Nada para guardar"} side="bottom">
                    <button
                        onClick={handleStash}
                        disabled={isProcessing || !hasChanges}
                        style={{
                            background: isDark ? '#252525' : '#fff',
                            border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                            borderRadius: '6px',
                            cursor: (!hasChanges || isProcessing) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            color: (!hasChanges || isProcessing) ? (isDark ? '#444' : '#ccc') : (isDark ? '#aaa' : '#666'),
                            transition: 'all 0.2s',
                            opacity: (!hasChanges || isProcessing) ? 0.6 : 1,
                            outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (!hasChanges || isProcessing) return;
                            e.currentTarget.style.color = isDark ? '#fff' : '#000';
                            e.currentTarget.style.background = isDark ? '#333' : '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isDark ? '#333' : '#ddd';
                            e.currentTarget.style.color = isDark ? '#aaa' : '#666';
                            e.currentTarget.style.background = isDark ? '#252525' : '#fff';
                        }}
                    >
                        <Archive size={12} />
                        <span style={{ fontWeight: 600 }}>Stash</span>
                    </button>
                </Tooltip>

                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <Tooltip content={hasStashes ? "Restaurar última gaveta (Pop)" : "Gaveta vazia"} side="bottom">
                        <button
                            onClick={() => handleAction(() => gitPopStash(0))}
                            disabled={isProcessing || !hasStashes}
                            style={{
                                background: isDark ? '#252525' : '#fff',
                                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                borderRight: 'none',
                                borderRadius: '6px 0 0 6px',
                                cursor: (!hasStashes || isProcessing) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                color: (!hasStashes || isProcessing) ? (isDark ? '#444' : '#ccc') : (isDark ? '#aaa' : '#666'),
                                transition: 'all 0.2s',
                                opacity: (!hasStashes || isProcessing) ? 0.6 : 1,
                                outline: 'none'
                            }}
                        >
                            <ArrowUpCircle size={12} />
                            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Pop
                                {stashCount > 0 && (
                                    <span style={{
                                        width: '6px',
                                        height: '6px',
                                        background: isDark ? '#4fc3f7' : '#0070f3',
                                        borderRadius: '50%',
                                        boxShadow: isDark ? '0 0 4px rgba(79, 195, 247, 0.4)' : '0 0 4px rgba(0, 112, 243, 0.3)',
                                    }} />
                                )}
                            </span>
                        </button>
                    </Tooltip>
                    <Tooltip content={hasStashes ? `Ver todas as gavetas (${stashCount})` : "Gaveta vazia"} side="bottom">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            disabled={isProcessing || !hasStashes}
                            style={{
                                background: isDark ? '#252525' : '#fff',
                                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                borderRadius: '0 6px 6px 0',
                                cursor: (!hasStashes || isProcessing) ? 'not-allowed' : 'pointer',
                                padding: '4px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: (!hasStashes || isProcessing) ? 0.6 : 1,
                                outline: 'none'
                            }}
                        >
                            <ChevronDown size={14} color={isDark ? '#666' : '#999'} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                    </Tooltip>


                    {/* Stash Dropdown Menu */}
                    {isOpen && hasStashes && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 5px)',
                            right: 0,
                            background: isDark ? '#1a1a1a' : '#fff',
                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                            borderRadius: '10px',
                            minWidth: '320px',
                            boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            overflow: 'hidden',
                            transformOrigin: 'top right'
                        }}>
                            <div style={{ padding: '12px', background: isDark ? '#222' : '#f9fafb', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                                <div style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: isDark ? '#888' : '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    letterSpacing: '0.05em'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Layers size={14} /> GAVETAS DISPONÍVEIS
                                    </div>
                                    <span style={{
                                        background: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)',
                                        color: isDark ? '#4fc3f7' : '#0070f3',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.1)'}`
                                    }}>
                                        {stashCount}
                                    </span>
                                </div>
                            </div>
                            <ScrollArea style={{ maxHeight: '300px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {git.stashes.map((stash) => (
                                        <div key={stash.index} style={{
                                            padding: '12px',
                                            borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#f0f0f0'}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            transition: 'background 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isDark ? '#eee' : '#1a1a1a' }}>
                                                        {stash.message}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: isDark ? '#666' : '#999', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Monitor size={10} /> {stash.branch}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: isDark ? '#444' : '#ccc', background: isDark ? '#252525' : '#eee', padding: '1px 5px', borderRadius: '4px' }}>
                                                    #{stash.index}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={() => {
                                                        handleAction(() => gitPopStash(stash.index));
                                                        setIsOpen(false);
                                                    }}
                                                    title="Traz as alterações de volta e remove esta caixa da lista."
                                                    style={{
                                                        flex: 1, padding: '6px 4px', borderRadius: '4px', border: 'none',
                                                        background: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)',
                                                        color: isDark ? '#4fc3f7' : '#0070f3',
                                                        fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '0.75rem' }}>Pop</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleAction(() => gitApplyStash(stash.index));
                                                        setIsOpen(false);
                                                    }}
                                                    title="Aplica as alterações no código mas mantém a caixa salva na lista."
                                                    style={{
                                                        flex: 1, padding: '6px 4px', borderRadius: '4px', border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                                        background: 'transparent',
                                                        color: isDark ? '#aaa' : '#666',
                                                        fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '0.75rem' }}>Apply</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setConfirmationModal({
                                                            isOpen: true,
                                                            title: 'Deletar Gaveta Definitivamente?',
                                                            message: `Você está prestes a excluir permanentemente o rascunho "${stash.message}". Esta ação não pode ser desfeita.`,
                                                            confirmLabel: 'Excluir Rascunho',
                                                            cancelLabel: 'Manter',
                                                            variant: 'danger',
                                                            onConfirm: () => {
                                                                handleAction(() => gitDropStash(stash.index));
                                                                setConfirmationModal(null);
                                                            },
                                                            onCancel: () => setConfirmationModal(null)
                                                        });
                                                    }}
                                                    title="Deletar permanentemente"
                                                    style={{
                                                        padding: '0 10px', borderRadius: '4px', border: 'none',
                                                        background: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                                                        color: '#f87171',
                                                        fontSize: '0.7rem', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '16px', background: isDark ? '#333' : '#ddd', margin: '0 4px' }} />

            {/* History Group */}
            <Tooltip content={hasHistory ? "Desfazer o último commit mantendo as alterações (Soft Reset)" : "Sem commits para desfazer"} side="bottom">
                <button
                    onClick={handleUndo}
                    disabled={isProcessing || !hasHistory}
                    style={{
                        background: isDark ? '#252525' : '#fff',
                        border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                        borderRadius: '6px',
                        cursor: (!hasHistory || isProcessing) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        color: (!hasHistory || isProcessing) ? (isDark ? '#444' : '#ccc') : (isDark ? '#f87171' : '#dc2626'),
                        transition: 'all 0.2s',
                        opacity: (!hasHistory || isProcessing) ? 0.6 : 1,
                        outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (!hasHistory || isProcessing) return;
                        e.currentTarget.style.color = isDark ? '#f87171' : '#dc2626';
                        e.currentTarget.style.background = isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 38, 38, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = isDark ? '#252525' : '#fff';
                        e.currentTarget.style.borderColor = isDark ? '#333' : '#ddd';
                        e.currentTarget.style.color = (!hasHistory || isProcessing) ? (isDark ? '#444' : '#ccc') : (isDark ? '#f87171' : '#dc2626');
                    }}
                >
                    <RotateCcw size={12} />
                    <span style={{ fontWeight: 600 }}>Undo Commit</span>
                </button>
            </Tooltip>


            {/* Right Aligned Content (Refresh & Profile) */}
            {
                children && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {children}
                    </div>
                )
            }

        </div >
    );
};
