import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string | React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    isDark: boolean;
    maxWidth?: string;
    headerIcon?: React.ReactNode;
    showClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    isDark,
    maxWidth = '400px',
    headerIcon,
    showClose = true
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '16px',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: isDark ? '#1a1a1a' : '#fff',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: maxWidth,
                    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '85vh',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {headerIcon && (
                        <div style={{ color: isDark ? '#888' : '#666', display: 'flex', alignItems: 'center' }}>
                            {headerIcon}
                        </div>
                    )}
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, flex: 1, color: isDark ? '#fff' : '#1a1a1a' }}>
                        {title}
                    </h3>
                    {showClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: isDark ? '#666' : '#999',
                                padding: '4px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#2a2a2a' : '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={{
                        padding: '16px',
                        borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
                    }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
