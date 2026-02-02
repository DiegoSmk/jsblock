import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, RotateCcw, List as ListIcon, Indent, Eraser, EyeOff } from 'lucide-react';
import { SectionHeader, ActionToolbar } from './SharedComponents';
import { Tooltip } from '../Tooltip';
import { FileTreeView } from './FileTreeView';
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

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
    gitUnstageAll: () => Promise<void>;
    gitStageAll: () => Promise<void>;
    gitDiscardAll: () => Promise<void>;
    gitUnstage: (path: string) => Promise<void>;
    gitStage: (path: string) => Promise<void>;
    gitDiscard: (path: string) => Promise<void>;
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
    >
        {isTreeView ? <ListIcon size={13} /> : <Indent size={13} />}
    </button>
);

type ListItem =
    | { type: 'header-staged' }
    | { type: 'toolbar-staged' }
    | { type: 'file-staged'; file: GitFile }
    | { type: 'empty-staged' }
    | { type: 'header-modified' }
    | { type: 'toolbar-modified' }
    | { type: 'file-modified'; file: GitFile }
    | { type: 'empty-modified' };

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
            onConfirm: async () => {
                await gitClean();
                setConfirmationModal(null);
            },
            onCancel: () => setConfirmationModal(null)
        });
    };

    const listItems = useMemo(() => {
        const items: ListItem[] = [];
        // Staged Section
        items.push({ type: 'header-staged' });
        if (staged.length > 0) items.push({ type: 'toolbar-staged' });
        if (staged.length > 0) {
            staged.forEach(f => items.push({ type: 'file-staged', file: f }));
        } else {
            items.push({ type: 'empty-staged' });
        }

        // Modified Section
        items.push({ type: 'header-modified' });
        if (unstaged.length > 0) items.push({ type: 'toolbar-modified' });
        if (unstaged.length > 0) {
            unstaged.forEach(f => items.push({ type: 'file-modified', file: f }));
        } else {
            items.push({ type: 'empty-modified' });
        }
        return items;
    }, [staged, unstaged]);

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const item = listItems[index];

        switch (item.type) {
            case 'header-staged':
                return (
                    <div style={style}>
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
                    </div>
                );
            case 'toolbar-staged':
                return (
                    <div style={style}>
                        <ActionToolbar isDark={isDark}>
                            <Tooltip content={t('git.status.unstage_all_tooltip')} side="top">
                                <button onClick={() => void gitUnstageAll()} className="git-button-base" style={{ border: `1px solid ${isDark ? '#444' : '#ddd'}`, color: isDark ? '#ddd' : '#555' }}>
                                    <Minus size={14} /> <span className="btn-text">{t('git.status.unstage_all')}</span>
                                </button>
                            </Tooltip>
                        </ActionToolbar>
                    </div>
                );
            case 'file-staged':
                return (
                    <div style={style}>
                        <div className="git-file-item">
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>
                                {item.file.index}
                            </div>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.file.path}</span>
                            <Tooltip content={t('git.status.action_unstage_tooltip')} side="top">
                                <button onClick={() => void gitUnstage(item.file.path)} className="git-file-action-button discard" style={{ color: '#f87171' }}>
                                    <Minus size={14} />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                );
            case 'empty-staged':
            case 'empty-modified':
                return (
                    <div style={style}>
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: isDark ? '#444' : '#ccc' }}>
                            {t('git.status.empty')}
                        </div>
                    </div>
                );
            case 'header-modified':
                return (
                    <div style={style}>
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
                                <TreeToggle count={unstaged.length} isTreeView={isTreeView} onToggle={() => setIsTreeView(!isTreeView)} isDark={isDark} t={t} />
                            }
                        />
                    </div>
                );
            case 'toolbar-modified':
                return (
                    <div style={style}>
                        <ActionToolbar isDark={isDark}>
                            <Tooltip content={t('git.status.stage_all_tooltip')} side="top">
                                <button onClick={() => void gitStageAll()} className="git-button-base" style={{ border: `1px solid ${isDark ? '#444' : '#ddd'}`, color: isDark ? '#ddd' : '#555' }}>
                                    <Plus size={14} /> <span className="btn-text">{t('git.status.stage_all')}</span>
                                </button>
                            </Tooltip>
                            <Tooltip content={t('git.status.discard_all_tooltip')} side="top">
                                <button onClick={() => void gitDiscardAll()} className="git-button-base" style={{ border: `1px solid ${isDark ? '#444' : '#ddd'}`, color: isDark ? '#f87171' : '#dc2626' }}>
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
                    </div>
                );
            case 'file-modified':
                return (
                    <div style={style}>
                        <div className="git-file-item">
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: item.file.status === 'untracked' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(96, 165, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: item.file.status === 'untracked' ? '#fbbf24' : '#60a5fa', fontWeight: 800 }}>
                                {item.file.workingTree === '?' ? 'U' : item.file.workingTree}
                            </div>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.file.path}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <Tooltip content={t('git.status.action_ignore_tooltip')} side="top">
                                    <button onClick={() => {
                                        const ext = item.file.path.includes('.') ? `*.${item.file.path.split('.').pop()}` : null;
                                        setConfirmationModal({
                                            isOpen: true,
                                            title: t('git.status.ignore_confirm_title'),
                                            message: t('git.status.ignore_confirm_desc', { path: item.file.path }),
                                            confirmLabel: t('git.status.ignore_confirm_this'),
                                            cancelLabel: t('git.common.cancel'),
                                            discardLabel: ext ? t('git.status.ignore_confirm_all', { ext }) : undefined,
                                            variant: 'primary',
                                            discardVariant: 'secondary',
                                            onConfirm: () => { void gitIgnore(item.file.path); setConfirmationModal(null); },
                                            onDiscard: ext ? () => { void gitIgnore(ext); setConfirmationModal(null); } : undefined,
                                            onCancel: () => setConfirmationModal(null)
                                        });
                                    }} className="git-file-action-button" style={{ color: isDark ? '#aaa' : '#666' }}>
                                        <EyeOff size={14} />
                                    </button>
                                </Tooltip>
                                <Tooltip content={t('git.status.action_discard_tooltip')} side="top">
                                    <button onClick={() => void gitDiscard(item.file.path)} className="git-file-action-button discard" style={{ color: '#f87171' }}>
                                        <RotateCcw size={14} />
                                    </button>
                                </Tooltip>
                                <Tooltip content={t('git.status.action_stage_tooltip')} side="top">
                                    <button onClick={() => void gitStage(item.file.path)} className="git-file-action-button stage" style={{ color: '#4ade80' }}>
                                        <Plus size={14} />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isTreeView) {
        // Legacy Tree View (not virtualized for now as per plan, but we could if we flatten tree)
        // For compliance, we should probably virtualize this too, but simpler to stick to list first.
        return (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto', flex: 1 }}>
                <SectionHeader
                    title={t('git.status.staged')} count={staged.length} isOpen={true} isDark={isDark}
                    rightElement={<TreeToggle count={staged.length} isTreeView={true} onToggle={() => setIsTreeView(false)} isDark={isDark} t={t} />}
                />
                {staged.length > 0 && <FileTreeView files={staged} onUnstage={gitUnstage} isDark={isDark} />}

                <SectionHeader
                    title={t('git.status.modified')} count={unstaged.length} isOpen={true} isDark={isDark}
                    rightElement={<TreeToggle count={unstaged.length} isTreeView={true} onToggle={() => setIsTreeView(false)} isDark={isDark} t={t} />}
                />
                {unstaged.length > 0 && <FileTreeView files={unstaged} onStage={gitStage} onDiscard={gitDiscard} isDark={isDark} />}
            </div>
        );
    }

    // Virtualized Flat List
    return (
        <div style={{ flex: 1, width: '100%', height: '100%' }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        width={width}
                        itemCount={listItems.length}
                        itemSize={36} // Approximate height
                        itemData={listItems}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
};
