import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '../ui/ScrollArea';
import { useStore } from '../../store/useStore';
import { RefreshCw, User, Check, Settings, Globe, Briefcase, Sparkles, Smile, FileText, ChevronDown } from 'lucide-react';
import { GitStatusGroups } from './GitStatusGroups';
import { CommitSection } from './CommitSection';
import { AuthorModal } from './AuthorModal';
import { CommitTemplateModal } from './CommitTemplateModal';
import { BranchSwitcher } from './BranchSwitcher';
import { ProductivityToolbar } from './ProductivityToolbar';
import './GitPanel.css'; // basic shared styles

export const GitStatusView: React.FC = () => {
    const {
        theme, git, refreshGit,
        gitStage, gitUnstage, gitCommit,
        gitStageAll, gitUnstageAll, gitDiscard, gitDiscardAll,
        addGitProfile, removeGitProfile,
        resetToGlobal, commitTemplates, setGitConfig, gitProfiles
    } = useStore();

    const isDark = theme === 'dark';
    const [commitMsg, setCommitMsg] = useState('');
    const [isAmend, setIsAmend] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showAuthorMenu, setShowAuthorMenu] = useState(false);
    const authorMenuRef = useRef<HTMLDivElement>(null);

    // Template State
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const templateDropdownRef = useRef<HTMLDivElement>(null);

    // Handle click outside for author menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (authorMenuRef.current && !authorMenuRef.current.contains(event.target as Node)) {
                setShowAuthorMenu(false);
            }
            if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
                setIsTemplateDropdownOpen(false);
            }
        };

        if (showAuthorMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAuthorMenu, isTemplateDropdownOpen]);

    // Author Management State
    const [showAuthorConfigModal, setShowAuthorConfigModal] = useState(false);
    const [isEditingAuthor, setIsEditingAuthor] = useState(false);
    const [authorConfigBuffer, setAuthorConfigBuffer] = useState({ name: '', email: '', isGlobal: false });
    const [showProfileManager, setShowProfileManager] = useState(false);
    const [newProfile, setNewProfile] = useState({ name: '', email: '', tag: 'personal' as 'work' | 'personal' | 'ai' | 'custom', customTagName: '' });

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            await refreshGit();
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fill message when Amend is checked
    React.useEffect(() => {
        if (isAmend && git.log.length > 0) {
            setCommitMsg(git.log[0].message);
        } else if (!isAmend) {
            // Optional: clear message or keep it? user might have been typing
        }
    }, [isAmend, git.log]);

    const handleCommit = async () => {
        if (!commitMsg.trim()) return;
        setIsLoading(true);
        await gitCommit(commitMsg, isAmend);
        setCommitMsg('');
        setIsAmend(false);
        setIsLoading(false);
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

    const handleAddProfile = () => {
        if (!newProfile.name || !newProfile.email) return;
        addGitProfile(newProfile);
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
            {/* Header */}
            <div style={{
                padding: '12px 20px',
                borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <BranchSwitcher isDark={isDark} />

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Templates Button & Dropdown */}
                    <div style={{ position: 'relative' }} ref={templateDropdownRef}>
                        <button
                            onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                            style={{
                                background: isDark ? '#2d2d2d' : '#f5f5f5',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                color: isDark ? '#aaa' : '#666',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = isDark ? '#fff' : '#000';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = isDark ? '#aaa' : '#666';
                            }}
                            title="Modelos de mensagem de commit"
                        >
                            <FileText size={14} />
                            <ChevronDown size={12} style={{ transform: isTemplateDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>

                        {isTemplateDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                background: isDark ? '#1a1a1a' : '#fff',
                                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                borderRadius: '8px',
                                minWidth: '240px',
                                boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
                                zIndex: 1000,
                                overflow: 'hidden',
                                transformOrigin: 'top right'
                            }}>
                                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#666' : '#999', textTransform: 'uppercase' }}>
                                    SEUS TEMPLATES
                                </div>

                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {commitTemplates.length === 0 ? (
                                        <div style={{ padding: '12px', fontSize: '0.75rem', color: isDark ? '#666' : '#999', fontStyle: 'italic', textAlign: 'center' }}>
                                            Nenhum template salvo
                                        </div>
                                    ) : (
                                        commitTemplates.map((template) => (
                                            <div
                                                key={template.id}
                                                onClick={() => {
                                                    setCommitMsg(template.content);
                                                    setIsTemplateDropdownOpen(false);
                                                }}
                                                style={{
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '0.8rem',
                                                    color: isDark ? '#ddd' : '#333',
                                                    borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#f5f5f5'}`
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <FileText size={14} color={isDark ? '#4fc3f7' : '#0070f3'} />
                                                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div style={{ padding: '8px', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, background: isDark ? '#222' : '#f9fafb' }}>
                                    <button
                                        onClick={() => {
                                            setIsTemplateModalOpen(true);
                                            setIsTemplateDropdownOpen(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: isDark ? '#333' : '#e5e7eb',
                                            color: isDark ? '#ccc' : '#666',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#444' : '#d1d5db'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = isDark ? '#333' : '#e5e7eb'}
                                    >
                                        <Settings size={12} />
                                        Gerenciar Templates
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        style={{
                            background: isDark ? '#2d2d2d' : '#f5f5f5',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDark ? '#aaa' : '#666',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            outline: 'none'
                        }}
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>

                    {/* Author Avatar Menu */}
                    <div style={{ position: 'relative' }} ref={authorMenuRef}>
                        <div
                            onClick={() => setShowAuthorMenu(!showAuthorMenu)}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: isDark ? '#2d2d2d' : '#f5f5f5',
                                border: `1px solid ${isDark ? '#444' : '#e5e7eb'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: isDark ? '#aaa' : '#666'
                            }}
                            title={git.projectAuthor?.name || git.globalAuthor?.name || 'Autor não configurado'}
                        >
                            <User size={16} />
                        </div>

                        {showAuthorMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                background: isDark ? '#1a1a1a' : '#fff',
                                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                borderRadius: '8px',
                                minWidth: '280px',
                                boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                zIndex: 1000,
                                overflow: 'hidden'
                            }}>
                                {/* Current Author */}
                                <div style={{ padding: '12px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                                    <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Autor Atual
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '6px',
                                            background: isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isDark ? '#4fc3f7' : '#0070f3'
                                        }}>
                                            <User size={14} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {git.projectAuthor?.name || git.globalAuthor?.name || 'Não configurado'}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {git.projectAuthor?.email || git.globalAuthor?.email || ''}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.65rem',
                                            background: git.projectAuthor
                                                ? 'rgba(79, 195, 247, 0.1)'
                                                : 'rgba(74, 222, 128, 0.1)',
                                            color: git.projectAuthor
                                                ? (isDark ? '#4fc3f7' : '#0070f3')
                                                : '#10b981',
                                            padding: '3px 6px',
                                            borderRadius: '4px',
                                            border: git.projectAuthor
                                                ? `1px solid ${isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.15)'}`
                                                : '1px solid rgba(74, 222, 128, 0.2)'
                                        }}>
                                            {git.projectAuthor ? 'Local' : 'Global'}
                                        </div>
                                    </div>
                                </div>

                                {/* Saved Profiles */}
                                <div style={{ padding: '8px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                                    <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', padding: '4px 8px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Trocar para
                                    </div>

                                    {/* Global Author Option */}
                                    {git.globalAuthor && git.projectAuthor && (
                                        <div
                                            onClick={async () => {
                                                await resetToGlobal();
                                                setShowAuthorMenu(false);
                                            }}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '0.8rem'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <span style={{ color: '#10b981', flexShrink: 0 }}>
                                                <Globe size={14} />
                                            </span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {git.globalAuthor.name}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {git.globalAuthor.email} <span style={{ opacity: 0.7 }}>(Global)</span>
                                                </div>
                                            </div>
                                            {!git.projectAuthor && (
                                                <Check size={14} color="#10b981" />
                                            )}
                                        </div>
                                    )}

                                    {gitProfiles
                                        .filter(profile => {
                                            const current = git.projectAuthor || git.globalAuthor;
                                            if (!current) return true;
                                            return !(profile.email === current.email && profile.name === current.name);
                                        })
                                        .map(profile => (
                                            <div
                                                key={profile.id}
                                                onClick={async () => {
                                                    await setGitConfig({ name: profile.name, email: profile.email }, false);
                                                    setShowAuthorMenu(false);
                                                }}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '0.8rem'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: getTagColor(profile.tag), flexShrink: 0 }}>
                                                    {getTagIcon(profile.tag)}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {profile.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {profile.email}
                                                    </div>
                                                </div>
                                                {git.projectAuthor?.email === profile.email && git.projectAuthor?.name === profile.name && (
                                                    <Check size={14} color="#10b981" />
                                                )}
                                            </div>
                                        ))}
                                </div>

                                {/* Actions */}
                                <div style={{ padding: '8px' }}>
                                    <div
                                        onClick={() => {
                                            setShowAuthorMenu(false);
                                            setAuthorConfigBuffer({ name: '', email: '', isGlobal: false });
                                            setShowAuthorConfigModal(true);
                                        }}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.8rem',
                                            color: isDark ? '#4fc3f7' : '#0070f3'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <Settings size={14} />
                                        Configurar Novo Autor
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CommitSection
                isDark={isDark}
                commitMessage={commitMsg}
                setCommitMessage={setCommitMsg}
                onCommit={handleCommit}
                stagedCount={staged.length}
                isAmend={isAmend}
                setIsAmend={setIsAmend}
            />

            <ProductivityToolbar
                isDark={isDark}
            />

            <ScrollArea
                style={{ flex: 1 }}
                autoHide
                thumbColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                thumbHoverColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
            >
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
            </ScrollArea>

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
        </div>
    );
};
