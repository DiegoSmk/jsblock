import { Radio } from '../ui/Radio';
import { COMMIT_TYPES } from '../../logic/ConventionalCommits';

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
            <div style={{ marginBottom: '16px', overflowX: 'auto', display: 'flex', gap: '8px', paddingBottom: '4px' }} className="no-scrollbar">
                {COMMIT_TYPES.map(type => (
                    <button
                        key={type.value}
                        onClick={() => handleTypeClick(type.value)}
                        title={type.description}
                        style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                            color: isDark ? '#ccc' : '#555',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                            outline: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
                            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
                            e.currentTarget.style.color = isDark ? '#fff' : '#000';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
                            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.color = isDark ? '#ccc' : '#555';
                        }}
                    >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: type.color, display: 'inline-block', opacity: 0.8 }}></span>
                        {type.label}
                    </button>
                ))}
            </div>

            <div style={{ position: 'relative' }}>
                <textarea
                    placeholder="Mensagem de commit..."
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
                            : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')
                            } `,
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
