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
    variant?: 'danger' | 'warning' | 'info';
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
    variant = 'warning'
}) => {
    const { theme } = useStore();
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    const getIcon = () => {
        const isDanger = variant === 'danger' || title.toLowerCase().includes('deletar') || title.toLowerCase().includes('excluir');
        const isUndo = title.toLowerCase().includes('desfazer') || title.toLowerCase().includes('undo');
        const color = isDanger ? '#ef4444' : (isUndo ? (isDark ? '#4fc3f7' : '#0070f3') : '#eab308');

        if (isUndo) {
            return <RotateCcw size={20} color={color} />;
        }
        if (isDanger) {
            return <Trash2 size={20} color={color} />;
        }
        return <AlertTriangle size={20} color={color} />;
    };

    const footer = (
        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
            <button
                onClick={onCancel}
                style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    color: isDark ? '#888' : '#666',
                    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#2a2a2a' : '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                {cancelLabel}
            </button>

            {onDiscard && (
                <button
                    onClick={onDiscard}
                    style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        color: '#ef4444',
                        border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = isDark ? '#333' : '#e5e7eb';
                    }}
                >
                    {discardLabel || "Descartar"}
                </button>
            )}

            <button
                onClick={onConfirm}
                style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background: variant === 'danger'
                        ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
                        : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                    color: variant === 'danger' ? '#f87171' : (isDark ? '#4fc3f7' : '#0070f3'),
                    border: `1px solid ${variant === 'danger'
                        ? (isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)')
                        : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                {title.toLowerCase().includes('undo') || title.toLowerCase().includes('desfazer')
                    ? <RotateCcw size={16} />
                    : (variant === 'danger' ? <Trash2 size={16} /> : <Check size={16} />)}
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
            maxWidth="420px"
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
