import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store/useStore';
import { Save, EyeOff } from 'lucide-react';
import { ScrollArea } from '../../../components/ui/ScrollArea';
import { Modal } from '../../../components/ui/Modal';

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
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [originalContent, setOriginalContent] = useState('');
    const [prevOpen, setPrevOpen] = useState(false);

    const getGitIgnorePath = useCallback(() => {
        if (!openedFolder) return '';
        return openedFolder.endsWith('/') || openedFolder.endsWith('\\')
            ? `${openedFolder}.gitignore`
            : `${openedFolder}/.gitignore`;
    }, [openedFolder]);

    const loadGitIgnore = useCallback(async () => {
        setIsLoading(true);
        const path = getGitIgnorePath();
        try {
            const fileContent = await window.electronAPI.readFile(path);
            setContent(fileContent);
            setOriginalContent(fileContent);
        } catch {
            // File likely doesn't exist
            setContent('');
            setOriginalContent('');
        } finally {
            setIsLoading(false);
        }
    }, [getGitIgnorePath]);

    useEffect(() => {
        if (isOpen && !prevOpen && openedFolder) {
            void loadGitIgnore();
        }
        setPrevOpen(isOpen);
    }, [isOpen, prevOpen, openedFolder, loadGitIgnore]);

    const handleSave = () => {
        const path = getGitIgnorePath();
        setIsLoading(true);
        void (async () => {
            try {
                await window.electronAPI.writeFile(path, content);
                addToast({ type: 'success', message: t('git.modals.ignore.success_toast') });
                await refreshGit();
                onClose();
            } catch (e) {
                console.error(e);
                addToast({ type: 'error', message: t('git.modals.ignore.error_toast') });
            } finally {
                setIsLoading(false);
            }
        })();
    };

    if (!isOpen) return null;

    const hasChanges = content !== originalContent;

    // Calculate approximate height to force ScrollArea to scroll
    const lineCount = content.split('\n').length;
    const contentHeight = `${Math.max(450, lineCount * 24)}px`;

    const footer = (
        <>
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
                {t('git.modals.ignore.cancel')}
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
                {t('git.modals.ignore.save')}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('git.modals.ignore.title')}
            isDark={isDark}
            headerIcon={<EyeOff size={18} />}
            footer={footer}
            maxWidth="650px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '450px' }}>
                <div style={{ fontSize: '0.8rem', color: isDark ? '#aaa' : '#666', marginBottom: '4px' }}>
                    {t('git.modals.ignore.desc')}
                </div>
                {isLoading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#aaa' : '#666', fontSize: '0.9rem' }}>
                        {t('git.terminal.progress.default')}
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
                                placeholder={t('git.modals.ignore.placeholder')}
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
        </Modal>
    );
};
