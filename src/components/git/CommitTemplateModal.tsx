import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { X, Plus, Trash2, Check, FileText } from 'lucide-react';
import { ScrollArea } from '../ui/ScrollArea';

interface CommitTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (content: string) => void;
    isDark: boolean;
}

export const CommitTemplateModal: React.FC<CommitTemplateModalProps> = ({
    isOpen,
    onClose,
    onSelectTemplate,
    isDark
}) => {
    const { commitTemplates, addCommitTemplate, removeCommitTemplate } = useStore();
    const [view, setView] = useState<'list' | 'add'>('list');
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateContent, setNewTemplateContent] = useState('');
    const [isCreationExpanded, setIsCreationExpanded] = useState(false);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setView('list');
            setNewTemplateName('');
            setNewTemplateContent('');
            setIsCreationExpanded(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!newTemplateName.trim() || !newTemplateContent.trim()) return;
        addCommitTemplate({
            name: newTemplateName,
            content: newTemplateContent
        });
        setNewTemplateName('');
        setNewTemplateContent('');
        setView('list');
    };

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
                width: '500px',
                height: '400px',
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
                        <FileText size={18} />
                        Templates de Commit
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
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {view === 'list' ? (
                        <>
                            <ScrollArea style={{ flex: 1 }}>
                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {commitTemplates.length === 0 && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '40px 20px',
                                            color: isDark ? '#666' : '#999',
                                            fontSize: '0.9rem'
                                        }}>
                                            Nenhum template salvo.
                                            <br />
                                            Crie um para agilizar seus commits!
                                        </div>
                                    )}

                                    {commitTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '8px',
                                                background: isDark ? '#2d2d2d' : '#f5f5f5',
                                                border: `1px solid ${isDark ? '#333' : 'transparent'}`,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 600, color: isDark ? '#ddd' : '#333' }}>
                                                    {template.name}
                                                </span>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => removeCommitTemplate(template.id)}
                                                        title="Excluir"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: isDark ? '#ef4444' : '#dc2626',
                                                            opacity: 0.7
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <pre style={{
                                                margin: 0,
                                                fontSize: '0.8rem',
                                                fontFamily: 'monospace',
                                                color: isDark ? '#aaa' : '#666',
                                                background: isDark ? '#1a1a1a' : '#fff',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {template.content}
                                            </pre>
                                            <button
                                                onClick={() => {
                                                    onSelectTemplate(template.content);
                                                    onClose();
                                                }}
                                                style={{
                                                    background: isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.1)',
                                                    border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.2)'}`,
                                                    color: isDark ? '#4fc3f7' : '#0070f3',
                                                    padding: '6px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    marginTop: '4px'
                                                }}
                                            >
                                                <Check size={14} />
                                                Usar Template
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <div style={{ padding: '16px', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                                <button
                                    onClick={() => setView('add')}
                                    style={{
                                        width: '100%',
                                        padding: '8px 16px',
                                        background: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)',
                                        color: isDark ? '#4fc3f7' : '#0070f3',
                                        border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)'}`,
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Plus size={16} />
                                    Novo Template
                                </button>
                            </div>
                        </>
                    ) : (
                        <ScrollArea style={{ flex: 1 }}>
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: isDark ? '#aaa' : '#666', marginBottom: '8px' }}>
                                        Nome do Template (Identificador)
                                    </label>
                                    <input
                                        type="text"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        placeholder="Ex: Daily Update, Release Notes..."
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            background: isDark ? '#2d2d2d' : '#f5f5f5',
                                            border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                            color: isDark ? '#fff' : '#000',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div style={{ borderTop: `1px solid ${isDark ? '#333' : '#eee'}`, paddingTop: '16px' }}>
                                    {!isCreationExpanded ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: isDark ? '#aaa' : '#666' }}>
                                                Conteúdo do Template
                                            </label>
                                            <textarea
                                                value={newTemplateContent}
                                                onChange={(e) => setNewTemplateContent(e.target.value)}
                                                placeholder="Digite o modelo da mensagem..."
                                                style={{
                                                    width: '100%',
                                                    height: '100px',
                                                    padding: '12px',
                                                    borderRadius: '6px',
                                                    background: isDark ? '#2d2d2d' : '#f5f5f5',
                                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                                    color: isDark ? '#fff' : '#000',
                                                    outline: 'none',
                                                    resize: 'none',
                                                    fontFamily: 'monospace',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <button
                                                onClick={() => setIsCreationExpanded(true)}
                                                style={{
                                                    alignSelf: 'flex-start',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: isDark ? '#4fc3f7' : '#0070f3',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    padding: '0 4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                + Adicionar Descrição ao Template
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: isDark ? '#aaa' : '#666' }}>
                                                Título (Assunto)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Título do template..."
                                                value={newTemplateContent.split('\n\n')[0]}
                                                onChange={(e) => {
                                                    const parts = newTemplateContent.split('\n\n');
                                                    const body = parts.slice(1).join('\n\n');
                                                    setNewTemplateContent(`${e.target.value}${body ? '\n\n' + body : ''}`);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 10px',
                                                    background: isDark ? '#2d2d2d' : '#f5f5f5',
                                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    color: isDark ? '#fff' : '#000',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: isDark ? '#aaa' : '#666', marginTop: '4px' }}>
                                                Corpo (Descrição)
                                            </label>
                                            <textarea
                                                placeholder="Descrição detalhada..."
                                                value={newTemplateContent.split('\n\n').slice(1).join('\n\n')}
                                                onChange={(e) => {
                                                    const title = newTemplateContent.split('\n\n')[0] || '';
                                                    setNewTemplateContent(`${title}\n\n${e.target.value}`);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    height: '100px',
                                                    background: isDark ? '#2d2d2d' : '#f5f5f5',
                                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                                    borderRadius: '6px',
                                                    padding: '10px',
                                                    fontSize: '0.8rem',
                                                    color: isDark ? '#ccc' : '#333',
                                                    resize: 'none',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <button
                                                onClick={() => setIsCreationExpanded(false)}
                                                style={{
                                                    alignSelf: 'flex-start',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: isDark ? '#aaa' : '#666',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    padding: '0 4px'
                                                }}
                                            >
                                                - Recolher Descrição
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '16px' }}>
                                    <button
                                        onClick={() => setView('list')}
                                        style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            background: 'transparent',
                                            border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                            color: isDark ? '#aaa' : '#666',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                                        style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            background: (!newTemplateName.trim() || !newTemplateContent.trim())
                                                ? (isDark ? 'rgba(79, 195, 247, 0.05)' : 'rgba(0, 112, 243, 0.05)')
                                                : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                                            color: (!newTemplateName.trim() || !newTemplateContent.trim())
                                                ? (isDark ? '#444' : '#aaa')
                                                : (isDark ? '#4fc3f7' : '#0070f3'),
                                            border: `1px solid ${(!newTemplateName.trim() || !newTemplateContent.trim())
                                                ? (isDark ? '#333' : '#eee')
                                                : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')
                                                }`,
                                            borderRadius: '6px',
                                            cursor: (!newTemplateName.trim() || !newTemplateContent.trim()) ? 'not-allowed' : 'pointer',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            opacity: 1
                                        }}
                                    >
                                        Salvar Template
                                    </button>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
};
