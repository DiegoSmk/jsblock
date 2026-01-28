import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { FileWarning, Save } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    onDiscard?: () => void; // Optional "Discard Changes" for exit flow
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    discardLabel?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    onDiscard,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    discardLabel
}) => {
    const { theme } = useStore();
    const isDark = theme === 'dark';

    // Animation state
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimateIn(true);
        } else {
            setAnimateIn(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            opacity: animateIn ? 1 : 0,
            transition: 'opacity 0.2s ease-out'
        }}>
            <div style={{
                width: '90%',
                maxWidth: '420px',
                background: isDark ? '#1e1e1e' : '#fff',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                padding: '24px',
                transform: animateIn ? 'scale(1)' : 'scale(0.95)',
                transition: 'transform 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: '#eab308'
                    }}>
                        <FileWarning size={22} />
                    </div>
                    <div>
                        <h3 style={{
                            margin: '0 0 8px 0',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: isDark ? '#fff' : '#111'
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            color: isDark ? '#ccc' : '#555'
                        }}>
                            {message}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            color: isDark ? '#aaa' : '#666',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {cancelLabel}
                    </button>

                    {onDiscard && (
                        <button
                            onClick={onDiscard}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: `1px solid ${isDark ? '#ef4444' : '#ef4444'}`,
                                background: 'transparent',
                                color: '#ef4444',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#ef4444';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#ef4444';
                            }}
                        >
                            {discardLabel || "Discard"}
                        </button>
                    )}

                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isDark ? '#0070f3' : '#0070f3',
                            color: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0, 112, 243, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Save size={16} />
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
