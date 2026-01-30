import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { RefreshCw } from 'lucide-react';

// Sub-components
import './git/GitPanel.css';
import { GitInitView } from './git/GitInitView';
import { GitStatusView } from './git/GitStatusView';
import { GitTerminalView } from './git/GitTerminalView';
import { GitGraphView } from './git/GitGraphView';

// Reusing some helper logic for InitView props from previous implementation (simplified)
// Ideally GitInitView should also be connected to store to avoid prop drilling, 
// but for now we keep passing props if GitInitView expects them, OR we refactor GitInitView too.
// Checking GitInitView... it expects MANY props. 
// To keep this refactor safe, I will keep the local state for Init flow here or refactor GitInitView later.
// Actually, the refactor would be cleaner if I keep the Init logic here or move it.
// Given the prompt "Extract current GitPanel content...", I already moved Status logic.
// I will keep Init logic here to pass to GitInitView, as refactoring GitInitView wasn't explicitly requested and might be risky.

import { Briefcase, User, Sparkles, Smile } from 'lucide-react'; // Needed for Init View helpers

export const GitPanel: React.FC = () => {
    const {
        theme, git, refreshGit, fetchGitConfig,
        gitInit, openedFolder, gitProfiles,
        addGitProfile, removeGitProfile,
        setGitConfig
    } = useStore();

    const isDark = theme === 'dark';

    // Setup for Init Flow and Author Management (Leftover for InitView)
    const [isLoading, setIsLoading] = useState(!!openedFolder);
    const [isEditingAuthor, setIsEditingAuthor] = useState(false);
    const [authorBuffer, setAuthorBuffer] = useState({ name: '', email: '' });
    const [configLevel, setConfigLevel] = useState<'global' | 'local'>('local');
    const [showProfileManager, setShowProfileManager] = useState(false);
    const [newProfile, setNewProfile] = useState({ name: '', email: '', tag: 'personal' as 'work' | 'personal' | 'ai' | 'custom', customTagName: '' });

    useEffect(() => {
        if (openedFolder) {
            setIsLoading(true);
            Promise.all([refreshGit(), fetchGitConfig()]).finally(() => {
                setIsLoading(false);
            });
        }
    }, [openedFolder]);

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

    // Helper functions for InitView
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

    if (!openedFolder) {
        return (
            <div className="git-panel-container" style={{ alignItems: 'center', justifyContent: 'center', background: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#666' : '#999' }}>
                Abra uma pasta para usar o Git
            </div>
        );
    }

    if (isLoading && !git.isRepo) {
        return (
            <div className="git-panel-container" style={{ alignItems: 'center', justifyContent: 'center', background: isDark ? '#1a1a1a' : '#fff' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: isDark ? '#555' : '#ccc' }} />
            </div>
        );
    }

    if (!git.isRepo) {
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

    // Active View Router
    if (git.activeView === 'terminal') return <GitTerminalView />;
    if (git.activeView === 'graph') return <GitGraphView />;
    return <GitStatusView />;
};
