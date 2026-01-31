import React from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, RotateCcw, Trash2, Check } from 'lucide-react';
import { Modal } from './ui/Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    onDiscard?: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    discardLabel?: string;
    variant?: 'danger' | 'warning' | 'info' | 'primary';
    discardVariant?: 'danger' | 'warning' | 'info' | 'primary' | 'secondary';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    onDiscard,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    discardLabel,
    variant = 'warning',
    discardVariant
}) => {
    const { theme } = useStore();
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    const getIcon = () => {
        const titleLower = title.toLowerCase();
        const isDanger = variant === 'danger' || titleLower.includes('deletar') || titleLower.includes('excluir');
        const isUndo = titleLower.includes('desfazer') || titleLower.includes('undo');
        const color = isDanger ? '#ef4444' : (isUndo ? (isDark ? '#4fc3f7' : '#0070f3') : '#eab308');

        if (isUndo) return <RotateCcw size={20} color={color} />;
        if (isDanger) return <Trash2 size={20} color={color} />;
        return <AlertTriangle size={20} color={color} />;
    };

    const footer = (
        <div style={{
            display: 'flex',
            gap: '8px',
            width: '100%',
            justifyContent: 'flex-end',
            flexWrap: 'nowrap'
        }}>
            <button
                onClick={onCancel}
                style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    color: isDark ? '#999' : '#666',
                    border: `1px solid ${isDark ? '#333' : '#d1d5db'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    minWidth: '80px'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';
                    e.currentTarget.style.borderColor = isDark ? '#444' : '#c1c5cb';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = isDark ? '#333' : '#d1d5db';
                }}
            >
                {cancelLabel}
            </button>

            {onDiscard && (
                <button
                    onClick={onDiscard}
                    style={{
                        padding: '8px 14px',
                        color: discardVariant === 'danger' ? '#f87171' : (isDark ? '#ccc' : '#444'),
                        border: `1px solid ${discardVariant === 'danger' ? (isDark ? '#442222' : '#fecaca') : (isDark ? '#333' : '#d1d5db')}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        background: discardVariant === 'danger'
                            ? (isDark ? 'rgba(248, 113, 113, 0.05)' : 'rgba(239, 68, 68, 0.02)')
                            : 'transparent'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                        if (discardVariant === 'danger') {
                            e.currentTarget.style.background = isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.05)';
                            e.currentTarget.style.borderColor = '#f87171';
                        } else {
                            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';
                            e.currentTarget.style.borderColor = isDark ? '#444' : '#c1c5cb';
                        }
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.background = discardVariant === 'danger'
                            ? (isDark ? 'rgba(248, 113, 113, 0.05)' : 'rgba(239, 68, 68, 0.02)')
                            : 'transparent';
                        e.currentTarget.style.borderColor = discardVariant === 'danger'
                            ? (isDark ? '#442222' : '#fecaca')
                            : (isDark ? '#333' : '#d1d5db');
                    }}
                >
                    {discardLabel ?? "Discard"}
                </button>
            )}

            <button
                onClick={onConfirm}
                style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: variant === 'danger'
                        ? (isDark ? '#991b1b' : '#dc2626')
                        : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                    color: variant === 'danger'
                        ? '#fff'
                        : (isDark ? '#4fc3f7' : '#0070f3'),
                    border: variant === 'danger'
                        ? 'none'
                        : `1px solid ${isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)'}`,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: 'none'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.filter = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                {title.toLowerCase().includes('undo') || title.toLowerCase().includes('desfazer')
                    ? <RotateCcw size={14} />
                    : (variant === 'danger' ? <Trash2 size={14} /> : <Check size={14} />)}
                {confirmLabel}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
            isDark={isDark}
            footer={footer}
            headerIcon={getIcon()}
            maxWidth="550px"
        >
            <div style={{
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: isDark ? '#ccc' : '#444'
            }}>
                {message}
            </div>
        </Modal>
    );
};
