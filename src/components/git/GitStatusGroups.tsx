import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, RotateCcw, Eraser } from 'lucide-react';
import { SectionHeader, ActionToolbar } from './SharedComponents';
import { Tooltip } from '../Tooltip';
import { FileTreeView } from './FileTreeView';
import { GitStatusList } from './GitStatusList';
import { TreeToggle } from './TreeToggle';
import type { AppState, GitFileStatus } from '../../types/store';
import './GitStatus.css';
import './GitPanel.css';

interface GitStatusGroupsProps {
    isDark: boolean;
    staged: GitFileStatus[];
    unstaged: GitFileStatus[];
    gitUnstageAll: () => Promise<void>;
    gitStageAll: () => Promise<void>;
    gitDiscardAll: () => Promise<void>;
    gitUnstage: (path: string) => Promise<void>;
    gitStage: (path: string) => Promise<void>;
    gitDiscard: (path: string) => Promise<void>;
    gitClean: () => Promise<void>;
    gitIgnore: (pattern: string) => Promise<void>;
    setConfirmationModal: (config: AppState['confirmationModal']) => void;
}

export const GitStatusGroups: React.FC<GitStatusGroupsProps> = ({
    isDark, staged, unstaged,
    gitUnstageAll, gitStageAll, gitDiscardAll,
    gitUnstage, gitStage, gitDiscard,
    gitClean, gitIgnore, setConfirmationModal
}) => {
    const { t } = useTranslation();
    const [isTreeView, setIsTreeView] = useState(false);

    const untrackedCount = unstaged.filter(f => f.status === 'untracked' || f.workingTree === '?').length;

    const handleClean = () => {
        setConfirmationModal({
            isOpen: true,
            title: t('git.status.clean_confirm_title'),
            message: t('git.status.clean_confirm_desc', { count: untrackedCount }),
            confirmLabel: t('git.status.clean_confirm_button'),
            variant: 'danger',
            onConfirm: () => {
                void gitClean();
                setConfirmationModal(null);
            },
            onCancel: () => setConfirmationModal(null)
        });
    };

    const handleIgnore = (path: string) => {
        const ext = path.includes('.') ? `*.${path.split('.').pop()}` : null;
        setConfirmationModal({
            isOpen: true,
            title: t('git.status.ignore_confirm_title'),
            message: t('git.status.ignore_confirm_desc', { path }),
            confirmLabel: t('git.status.ignore_confirm_this'),
            cancelLabel: t('git.common.cancel'),
            discardLabel: ext ? t('git.status.ignore_confirm_all', { ext }) : undefined,
            variant: 'primary',
            discardVariant: 'secondary',
            onConfirm: () => { void gitIgnore(path); setConfirmationModal(null); },
            onDiscard: ext ? () => { void gitIgnore(ext); setConfirmationModal(null); } : undefined,
            onCancel: () => setConfirmationModal(null)
        });
    };

    return (
        <div className="git-status-groups">
            <SectionHeader
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="status-dot staged" />
                        <span>{t('git.status.staged')}</span>
                    </div>
                }
                count={staged.length}
                isOpen={true}
                isDark={isDark}
                rightElement={
                    <TreeToggle
                        count={staged.length}
                        isTreeView={isTreeView}
                        onToggle={() => setIsTreeView(!isTreeView)}
                    />
                }
            />
            {staged.length > 0 && (
                <ActionToolbar isDark={isDark}>
                    <Tooltip content={t('git.status.unstage_all_tooltip')} side="top">
                        <button onClick={() => { void gitUnstageAll(); }} className="git-button-base" style={{ border: `1px solid ${isDark ? '#444' : '#ddd'}`, color: isDark ? '#ddd' : '#555' }}>
                            <Minus size={14} /> <span className="btn-text">{t('git.status.unstage_all')}</span>
                        </button>
                    </Tooltip>
                </ActionToolbar>
            )}

            {isTreeView ? (
                staged.length > 0 && <FileTreeView files={staged} onUnstage={(path) => { void gitUnstage(path); }} isDark={isDark} />
            ) : (
                <GitStatusList
                    files={staged}
                    type="staged"
                    onUnstage={(path) => void gitUnstage(path)}
                />
            )}

            <SectionHeader
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="status-dot modified" />
                        <span>{t('git.status.modified')}</span>
                    </div>
                }
                count={unstaged.length}
                isOpen={true}
                isDark={isDark}
                rightElement={
                    <TreeToggle count={unstaged.length} isTreeView={isTreeView} onToggle={() => setIsTreeView(!isTreeView)} />
                }
            />
            {unstaged.length > 0 && (
                <ActionToolbar isDark={isDark}>
                    <Tooltip content={t('git.status.stage_all_tooltip')} side="top">
                        <button onClick={() => { void gitStageAll(); }} className="git-button-base" style={{ border: `1px solid ${isDark ? '#444' : '#ddd'}`, color: isDark ? '#ddd' : '#555' }}>
                            <Plus size={14} /> <span className="btn-text">{t('git.status.stage_all')}</span>
                        </button>
                    </Tooltip>
                    <Tooltip content={t('git.status.discard_all_tooltip')} side="top">
                        <button onClick={() => { void gitDiscardAll(); }} className="git-button-base" style={{ border: `1px solid ${isDark ? '#444' : '#ddd'}`, color: isDark ? '#f87171' : '#dc2626' }}>
                            <RotateCcw size={14} /> <span className="btn-text">{t('git.status.discard_all')}</span>
                        </button>
                    </Tooltip>
                    {untrackedCount > 0 && (
                        <Tooltip content={t('git.status.clean_untracked_tooltip')} side="top">
                            <button onClick={handleClean} className="git-button-base" style={{ border: `1px solid ${isDark ? '#444' : '#ddd'}`, color: isDark ? '#fbbf24' : '#d97706' }}>
                                <Eraser size={14} /> <span className="btn-text">{t('git.status.clean_untracked_label')}</span>
                            </button>
                        </Tooltip>
                    )}
                </ActionToolbar>
            )}

            {isTreeView ? (
                unstaged.length > 0 && <FileTreeView files={unstaged} onStage={(path) => { void gitStage(path); }} onDiscard={(path) => { void gitDiscard(path); }} isDark={isDark} />
            ) : (
                <GitStatusList
                    files={unstaged}
                    type="unstaged"
                    onStage={(path) => void gitStage(path)}
                    onDiscard={(path) => void gitDiscard(path)}
                    onIgnore={handleIgnore}
                />
            )}
        </div>
    );
};
