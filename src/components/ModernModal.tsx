import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Check, AlertCircle } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { Modal } from './ui/Modal';
import pkg from '../../package.json';

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

    const validate = (value: string) => {
        if (modal.type === 'about') return null;
        if (!value.trim() && modal.type !== 'optional-prompt') return "Campo obrigatório";

        if (modal.type === 'variable' || modal.type.startsWith('var-')) {
            const name = value;
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
        }

        return null;
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (modal.type === 'about') {
            closeModal();
            return;
        }

        const validationError = validate(inputValue);
        if (validationError) {
            setError(validationError);
            return;
        }
        modal.onSubmit(inputValue);
        closeModal();
    };

    const currentError = error || validate(inputValue);
    const isValid = (modal.type === 'about' || modal.type === 'optional-prompt') || (inputValue.trim() && !currentError);

    const footer = (
        <>
            {modal.type !== 'about' && (
                <button
                    onClick={closeModal}
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
                    Cancelar
                </button>
            )}
            <button
                onClick={() => handleSubmit()}
                disabled={!isValid}
                style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: isValid ? 'pointer' : 'default',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background: !isValid
                        ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                        : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                    color: !isValid
                        ? (isDark ? '#444' : '#aaa')
                        : (isDark ? '#4fc3f7' : '#0070f3'),
                    border: `1px solid ${!isValid
                        ? (isDark ? '#333' : '#eee')
                        : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                    transition: 'all 0.2s',
                    opacity: !isValid ? 0.6 : 1
                }}
            >
                {modal.confirmLabel || 'Confirmar'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={modal.isOpen}
            onClose={closeModal}
            title={modal.title}
            isDark={isDark}
            footer={footer}
            maxWidth="420px"
        >
            <form onSubmit={handleSubmit}>
                {modal.type === 'about' ? (
                    <div style={{
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        color: isDark ? '#ccc' : '#444'
                    }}>
                        <p style={{ margin: '0 0 16px 0' }}>
                            <strong>JS BLOCK</strong> é uma IDE baseada em fluxo para engenharia de código JavaScript e Node.js.
                        </p>
                        <p style={{ margin: 0 }}>
                            Desenvolva lógicas complexas visualmente através de Blueprints e gere código limpo e performático instantaneamente.
                        </p>
                        <div style={{
                            marginTop: '24px',
                            padding: '12px',
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: isDark ? '#666' : '#999',
                            textAlign: 'center',
                            border: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`
                        }}>
                            Versão {pkg.version} • 2026
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{
                                fontSize: '0.7rem',
                                color: isDark ? '#666' : '#999',
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {modal.type === 'variable' ? 'Nome da Variável' : (modal.type.startsWith('prompt') ? 'Valor' : 'Entrada')}
                            </label>

                            <div style={{ position: 'relative' }}>
                                <input
                                    autoFocus
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder={modal.placeholder || (modal.type === 'variable' ? "ex: minhaVariavel" : "Digite aqui...")}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: isDark ? '#252525' : '#fff',
                                        border: `1px solid ${error ? '#ef4444' : (isDark ? '#333' : '#ddd')}`,
                                        borderRadius: '8px',
                                        fontSize: '0.95rem',
                                        color: isDark ? '#fff' : '#000',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                        fontFamily: 'monospace'
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = error ? '#ef4444' : (isDark ? '#4fc3f7' : '#0070f3')}
                                    onBlur={(e) => e.currentTarget.style.borderColor = error ? '#ef4444' : (isDark ? '#333' : '#ddd')}
                                />
                                {isValid && modal.type !== 'about' && (
                                    <div style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: isDark ? '#4ade80' : '#22c55e',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <Check size={18} />
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '8px 12px',
                                    background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'}`
                                }}>
                                    <AlertCircle size={14} color="#ef4444" />
                                    <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 500 }}>
                                        {error}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
};
