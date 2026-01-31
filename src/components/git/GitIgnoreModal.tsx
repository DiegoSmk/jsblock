import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { X, Save, EyeOff } from 'lucide-react';
import { ScrollArea } from '../ui/ScrollArea';

interface GitIgnoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
}

export const GitIgnoreModal: React.FC<GitIgnoreModalProps> = ({
    isOpen,
    onClose,
    isDark
}) => {
    const { openedFolder, refreshGit, addToast } = useStore();
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [originalContent, setOriginalContent] = useState('');

    useEffect(() => {
        if (isOpen && openedFolder) {
            loadGitIgnore();
        }
    }, [isOpen, openedFolder]);

    const loadGitIgnore = async () => {
        setIsLoading(true);
        const path = getGitIgnorePath();
        try {
            const fileContent = await (window as any).electronAPI.readFile(path);
            setContent(fileContent);
            setOriginalContent(fileContent);
        } catch (e) {
            // File likely doesn't exist
            setContent('');
            setOriginalContent('');
        } finally {
            setIsLoading(false);
        }
    };

    const getGitIgnorePath = () => {
        if (!openedFolder) return '';
        return openedFolder.endsWith('/') || openedFolder.endsWith('\\')
            ? `${openedFolder}.gitignore`
            : `${openedFolder}/.gitignore`;
    };

    const handleSave = async () => {
        const path = getGitIgnorePath();
        try {
            await (window as any).electronAPI.writeFile(path, content);
            addToast({ type: 'success', message: '.gitignore atualizado com sucesso!' });
            await refreshGit();
            onClose();
        } catch (e) {
            console.error(e);
            addToast({ type: 'error', message: 'Erro ao salvar .gitignore' });
        }
    };

    if (!isOpen) return null;

    const hasChanges = content !== originalContent;

    // Calculate approximate height to force ScrollArea to scroll
    const lineCount = content.split('\n').length;
    // Base height 200px, plus ~24px per line. Ensure it fills container (minHeigh 100% handles that)
    // We use a style object on textarea to force it to be at least as tall as content
    const contentHeight = `${Math.max(450, lineCount * 24)}px`;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                background: isDark ? '#1f1f1f' : '#fff',
                width: '600px',
                height: '500px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px',
                    borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: isDark ? '#fff' : '#000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EyeOff size={18} />
                        Editar .gitignore
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDark ? '#aaa' : '#666'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.8rem', color: isDark ? '#aaa' : '#666', marginBottom: '4px' }}>
                        Edite os padrões de arquivos que devem ser ignorados pelo Git.
                    </div>
                    {isLoading ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#aaa' : '#666', fontSize: '0.9rem' }}>
                            Carregando...
                        </div>
                    ) : (
                        <div style={{ flex: 1, border: `1px solid ${isDark ? '#444' : '#ddd'}`, borderRadius: '8px', overflow: 'hidden' }}>
                            <ScrollArea
                                style={{ height: '100%' }}
                                thumbColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                                thumbHoverColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                            >
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="# Adicione padrões aqui, um por linha..."
                                    spellCheck={false}
                                    style={{
                                        width: '100%',
                                        minHeight: '100%',
                                        height: contentHeight,
                                        padding: '12px',
                                        background: isDark ? '#2d2d2d' : '#f5f5f5',
                                        border: 'none',
                                        color: isDark ? '#d4d4d4' : '#333',
                                        outline: 'none',
                                        resize: 'none',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden'
                                    }}
                                />
                            </ScrollArea>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px',
                    borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            background: 'transparent',
                            border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                            color: isDark ? '#aaa' : '#666',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        style={{
                            padding: '8px 20px',
                            background: hasChanges
                                ? (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)')
                                : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                            color: hasChanges
                                ? (isDark ? '#4fc3f7' : '#0070f3')
                                : (isDark ? '#666' : '#999'),
                            border: `1px solid ${hasChanges
                                ? (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')
                                : 'transparent'
                                }`,
                            borderRadius: '6px',
                            cursor: hasChanges ? 'pointer' : 'default',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Save size={16} />
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};
