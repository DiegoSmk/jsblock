import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { Plus, Trash2, Check, FileText } from 'lucide-react';
import { ScrollArea } from '../ui/ScrollArea';
import { Modal } from '../ui/Modal';

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
    const { t } = useTranslation();
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

    const footer = view === 'list' ? (
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
            {t('git.modals.template.new')}
        </button>
    ) : (
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
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
                {t('git.common.cancel')}
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
                    fontSize: '0.75rem'
                }}
            >
                {t('git.modals.template.save_button')}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('git.modals.template.title')}
            isDark={isDark}
            headerIcon={<FileText size={18} />}
            footer={footer}
            maxWidth="500px"
        >
            <div style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
                {view === 'list' ? (
                    <ScrollArea style={{ flex: 1 }}>
                        <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {commitTemplates.length === 0 && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: isDark ? '#666' : '#999',
                                    fontSize: '0.9rem'
                                }}>
                                    {t('git.modals.template.empty_title')}
                                    <br />
                                    {t('git.modals.template.empty_subtitle')}
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
                                                title={t('git.common.delete')}
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
                                        {t('git.modals.template.use')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <ScrollArea style={{ flex: 1 }}>
                        <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: isDark ? '#aaa' : '#666', marginBottom: '8px' }}>
                                    {t('git.modals.template.name_label')}
                                </label>
                                <input
                                    type="text"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    placeholder={t('git.modals.template.name_placeholder')}
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
                                            {t('git.modals.template.content_label')}
                                        </label>
                                        <textarea
                                            value={newTemplateContent}
                                            onChange={(e) => setNewTemplateContent(e.target.value)}
                                            placeholder={t('git.status.commit_placeholder')}
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
                                            + {t('git.modals.template.add_description')}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: isDark ? '#aaa' : '#666' }}>
                                            {t('git.modals.template.subject_label')}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={t('git.modals.template.subject_placeholder')}
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
                                            {t('git.modals.template.body_label')}
                                        </label>
                                        <textarea
                                            placeholder={t('git.modals.template.body_placeholder')}
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
                                            - {t('git.modals.template.collapse_description')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                )}
            </div>
        </Modal>
    );
};
