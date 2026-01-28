import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { RefreshCw, Briefcase, User, Sparkles, Smile } from 'lucide-react';

// Sub-components
import './git/GitPanel.css';
import { GitStatusGroups } from './git/GitStatusGroups';
import { CommitSection } from './git/CommitSection';
import { CommitHistory } from './git/CommitHistory';
import { AuthorModal } from './git/AuthorModal';
import { GitInitView } from './git/GitInitView';

export const GitPanel: React.FC = () => {
    const {
        theme, git, refreshGit, fetchGitConfig,
        gitStage, gitUnstage, gitCommit, gitInit,
        setGitConfig, openedFolder, gitProfiles,
        addGitProfile, removeGitProfile,
        gitStageAll, gitUnstageAll, gitDiscard, gitDiscardAll
    } = useStore();

    const isDark = theme === 'dark';
    const [commitMsg, setCommitMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(true);

    // Setup for Init Flow and Author Management
    const [isEditingAuthor, setIsEditingAuthor] = useState(false);
    const [authorBuffer, setAuthorBuffer] = useState({ name: '', email: '' });
    const [configLevel, setConfigLevel] = useState<'global' | 'local'>('local');
    const [showProfileManager, setShowProfileManager] = useState(false);
    const [showAuthorConfigModal, setShowAuthorConfigModal] = useState(false);
    const [authorConfigBuffer, setAuthorConfigBuffer] = useState({ name: '', email: '', isGlobal: false });
    const [newProfile, setNewProfile] = useState({ name: '', email: '', tag: 'personal' as 'work' | 'personal' | 'ai' | 'custom', customTagName: '' });

    useEffect(() => {
        if (openedFolder) {
            setIsLoading(true);
            Promise.all([refreshGit(), fetchGitConfig()]).finally(() => {
                setIsLoading(false);
            });
        }
    }, [openedFolder]);

    const handleCommit = async () => {
        if (!commitMsg.trim()) return;
        setIsLoading(true);
        await gitCommit(commitMsg);
        setCommitMsg('');
        setIsLoading(false);
    };

    const startInit = async () => {
        setIsLoading(true);
        if (configLevel === 'local' && authorBuffer.name && authorBuffer.email) {
            await gitInit(authorBuffer, false);
        } else if (configLevel === 'global' && git.globalAuthor) {
            await gitInit();
        }
        setIsLoading(false);
    };

    const handleSaveGlobalConfig = async () => {
        await setGitConfig(authorBuffer, true);
        setIsEditingAuthor(false);
    };

    const handleAddProfile = () => {
        if (!newProfile.name || !newProfile.email) return;
        addGitProfile(newProfile);
        setNewProfile({ name: '', email: '', tag: 'personal', customTagName: '' });
    };

    const handleSaveAuthorModal = async () => {
        const hasValidData = authorConfigBuffer.name && authorConfigBuffer.email;
        if (hasValidData || (authorConfigBuffer.isGlobal && !isEditingAuthor)) {
            if (!authorConfigBuffer.isGlobal || isEditingAuthor) {
                await setGitConfig(
                    { name: authorConfigBuffer.name, email: authorConfigBuffer.email },
                    authorConfigBuffer.isGlobal
                );
            }
            setShowAuthorConfigModal(false);
            setAuthorConfigBuffer({ name: '', email: '', isGlobal: false });
            setIsEditingAuthor(false);
        }
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

    if (!git.isRepo || !openedFolder) {
        return (
            <GitInitView
                isDark={isDark}
                openedFolder={openedFolder}
                isLoading={isLoading}
                git={git}
                configLevel={configLevel}
                setConfigLevel={setConfigLevel}
                authorBuffer={authorBuffer}
                setAuthorBuffer={setAuthorBuffer}
                isEditingAuthor={isEditingAuthor}
                setIsEditingAuthor={setIsEditingAuthor}
                gitProfiles={gitProfiles}
                showProfileManager={showProfileManager}
                setShowProfileManager={setShowProfileManager}
                startInit={startInit}
                handleSaveGlobalConfig={handleSaveGlobalConfig}
                handleAddProfile={handleAddProfile}
                removeGitProfile={removeGitProfile}
                getTagIcon={getTagIcon}
                getTagColor={getTagColor}
                newProfile={newProfile}
                setNewProfile={setNewProfile}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="git-panel-container" style={{ alignItems: 'center', justifyContent: 'center', background: isDark ? '#1a1a1a' : '#fff' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: isDark ? '#555' : '#ccc' }} />
            </div>
        );
    }

    const staged = git.changes.filter(f => f.status === 'staged');
    const unstaged = git.changes.filter(f => f.status !== 'staged');

    return (
        <div className="git-panel-container" style={{ background: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000' }}>
            <CommitSection
                isDark={isDark}
                commitMessage={commitMsg}
                setCommitMessage={setCommitMsg}
                currentAuthor={git.projectAuthor || git.globalAuthor}
                setShowAuthorModal={setShowAuthorConfigModal}
                onCommit={handleCommit}
                stagedCount={staged.length}
            />

            <div style={{ flex: 1, overflowY: 'auto' }}>
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
                />

                <CommitHistory
                    isDark={isDark}
                    logs={git.log}
                    isOpen={showHistory}
                    onToggle={() => setShowHistory(!showHistory)}
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
                isEditingAuthor={isEditingAuthor}
                setIsEditingAuthor={setIsEditingAuthor}
                gitProfiles={gitProfiles}
                globalAuthor={git.globalAuthor}
                onSave={handleSaveAuthorModal}
                getTagColor={getTagColor}
                getTagIcon={getTagIcon}
            />
        </div>
    );
};
