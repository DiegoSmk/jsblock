import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio } from '../../../components/ui/Radio';
import { Tooltip } from '../../../components/ui/Tooltip';
import { COMMIT_TYPES } from '../logic/ConventionalCommits';

interface CommitSectionProps {
    isDark: boolean;
    commitMessage: string;
    setCommitMessage: (msg: string) => void;
    onCommit: () => void | Promise<void>;
    stagedCount: number;
    isAmend: boolean;
    setIsAmend: (amend: boolean) => void;
}


export const CommitSection: React.FC<CommitSectionProps> = ({
    isDark, commitMessage, setCommitMessage, onCommit, stagedCount, isAmend, setIsAmend
}) => {
    const { t } = useTranslation();
    // activeColor const removed - now using static emerald colors
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-expand if message comes with a body (e.g. from a template)
    const [prevCommitMessage, setPrevCommitMessage] = useState(commitMessage);
    if (commitMessage !== prevCommitMessage) {
        setPrevCommitMessage(commitMessage);
        if (commitMessage.includes('\n\n') && !isExpanded) {
            setIsExpanded(true);
        }
    }

    const handleTypeClick = (type: string) => {
        const prefix = `${type}: `;
        // If message is empty, just set it
        if (!commitMessage) {
            setCommitMessage(prefix);
            return;
        }

        // check if it already starts with a type
        const hasType = COMMIT_TYPES.some(t => commitMessage.startsWith(`${t.value}: `));
        if (hasType) {
            // Replace existing type
            const newMsg = commitMessage.replace(/^[a-z]+:\s/, prefix);
            setCommitMessage(newMsg);
        } else {
            // Prepend
            setCommitMessage(prefix + commitMessage);
        }
    };

    return (
        <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#e5e7eb'} ` }}>

            {/* Productivity Bar (Conventional Commits) */}
            <div style={{
                marginBottom: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                paddingBottom: '4px'
            }}>
                {COMMIT_TYPES.map(type => (
                    <Tooltip key={type.value} content={type.description} side="top">
                        <button
                            onClick={() => handleTypeClick(type.value)}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '5px',
                                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                                background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                                color: isDark ? '#999' : '#666',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                transition: 'all 0.15s ease',
                                outline: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                letterSpacing: '0.02em',
                                flex: '1 0 calc(33.33% - 12px)',
                                minWidth: '65px',
                                maxWidth: '120px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6';
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb';
                                e.currentTarget.style.color = isDark ? '#fff' : '#111';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff';
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                e.currentTarget.style.color = isDark ? '#999' : '#666';
                            }}
                        >
                            <span style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                background: type.color,
                                display: 'inline-block',
                                opacity: 0.6,
                                filter: 'saturate(0.5) contrast(0.9)',
                                boxShadow: `0 0 4px ${type.color}33`
                            }} />
                            {type.label}
                        </button>
                    </Tooltip>
                ))}
            </div>

            <div style={{ position: 'relative' }}>
                {!isExpanded ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                            placeholder={t('git.status.commit_placeholder')}
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            style={{
                                width: '100%',
                                height: '70px',
                                background: isDark ? '#2d2d2d' : '#f9fafb',
                                border: `1px solid ${isDark ? '#3d3d3d' : '#d1d5db'} `,
                                borderRadius: '6px',
                                padding: '10px',
                                fontSize: '0.85rem',
                                color: isDark ? '#fff' : '#000',
                                resize: 'none',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            onClick={() => setIsExpanded(true)}
                            style={{
                                alignSelf: 'flex-start',
                                background: 'transparent',
                                border: 'none',
                                color: isDark ? '#5da5db' : '#0070f3',
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
                        <input
                            type="text"
                            placeholder={t('git.modals.template.subject_placeholder')}
                            value={commitMessage.split('\n\n')[0] ?? ''} // First part is title
                            onChange={(e) => {
                                const parts = commitMessage.split('\n\n');
                                const body = parts.slice(1).join('\n\n');
                                setCommitMessage(`${e.target.value}${body ? '\n\n' + body : ''}`);
                            }}
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                background: isDark ? '#2d2d2d' : '#f9fafb',
                                border: `1px solid ${isDark ? '#3d3d3d' : '#d1d5db'}`,
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: isDark ? '#fff' : '#000',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        <textarea
                            placeholder={t('git.modals.template.body_placeholder')}
                            value={commitMessage.split('\n\n').slice(1).join('\n\n') ?? ''} // Rest is body
                            onChange={(e) => {
                                const title = commitMessage.split('\n\n')[0] ?? '';
                                setCommitMessage(`${title}\n\n${e.target.value}`);
                            }}
                            style={{
                                width: '100%',
                                height: '120px',
                                background: isDark ? '#2d2d2d' : '#f9fafb',
                                border: `1px solid ${isDark ? '#3d3d3d' : '#d1d5db'}`,
                                borderRadius: '6px',
                                padding: '10px',
                                fontSize: '0.85rem',
                                color: isDark ? '#ccc' : '#333',
                                resize: 'none',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            onClick={() => setIsExpanded(false)}
                            style={{
                                alignSelf: 'flex-start',
                                background: 'transparent',
                                border: 'none',
                                color: isDark ? '#5da5db' : '#0070f3',
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

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tooltip content={t('git.status.amend_tooltip')} side="top">
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        onClick={() => setIsAmend(!isAmend)}
                    >
                        <Radio
                            checked={isAmend}
                            onChange={() => setIsAmend(!isAmend)}
                            activeColor={isDark ? '#10b981' : '#059669'} // Emerald color
                            isDark={isDark}
                            size={16}
                        />
                        <label
                            style={{
                                fontSize: '0.75rem',
                                color: isDark ? '#888' : '#666',
                                cursor: 'pointer',
                                userSelect: 'none',
                                fontWeight: 500
                            }}
                        >
                            {t('git.status.amend_label')}
                        </label>
                    </div>
                </Tooltip>
                <button
                    onClick={() => { void onCommit(); }}
                    disabled={!commitMessage || stagedCount === 0}
                    style={{
                        padding: '6px 16px',
                        background: (!commitMessage || stagedCount === 0)
                            ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')
                            : (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'), // Emerald tint
                        color: (!commitMessage || stagedCount === 0)
                            ? (isDark ? '#555' : '#aaa')
                            : (isDark ? '#34d399' : '#059669'), // Emerald text
                        border: `1px solid ${(!commitMessage || stagedCount === 0)
                            ? (isDark ? '#333' : '#eee')
                            : (isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)')
                            } `,
                        borderRadius: '6px',
                        cursor: (!commitMessage || stagedCount === 0) ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700
                    }}
                >
                    {t('git.status.commit_button')}
                </button>
            </div>


        </div>
    );
};
