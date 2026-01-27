import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Check, AlertTriangle } from 'lucide-react';
import type { Node } from '@xyflow/react';

export const ModernModal = () => {
    const { modal, closeModal, theme, nodes } = useStore();
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const isDark = theme === 'dark';

    useEffect(() => {
        if (modal.isOpen) {
            setInputValue(modal.initialValue || '');
            setError(null);
        }
    }, [modal.isOpen, modal.initialValue]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && modal.isOpen) closeModal();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [modal.isOpen, closeModal]);

    if (!modal.isOpen) return null;

    const validate = (name: string) => {
        if (!name.trim()) return "Nome obrigatório";

        const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
        if (!isValidIdentifier) {
            return "Inválido: use letras, números, _ ou $";
        }

        const reserved = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'true', 'false', 'null', 'undefined', 'class', 'extends', 'import', 'export', 'default', 'new', 'this', 'super'];
        if (reserved.includes(name)) {
            return `"${name}" é palavra reservada`;
        }

        const exists = nodes.some((n: Node) => n.id === `var-${name}` || (n.data as any).label === name);
        if (exists) {
            return `Variável "${name}" já existe`;
        }

        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validate(inputValue);
        if (validationError) {
            setError(validationError);
            return;
        }
        modal.onSubmit(inputValue);
        closeModal();
    };

    const currentError = error || validate(inputValue);
    const isValid = inputValue.trim() && !currentError;

    return (
        <>
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.96) translateY(-10px);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .modal-input:focus {
                    border-color: ${isDark ? '#7c4dff' : '#6200ea'} !important;
                }
                .modal-button-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 20px rgba(124, 77, 255, 0.4);
                }
                .modal-button-secondary:hover {
                    background: ${isDark ? '#333' : '#e8e8e8'};
                }
            `}</style>

            <div
                onClick={closeModal}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'modalFadeIn 0.15s ease-out'
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '90%',
                        maxWidth: '480px',
                        background: isDark ? '#1a1a1a' : '#ffffff',
                        borderRadius: '16px',
                        boxShadow: isDark
                            ? '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255,255,255,0.1) inset'
                            : '0 20px 60px rgba(0, 0, 0, 0.15)',
                        border: `1px solid ${isDark ? '#2a2a2a' : '#f0f0f0'}`,
                        animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '24px 24px 20px',
                        borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#f0f0f0'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{
                                    margin: '0 0 6px 0',
                                    fontSize: '1.3rem',
                                    fontWeight: 700,
                                    color: isDark ? '#fff' : '#1a1a1a',
                                    letterSpacing: '-0.02em'
                                }}>
                                    {modal.title}
                                </h2>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.875rem',
                                    color: isDark ? '#888' : '#666',
                                    fontWeight: 400
                                }}>
                                    Transforme este valor em uma variável reutilizável
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: isDark ? '#666' : '#999',
                                    padding: '4px',
                                    display: 'flex',
                                    transition: 'color 0.2s',
                                    borderRadius: '6px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#2a2a2a' : '#f0f0f0'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <X size={20} strokeWidth={2} />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: isDark ? '#aaa' : '#555',
                                marginBottom: '8px',
                                letterSpacing: '0.01em'
                            }}>
                                Nome da Variável
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    autoFocus
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="totalVendas"
                                    className="modal-input"
                                    style={{
                                        width: '100%',
                                        padding: '13px 16px',
                                        paddingRight: isValid ? '44px' : '16px',
                                        background: isDark ? '#0f0f0f' : '#fafafa',
                                        border: `1.5px solid ${error ? '#ff5252' :
                                                isValid ? '#4caf50' :
                                                    (isDark ? '#2a2a2a' : '#e0e0e0')
                                            }`,
                                        borderRadius: '10px',
                                        color: isDark ? '#fff' : '#1a1a1a',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box',
                                        fontFamily: 'monospace',
                                        fontWeight: 500
                                    }}
                                />
                                {isValid && (
                                    <div style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#4caf50',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <Check size={18} strokeWidth={2.5} />
                                    </div>
                                )}
                            </div>
                            {error && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '10px 12px',
                                    background: isDark ? 'rgba(255, 82, 82, 0.1)' : 'rgba(255, 82, 82, 0.08)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: `1px solid ${isDark ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 82, 82, 0.15)'}`
                                }}>
                                    <AlertTriangle size={16} color="#ff5252" strokeWidth={2} />
                                    <span style={{
                                        color: '#ff5252',
                                        fontSize: '0.8125rem',
                                        fontWeight: 500
                                    }}>
                                        {error}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            paddingTop: '4px'
                        }}>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="modal-button-secondary"
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    background: isDark ? '#2a2a2a' : '#f5f5f5',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: isDark ? '#aaa' : '#666',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.01em'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!isValid}
                                className="modal-button-primary"
                                style={{
                                    flex: 2,
                                    padding: '12px 20px',
                                    background: isValid
                                        ? 'linear-gradient(135deg, #7c4dff 0%, #536dfe 100%)'
                                        : (isDark ? '#333' : '#e0e0e0'),
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: isValid ? '#fff' : (isDark ? '#666' : '#aaa'),
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: isValid ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s',
                                    boxShadow: isValid ? '0 4px 12px rgba(124, 77, 255, 0.25)' : 'none',
                                    letterSpacing: '0.01em',
                                    opacity: isValid ? 1 : 0.6
                                }}
                            >
                                Criar Variável
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
