import React from 'react';
import { Radio } from '../ui/Radio';

interface CommitSectionProps {
    isDark: boolean;
    commitMessage: string;
    setCommitMessage: (msg: string) => void;
    onCommit: () => void;
    stagedCount: number;
    isAmend: boolean;
    setIsAmend: (amend: boolean) => void;
}

export const CommitSection: React.FC<CommitSectionProps> = ({
    isDark, commitMessage, setCommitMessage, onCommit, stagedCount, isAmend, setIsAmend
}) => {
    // Softer blue, colorful but not "neon"
    const activeColor = isDark ? '#5da5db' : '#217dbb';

    return (
        <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#e5e7eb'}` }}>
            <div style={{ position: 'relative' }}>
                <textarea
                    placeholder="Mensagem de commit..."
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    style={{
                        width: '100%',
                        height: '70px',
                        background: isDark ? '#2d2d2d' : '#f9fafb',
                        border: `1px solid ${isDark ? '#3d3d3d' : '#d1d5db'}`,
                        borderRadius: '6px',
                        padding: '10px',
                        fontSize: '0.85rem',
                        color: isDark ? '#fff' : '#000',
                        resize: 'none',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onClick={() => setIsAmend(!isAmend)}
                >
                    <Radio
                        checked={isAmend}
                        onChange={() => setIsAmend(!isAmend)}
                        activeColor={activeColor}
                        isDark={isDark}
                        size={16}
                    />
                    <label
                        style={{
                            fontSize: '0.75rem',
                            color: isDark ? '#aaa' : '#666',
                            cursor: 'pointer',
                            userSelect: 'none',
                            fontWeight: 500
                        }}
                    >
                        Amend Last Commit
                    </label>
                </div>
                <button
                    onClick={onCommit}
                    disabled={!commitMessage || stagedCount === 0}
                    style={{
                        padding: '6px 16px',
                        background: (!commitMessage || stagedCount === 0)
                            ? (isDark ? 'rgba(79, 195, 247, 0.05)' : 'rgba(0, 112, 243, 0.05)')
                            : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                        color: (!commitMessage || stagedCount === 0)
                            ? (isDark ? '#444' : '#aaa')
                            : (isDark ? '#4fc3f7' : '#0070f3'),
                        border: `1px solid ${(!commitMessage || stagedCount === 0)
                            ? (isDark ? '#333' : '#eee')
                            : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                        borderRadius: '6px',
                        cursor: (!commitMessage || stagedCount === 0) ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700
                    }}
                >
                    Commit
                </button>
            </div>
        </div>
    );
};
