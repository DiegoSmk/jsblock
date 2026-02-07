import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, RotateCcw, EyeOff } from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';
import type { GitFileStatus } from '../types';
import './GitStatus.css';
import './GitPanel.css';

interface GitStatusListProps {
    files: GitFileStatus[];
    type: 'staged' | 'unstaged';
    onStage?: (path: string) => void;
    onUnstage?: (path: string) => void;
    onDiscard?: (path: string) => void;
    onIgnore?: (path: string) => void;
    onSelectDiff?: (path: string) => void;
}

export const GitStatusList: React.FC<GitStatusListProps> = ({
    files,
    type,
    onStage,
    onUnstage,
    onDiscard,
    onIgnore,
    onSelectDiff
}) => {
    const { t } = useTranslation();

    if (files.length === 0) {
        return (
            <div className="git-status-empty">
                {t('git.status.empty')}
            </div>
        );
    }

    return (
        <div className="git-status-list">
            {files.map((f) => (
                <div key={f.path} className="git-file-item">
                    {/* Badge */}
                    {type === 'staged' ? (
                        <div className="git-file-badge git-badge-staged">
                            {f.index}
                        </div>
                    ) : (
                        <div className={`git-file-badge ${f.status === 'untracked' ? 'git-badge-untracked' : 'git-badge-modified'}`}>
                            {f.workingTree === '?' ? 'U' : f.workingTree}
                        </div>
                    )}

                    <span
                        onClick={() => onSelectDiff && onSelectDiff(f.path)}
                        style={{ cursor: 'pointer', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={f.path}
                    >
                        {f.path}
                    </span>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {type === 'unstaged' && onIgnore && (
                            <Tooltip content={t('git.status.action_ignore_tooltip')} side="top">
                                <button onClick={() => onIgnore(f.path)} className="git-file-action-button" style={{ color: 'var(--text-muted)' }}>
                                    <EyeOff size={14} />
                                </button>
                            </Tooltip>
                        )}
                        {type === 'unstaged' && onDiscard && (
                            <Tooltip content={t('git.status.action_discard_tooltip')} side="top">
                                <button onClick={() => onDiscard(f.path)} className="git-file-action-button discard" style={{ color: '#f87171' }}>
                                    <RotateCcw size={14} />
                                </button>
                            </Tooltip>
                        )}
                        {type === 'unstaged' && onStage && (
                            <Tooltip content={t('git.status.action_stage_tooltip')} side="top">
                                <button onClick={() => onStage(f.path)} className="git-file-action-button stage" style={{ color: '#4ade80' }}>
                                    <Plus size={14} />
                                </button>
                            </Tooltip>
                        )}
                        {type === 'staged' && onUnstage && (
                            <Tooltip content={t('git.status.action_unstage_tooltip')} side="top">
                                <button onClick={() => onUnstage(f.path)} className="git-file-action-button discard" style={{ color: '#f87171' }}>
                                    <Minus size={14} />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
