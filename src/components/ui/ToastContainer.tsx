import React from 'react';
import { useStore } from '../../store/useStore';
import type { Toast } from '../../types/store';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast, theme } = useStore();
    const isDark = theme === 'dark';

    // Auto-remove logic is handled in store via setTimeout, 
    // but we render based on current state.

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none' // Let clicks pass through container
        }}>
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                    isDark={isDark}
                />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void; isDark: boolean }> = ({ toast, onClose, isDark }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle size={24} color="#10b981" />;
            case 'error': return <AlertCircle size={24} color="#ef4444" />;
            case 'warning': return <AlertTriangle size={24} color="#f59e0b" />;
            default: return <Info size={24} color="#3b82f6" />;
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case 'success': return 'rgba(16, 185, 129, 0.4)';
            case 'error': return 'rgba(239, 68, 68, 0.4)';
            case 'warning': return 'rgba(245, 158, 11, 0.4)';
            default: return 'rgba(59, 130, 246, 0.4)';
        }
    };

    return (
        <div
            style={{
                pointerEvents: 'auto',
                minWidth: '300px',
                maxWidth: '400px',
                background: isDark ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                color: isDark ? '#fff' : '#1f2937',
                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                // borderLeft removed
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center', // Centered vertically
                gap: '16px', // Increased gap
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(8px)',
                animation: 'slideIn 0.3s ease-out forwards',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ flexShrink: 0, display: 'flex' }}>
                {getIcon()}
            </div>

            <div style={{ flex: 1, fontSize: '0.875rem', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: '2px', fontSize: '0.8rem', opacity: 0.8 }}>
                    {toast.type === 'info' ? 'Informação' : toast.type === 'error' ? 'Erro' : toast.type === 'warning' ? 'Atenção' : 'Sucesso'}
                </div>
                <div>{toast.message}</div>
            </div>

            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#888' : '#aaa',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    marginLeft: '8px'
                }}
            >
                <X size={14} />
            </button>

            {/* Progress Bar Animation (Optional Polish) */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                background: getBorderColor(),
                width: '100%',
                animation: `shrink ${toast.duration ?? 3000}ms linear forwards`,
                opacity: 0.5
            }} />

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};
