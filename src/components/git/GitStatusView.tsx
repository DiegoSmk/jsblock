import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { GitStatusGroups } from './GitStatusGroups';
import { CommitSection } from './CommitSection';
import { AuthorModal } from './AuthorModal';
import { CommitTemplateModal } from './CommitTemplateModal';
import { ProductivityToolbar } from './ProductivityToolbar';
import { GitIgnoreModal } from './GitIgnoreModal';
import { GitStatusHeader } from './GitStatusHeader';
import { Briefcase, User, Sparkles, Smile } from 'lucide-react';
import './GitPanel.css';

export const GitStatusView: React.FC = () => {
    const {
        theme, git, refreshGit,
        gitStage, gitUnstage, gitCommit,
        gitStageAll, gitUnstageAll, gitDiscard, gitDiscardAll,
        addGitProfile, removeGitProfile,
        setGitConfig, gitProfiles, gitClean, gitIgnore, setConfirmationModal
    } = useStore();

    const isDark = theme === 'dark';
    const [commitMsg, setCommitMsg] = useState('');
    const [isAmend, setIsAmend] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showAuthorMenu, setShowAuthorMenu] = useState(false);

    // Template State
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    // Git Ignore State
    const [isIgnoreModalOpen, setIsIgnoreModalOpen] = useState(false);
    const [ignoredPatterns, setIgnoredPatterns] = useState<string[]>([]);

    const loadIgnorePatterns = async () => {
        if (!useStore.getState().openedFolder) return;
        const folder = useStore.getState().openedFolder!;
        const path = folder.endsWith('/') || folder.endsWith('\\')
            ? `${folder}.gitignore`
            : `${folder}/.gitignore`;

        try {
            const content = await window.electronAPI.readFile(path);
            const lines = content.split('\n')
                .map((l: string) => l.trim())
                .filter((l: string) => l && !l.startsWith('#'));
            setIgnoredPatterns(lines);
        } catch {
            setIgnoredPatterns([]);
        }
    };

    // Author Management State
    const [showAuthorConfigModal, setShowAuthorConfigModal] = useState(false);
    const [isEditingAuthor, setIsEditingAuthor] = useState(false);
    const [authorConfigBuffer, setAuthorConfigBuffer] = useState({ name: '', email: '', isGlobal: false });
    const [showProfileManager, setShowProfileManager] = useState(false);
    const [newProfile, setNewProfile] = useState({ name: '', email: '', tag: 'personal' as 'work' | 'personal' | 'ai' | 'custom', customTagName: '' });

    const handleRefresh = () => {
        setIsLoading(true);
        void (async () => {
            try {
                await refreshGit();
            } finally {
                setIsLoading(false);
            }
        })();
    };

    // Auto-fill message when Amend is checked
    React.useEffect(() => {
        if (isAmend && git.log.length > 0) {
            setCommitMsg(git.log[0].message);
        }
    }, [isAmend, git.log]);

    const handleCommit = () => {
        if (!commitMsg.trim()) return;
        setIsLoading(true);
        void (async () => {
            await gitCommit(commitMsg, isAmend);
            setCommitMsg('');
            setIsAmend(false);
            setIsLoading(false);
        })();
    };

    const handleSaveAuthorModal = () => {
        const hasValidData = authorConfigBuffer.name && authorConfigBuffer.email;
        if (hasValidData || (authorConfigBuffer.isGlobal && !isEditingAuthor)) {
            if (!authorConfigBuffer.isGlobal || isEditingAuthor) {
                void setGitConfig(
                    { name: authorConfigBuffer.name, email: authorConfigBuffer.email },
                    authorConfigBuffer.isGlobal
                );
            }
            setShowAuthorConfigModal(false);
            setAuthorConfigBuffer({ name: '', email: '', isGlobal: false });
            setIsEditingAuthor(false);
        }
    };

    const handleAddProfile = () => {
        if (!newProfile.name || !newProfile.email) return;
        void addGitProfile(newProfile);
        setNewProfile({ name: '', email: '', tag: 'personal', customTagName: '' });
    };

    const getTagIcon = (tag: string) => {
        switch (tag) {
            case 'work': return <Briefcase size={14} />;
            case 'personal': return <User size={14} />;
            case 'ai': return <Sparkles size={14} />;
            default: return <Smile size={14} />;
        }
    };

    const getTagColor = (tag: string, dark = isDark) => {
        switch (tag) {
            case 'work': return dark ? '#60a5fa' : '#0070f3';
            case 'personal': return dark ? '#10b981' : '#059669';
            case 'ai': return dark ? '#c084fc' : '#9333ea';
            default: return dark ? '#fbbf24' : '#f59e0b';
        }
    };

    const staged = git.changes.filter(f => f.index !== ' ' && f.index !== '?');
    const unstaged = git.changes.filter(f => f.workingTree !== ' ' || f.index === '?');

    return (
        <div
            className="git-panel-container animate-entrance"
            style={{
                background: isDark ? '#1a1a1a' : '#fff',
                color: isDark ? '#fff' : '#000',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: 0
            }}
        >
            <GitStatusHeader
                isDark={isDark}
                isLoading={isLoading}
                onRefresh={handleRefresh}
                onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
                onSelectTemplate={(content) => setCommitMsg(content)}
                onOpenIgnoreModal={() => setIsIgnoreModalOpen(true)}
                onLoadIgnorePatterns={() => void loadIgnorePatterns()}
                ignoredPatterns={ignoredPatterns}
                showAuthorMenu={showAuthorMenu}
                setShowAuthorMenu={setShowAuthorMenu}
                setAuthorConfigBuffer={setAuthorConfigBuffer}
                setShowAuthorConfigModal={setShowAuthorConfigModal}
            />

            <div className="animate-entrance" style={{ animationDelay: '0.1s', opacity: 0 }}>
                <CommitSection
                    isDark={isDark}
                    commitMessage={commitMsg}
                    setCommitMessage={setCommitMsg}
                    onCommit={handleCommit}
                    stagedCount={staged.length}
                    isAmend={isAmend}
                    setIsAmend={setIsAmend}
                />
            </div>

            <div className="animate-entrance" style={{ animationDelay: '0.15s', opacity: 0 }}>
                <ProductivityToolbar
                    isDark={isDark}
                />
            </div>

            <div className="animate-entrance" style={{ flex: 1, display: 'flex', flexDirection: 'column', animationDelay: '0.2s', opacity: 0, overflow: 'hidden' }}>
                <GitStatusGroups
                    isDark={isDark}
                    staged={staged}
                    unstaged={unstaged}
                    gitUnstageAll={gitUnstageAll}
                    gitStageAll={gitStageAll}
                    gitDiscardAll={gitDiscardAll}
                    gitUnstage={gitUnstage}
                    gitStage={gitStage}
                    gitDiscard={gitDiscard}
                    gitClean={gitClean}
                    gitIgnore={gitIgnore}
                    setConfirmationModal={setConfirmationModal}
                />
            </div>

            <AuthorModal
                isDark={isDark}
                isOpen={showAuthorConfigModal}
                onClose={() => {
                    setShowAuthorConfigModal(false);
                    setIsEditingAuthor(false);
                }}
                authorConfigBuffer={authorConfigBuffer}
                setAuthorConfigBuffer={setAuthorConfigBuffer}
                setIsEditingAuthor={setIsEditingAuthor}
                isEditingAuthor={isEditingAuthor}
                gitProfiles={gitProfiles}
                globalAuthor={git.globalAuthor}
                onSave={handleSaveAuthorModal}
                getTagColor={getTagColor}
                getTagIcon={getTagIcon}
                showProfileManager={showProfileManager}
                setShowProfileManager={setShowProfileManager}
                handleAddProfile={handleAddProfile}
                removeGitProfile={removeGitProfile}
                newProfile={newProfile}
                setNewProfile={setNewProfile}
            />

            <CommitTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                isDark={isDark}
                onSelectTemplate={(content) => setCommitMsg(content)}
            />

            <GitIgnoreModal
                isOpen={isIgnoreModalOpen}
                onClose={() => setIsIgnoreModalOpen(false)}
                isDark={isDark}
            />
        </div >
    );
};
