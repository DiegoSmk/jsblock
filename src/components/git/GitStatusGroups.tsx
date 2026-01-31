import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, RotateCcw, List as ListIcon, Indent, Eraser, EyeOff } from 'lucide-react';
import { SectionHeader, ActionToolbar } from './SharedComponents';
import { Tooltip } from '../Tooltip';
import { FileTreeView } from './FileTreeView';

interface GitFile {
    path: string;
    index: string;
    workingTree: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged';
}

interface GitStatusGroupsProps {
    isDark: boolean;
    staged: GitFile[];
    unstaged: GitFile[];
    gitUnstageAll: () => void;
    gitStageAll: () => void;
    gitDiscardAll: () => void;
    gitUnstage: (path: string) => void;
    gitStage: (path: string) => void;
    gitDiscard: (path: string) => void;
    gitClean: () => Promise<void>;
    gitIgnore: (pattern: string) => Promise<void>;
    setConfirmationModal: (config: any) => void;
}

interface TreeToggleProps {
    count: number;
    isTreeView: boolean;
    onToggle: () => void;
    isDark: boolean;
    t: (key: string) => string;
}

const TreeToggle: React.FC<TreeToggleProps> = ({ count, isTreeView, onToggle, isDark, t }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            if (count > 0) onToggle();
        }}
        disabled={count === 0}
        title={count === 0 ? t('git.status.no_changes') : (isTreeView ? t('git.status.view_list') : t('git.status.view_tree'))}
        style={{
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: '4px',
            cursor: count === 0 ? 'not-allowed' : 'pointer',
            color: count === 0 ? (isDark ? '#444' : '#ccc') : (isDark ? '#aaa' : '#666'),
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: count === 0 ? 0.5 : 1,
            transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
            if (count > 0) {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.color = isDark ? '#fff' : '#000';
            }
        }}
        onMouseLeave={(e) => {
            if (count > 0) {
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                e.currentTarget.style.color = isDark ? '#aaa' : '#666';
            }
        }}
    >
        {isTreeView ? <ListIcon size={13} /> : <Indent size={13} />}
    </button>
);

export const GitStatusGroups: React.FC<GitStatusGroupsProps> = ({
    isDark, staged, unstaged,
    gitUnstageAll, gitStageAll, gitDiscardAll,
    gitUnstage, gitStage, gitDiscard,
    gitClean, gitIgnore, setConfirmationModal
}) => {
    const { t } = useTranslation();
    const [isTreeView, setIsTreeView] = useState(false);

    const untrackedCount = unstaged.filter(f => f.status === 'untracked' || f.workingTree === '?').length; // Check strictly for untracked

    const handleClean = () => {
        setConfirmationModal({
            isOpen: true,
            title: t('git.status.clean_confirm_title'),
            message: t('git.status.clean_confirm_desc', { count: untrackedCount }),
            confirmLabel: t('git.status.clean_confirm_button'),
            variant: 'danger',
            onConfirm: async () => {
                await gitClean();
                setConfirmationModal(null);
            },
            onCancel: () => setConfirmationModal(null)
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Staged Changes */}
            <div className="animate-entrance" style={{ animationDelay: '0.25s', opacity: 0 }}>
                <SectionHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', marginTop: '-1px', borderRadius: '3px', backgroundColor: isDark ? '#4ade80' : '#22c55e', opacity: 0.5 }} />
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
                            isDark={isDark}
                            t={t}
                        />
                    }
                />
                {staged.length > 0 && (
                    <ActionToolbar isDark={isDark}>
                        <Tooltip content={t('git.status.unstage_all_tooltip')} side="top">
                            <button
                                onClick={gitUnstageAll}
                                className="git-button-base"
                                style={{
                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                    color: isDark ? '#ddd' : '#555',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                                    e.currentTarget.style.borderColor = isDark ? '#666' : '#bbb';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd';
                                }}
                            >
                                <Minus size={14} />
                                <span className="btn-text">{t('git.status.unstage_all')}</span>
                            </button>
                        </Tooltip>
                    </ActionToolbar>
                )}
                <div style={{ padding: '4px 0' }}>
                    {isTreeView && staged.length > 0 ? (
                        <FileTreeView
                            files={staged}
                            onUnstage={gitUnstage}
                            isDark={isDark}
                        />
                    ) : (
                        <>
                            {staged.map((file, i) => (
                                <div key={i} className="git-file-item">
                                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>
                                        {file.index}
                                    </div>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</span>
                                    <Tooltip content={t('git.status.action_unstage_tooltip')} side="top">
                                        <button
                                            onClick={() => gitUnstage(file.path)}
                                            className="git-file-action-button discard"
                                            style={{ color: '#f87171' }}
                                        >
                                            <Minus size={14} />
                                        </button>
                                    </Tooltip>
                                </div>
                            ))}
                            {staged.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: isDark ? '#444' : '#ccc' }}>
                                    {t('git.status.empty')}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Unstaged Changes */}
            <div className="animate-entrance" style={{ animationDelay: '0.3s', opacity: 0 }}>
                <SectionHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', marginTop: '-1px', borderRadius: '3px', backgroundColor: isDark ? '#fbbf24' : '#f59e0b', opacity: 0.5 }} />
                            <span>{t('git.status.modified')}</span>
                        </div>
                    }
                    count={unstaged.length}
                    isOpen={true}
                    isDark={isDark}
                    rightElement={
                        <TreeToggle
                            count={unstaged.length}
                            isTreeView={isTreeView}
                            onToggle={() => setIsTreeView(!isTreeView)}
                            isDark={isDark}
                            t={t}
                        />
                    }
                />
                {unstaged.length > 0 && (
                    <ActionToolbar isDark={isDark}>
                        <Tooltip content={t('git.status.stage_all_tooltip')} side="top">
                            <button
                                onClick={gitStageAll}
                                className="git-button-base"
                                style={{
                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                    color: isDark ? '#ddd' : '#555',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
                                    e.currentTarget.style.borderColor = isDark ? '#666' : '#bbb';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd';
                                }}
                            >
                                <Plus size={14} />
                                <span className="btn-text">{t('git.status.stage_all')}</span>
                            </button>
                        </Tooltip>
                        <Tooltip content={t('git.status.discard_all_tooltip')} side="top">
                            <button
                                onClick={gitDiscardAll}
                                className="git-button-base"
                                style={{
                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                    color: isDark ? '#f87171' : '#dc2626',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isDark ? 'rgba(248, 113, 113, 0.08)' : 'rgba(220, 38, 38, 0.06)';
                                    e.currentTarget.style.borderColor = isDark ? '#f87171' : '#dc2626';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd';
                                }}
                            >
                                <RotateCcw size={14} />
                                <span className="btn-text">{t('git.status.discard_all')}</span>
                            </button>
                        </Tooltip>
                        {untrackedCount > 0 && (
                            <Tooltip content={t('git.status.clean_untracked_tooltip')} side="top">
                                <button
                                    onClick={handleClean}
                                    className="git-button-base"
                                    style={{
                                        border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                        color: isDark ? '#fbbf24' : '#d97706',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isDark ? 'rgba(251, 191, 36, 0.08)' : 'rgba(245, 158, 11, 0.06)';
                                        e.currentTarget.style.borderColor = isDark ? '#fbbf24' : '#d97706';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd';
                                    }}
                                >
                                    <Eraser size={14} />
                                    <span className="btn-text">{t('git.status.clean_untracked_label')}</span>
                                </button>
                            </Tooltip>
                        )}
                    </ActionToolbar>
                )}
                <div style={{ padding: '4px 0' }}>
                    {isTreeView && unstaged.length > 0 ? (
                        <FileTreeView
                            files={unstaged}
                            onStage={gitStage}
                            onDiscard={gitDiscard}
                            isDark={isDark}
                        />
                    ) : (
                        <>
                            {unstaged.map((file, i) => (
                                <div key={i} className="git-file-item">
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '4px',
                                        background: file.status === 'untracked' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        color: file.status === 'untracked' ? '#fbbf24' : '#60a5fa',
                                        fontWeight: 800
                                    }}>
                                        {file.workingTree === '?' ? 'U' : file.workingTree}
                                    </div>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <Tooltip content={t('git.status.action_ignore_tooltip')} side="top">
                                            <button
                                                onClick={() => {
                                                    const ext = file.path.includes('.') ? `*.${file.path.split('.').pop()}` : null;
                                                    setConfirmationModal({
                                                        isOpen: true,
                                                        title: t('git.status.ignore_confirm_title'),
                                                        message: t('git.status.ignore_confirm_desc', { path: file.path }),
                                                        confirmLabel: t('git.status.ignore_confirm_this'),
                                                        cancelLabel: t('git.common.cancel'),
                                                        discardLabel: ext ? t('git.status.ignore_confirm_all', { ext }) : undefined,
                                                        variant: 'primary',
                                                        discardVariant: 'secondary',
                                                        onConfirm: () => {
                                                            gitIgnore(file.path);
                                                            setConfirmationModal(null);
                                                        },
                                                        onDiscard: ext ? () => {
                                                            gitIgnore(ext);
                                                            setConfirmationModal(null);
                                                        } : undefined,
                                                        onCancel: () => setConfirmationModal(null)
                                                    });
                                                }}
                                                className="git-file-action-button"
                                                style={{ color: isDark ? '#aaa' : '#666' }}
                                            >
                                                <EyeOff size={14} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip content={t('git.status.action_discard_tooltip')} side="top">
                                            <button
                                                onClick={() => gitDiscard(file.path)}
                                                className="git-file-action-button discard"
                                                style={{ color: '#f87171' }}
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip content={t('git.status.action_stage_tooltip')} side="top">
                                            <button
                                                onClick={() => gitStage(file.path)}
                                                className="git-file-action-button stage"
                                                style={{ color: '#4ade80' }}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                            {unstaged.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: isDark ? '#444' : '#ccc' }}>
                                    {t('git.status.empty')}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
