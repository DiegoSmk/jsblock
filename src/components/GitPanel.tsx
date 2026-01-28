import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
    RefreshCw, Plus, Minus, GitCommit, GitBranch,
    ChevronRight, ChevronDown, AlertCircle, User,
    Mail, Settings, Check, Edit3, ShieldAlert, X, Briefcase, Smile, Sparkles, Globe, RotateCcw
} from 'lucide-react';

export const GitPanel: React.FC = () => {
    const {
        theme, git, refreshGit, fetchGitConfig,
        gitStage, gitUnstage, gitCommit, gitInit,
        setGitConfig, openedFolder, gitProfiles,
        addGitProfile, removeGitProfile, resetToGlobal,
        gitStageAll, gitUnstageAll, gitDiscard, gitDiscardAll
    } = useStore();

    const isDark = theme === 'dark';
    const [commitMsg, setCommitMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(true);

    // Setup for Init Flow
    const [isEditingAuthor, setIsEditingAuthor] = useState(false);
    const [authorBuffer, setAuthorBuffer] = useState({ name: '', email: '' });
    const [configLevel, setConfigLevel] = useState<'global' | 'local'>('local');
    const [showProfileManager, setShowProfileManager] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [showAuthorMenu, setShowAuthorMenu] = useState(false);
    const [showAuthorConfigModal, setShowAuthorConfigModal] = useState(false);
    const [authorConfigBuffer, setAuthorConfigBuffer] = useState({ name: '', email: '', isGlobal: false });
    const [newProfile, setNewProfile] = useState({ name: '', email: '', tag: 'personal' as 'work' | 'personal' | 'ai' | 'custom', customTagName: '' });

    useEffect(() => {
        if (openedFolder) {
            setIsLoading(true);
            // Promise.all to ensure both run and we finish loading only after both
            Promise.all([refreshGit(), fetchGitConfig()]).finally(() => {
                setIsLoading(false);
            });
        }
    }, [openedFolder]);

    const handleRefresh = async () => {
        setIsLoading(true);
        await refreshGit();
        setIsLoading(false);
    };

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
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#555' : '#ccc' }}>
                Abra uma pasta para usar o Git
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#555' : '#ccc',
                background: isDark ? '#1a1a1a' : '#fff'
            }}>
                <RefreshCw size={24} className="animate-spin" />
            </div>
        );
    }

    if (!git.isRepo) {
        const hasGlobal = !!(git.globalAuthor?.name || git.globalAuthor?.email);

        return (
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: isDark ? '#1a1a1a' : '#fff',
                color: isDark ? '#fff' : '#000'
            }}>
                {/* Header */}
                <div style={{
                    padding: '12px 20px',
                    borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <GitBranch size={18} color={isDark ? '#4fc3f7' : '#0070f3'} />
                    <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Controle de Versão</div>
                        <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>Repositório não inicializado</div>
                    </div>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    <div style={{
                        maxWidth: '500px',
                        margin: '0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        {/* Info Card */}
                        <div style={{
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            borderRadius: '8px',
                            padding: '14px 16px',
                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <AlertCircle size={20} color={isDark ? '#fbbf24' : '#f59e0b'} style={{ flexShrink: 0 }} />
                            <p style={{
                                fontSize: '0.85rem',
                                color: isDark ? '#888' : '#666',
                                lineHeight: 1.5,
                                margin: 0
                            }}>
                                Esta pasta ainda não está sendo rastreada pelo Git. Inicialize um repositório para começar a versionar suas alterações.
                            </p>
                        </div>

                        {/* Author Section */}
                        <div style={{
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            borderRadius: '8px',
                            padding: '16px',
                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: isDark ? '#888' : '#666',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    <User size={14} />
                                    Autor dos Commits
                                </div>
                            </div>

                            {/* Config Level Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Onde salvar?
                                </div>

                                {/* Local Option */}
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    background: configLevel === 'local' ? (isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(0, 112, 243, 0.05)') : 'transparent',
                                    border: `1px solid ${configLevel === 'local' ? (isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.15)') : 'transparent'}`
                                }}>
                                    <input
                                        type="radio"
                                        checked={configLevel === 'local'}
                                        onChange={() => {
                                            setConfigLevel('local');
                                            setAuthorBuffer({ name: '', email: '' });
                                        }}
                                        style={{ marginTop: '2px', flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>Somente neste projeto</div>
                                        <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>Configuração local do repositório</div>
                                    </div>
                                </label>

                                {/* Global Option */}
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    background: configLevel === 'global' ? (isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(0, 112, 243, 0.05)') : 'transparent',
                                    border: `1px solid ${configLevel === 'global' ? (isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.15)') : 'transparent'}`
                                }}>
                                    <input
                                        type="radio"
                                        checked={configLevel === 'global'}
                                        onChange={() => {
                                            setConfigLevel('global');
                                            if (hasGlobal) {
                                                setAuthorBuffer(git.globalAuthor!);
                                            }
                                        }}
                                        style={{ marginTop: '2px', flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>Todos os meus projetos</div>
                                        <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>Configuração global do Git</div>
                                    </div>
                                </label>
                            </div>

                            {/* Content based on selection */}
                            {configLevel === 'local' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Quick Select from Profiles */}
                                    {gitProfiles.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', fontWeight: 600, marginBottom: '8px' }}>
                                                Perfis Salvos
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {gitProfiles.map(profile => (
                                                    <button
                                                        key={profile.id}
                                                        onClick={() => setAuthorBuffer({ name: profile.name, email: profile.email })}
                                                        style={{
                                                            padding: '6px 10px',
                                                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                                            border: `1px solid ${isDark ? '#444' : '#e5e7eb'}`,
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.75rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            color: getTagColor(profile.tag)
                                                        }}
                                                    >
                                                        {getTagIcon(profile.tag)}
                                                        {profile.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual Input */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            placeholder="Nome"
                                            value={authorBuffer.name}
                                            onChange={(e) => setAuthorBuffer({ ...authorBuffer, name: e.target.value })}
                                            style={{
                                                flex: 1,
                                                padding: '8px 10px',
                                                borderRadius: '6px',
                                                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                background: isDark ? '#2d2d2d' : '#fff',
                                                color: isDark ? '#fff' : '#000',
                                                fontSize: '0.85rem',
                                                outline: 'none'
                                            }}
                                        />
                                        <input
                                            placeholder="Email"
                                            value={authorBuffer.email}
                                            onChange={(e) => setAuthorBuffer({ ...authorBuffer, email: e.target.value })}
                                            style={{
                                                flex: 1,
                                                padding: '8px 10px',
                                                borderRadius: '6px',
                                                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                background: isDark ? '#2d2d2d' : '#fff',
                                                color: isDark ? '#fff' : '#000',
                                                fontSize: '0.85rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Manage Profiles Button */}
                                    <button
                                        onClick={() => setShowProfileManager(!showProfileManager)}
                                        style={{
                                            padding: '8px',
                                            background: 'transparent',
                                            color: isDark ? '#888' : '#666',
                                            border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <Settings size={14} />
                                        Gerenciar Perfis
                                    </button>

                                    {/* Profile Manager */}
                                    {showProfileManager && (
                                        <div style={{
                                            padding: '12px',
                                            background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                                            borderRadius: '6px',
                                            border: `1px solid ${isDark ? '#444' : '#e5e7eb'}`
                                        }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '10px', color: isDark ? '#aaa' : '#666' }}>
                                                Adicionar Novo Perfil
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <input
                                                    placeholder="Nome"
                                                    value={newProfile.name}
                                                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                                                    style={{
                                                        padding: '6px 8px',
                                                        borderRadius: '4px',
                                                        border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                        background: isDark ? '#1a1a1a' : '#fff',
                                                        color: isDark ? '#fff' : '#000',
                                                        fontSize: '0.8rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                                <input
                                                    placeholder="Email"
                                                    value={newProfile.email}
                                                    onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                                                    style={{
                                                        padding: '6px 8px',
                                                        borderRadius: '4px',
                                                        border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                        background: isDark ? '#1a1a1a' : '#fff',
                                                        color: isDark ? '#fff' : '#000',
                                                        fontSize: '0.8rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        value={newProfile.tag}
                                                        onChange={(e) => setNewProfile({ ...newProfile, tag: e.target.value as any })}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 8px',
                                                            paddingRight: '28px',
                                                            borderRadius: '4px',
                                                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                            background: isDark ? '#1a1a1a' : '#fff',
                                                            color: isDark ? '#fff' : '#000',
                                                            fontSize: '0.8rem',
                                                            appearance: 'none',
                                                            cursor: 'pointer',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        <option value="personal">Pessoal</option>
                                                        <option value="work">Trabalho</option>
                                                        <option value="ai">AI</option>
                                                        <option value="custom">Personalizado</option>
                                                    </select>
                                                    <ChevronDown size={14} style={{
                                                        position: 'absolute',
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        pointerEvents: 'none',
                                                        color: isDark ? '#666' : '#999'
                                                    }} />
                                                </div>
                                                {newProfile.tag === 'custom' && (
                                                    <input
                                                        placeholder="Nome da tag personalizada"
                                                        value={newProfile.customTagName}
                                                        onChange={(e) => setNewProfile({ ...newProfile, customTagName: e.target.value })}
                                                        style={{
                                                            padding: '6px 8px',
                                                            borderRadius: '4px',
                                                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                            background: isDark ? '#1a1a1a' : '#fff',
                                                            color: isDark ? '#fff' : '#000',
                                                            fontSize: '0.8rem',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                )}
                                                <button
                                                    onClick={handleAddProfile}
                                                    disabled={!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)}
                                                    style={{
                                                        padding: '6px',
                                                        background: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? (isDark ? '#333' : '#eee') : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                                                        color: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? (isDark ? '#666' : '#999') : (isDark ? '#4fc3f7' : '#0070f3'),
                                                        border: `1px solid ${(!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? (isDark ? '#444' : '#ddd') : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                                                        borderRadius: '4px',
                                                        cursor: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    Adicionar Perfil
                                                </button>
                                            </div>

                                            {/* Existing Profiles */}
                                            {gitProfiles.length > 0 && (
                                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '8px', color: isDark ? '#888' : '#666' }}>
                                                        Perfis Salvos
                                                    </div>
                                                    {gitProfiles.map(profile => (
                                                        <div key={profile.id} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '6px 8px',
                                                            marginBottom: '4px',
                                                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                                            borderRadius: '4px'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                                                                <span style={{ color: getTagColor(profile.tag) }}>{getTagIcon(profile.tag)}</span>
                                                                <span>{profile.name}</span>
                                                                <span style={{ color: isDark ? '#666' : '#999', fontSize: '0.7rem' }}>({profile.email})</span>
                                                                {profile.tag === 'custom' && profile.customTagName && (
                                                                    <span style={{
                                                                        fontSize: '0.65rem',
                                                                        background: 'rgba(251, 191, 36, 0.1)',
                                                                        color: '#fbbf24',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(251, 191, 36, 0.2)'
                                                                    }}>
                                                                        {profile.customTagName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => removeGitProfile(profile.id)}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    color: '#f87171',
                                                                    padding: '2px'
                                                                }}
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Global Configuration Content */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {hasGlobal && !isEditingAuthor ? (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: isDark ? '#2d2d2d' : '#f5f5f5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: `1px solid ${isDark ? '#444' : '#e5e7eb'}`
                                                }}>
                                                    <User size={16} color={isDark ? '#888' : '#666'} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{git.globalAuthor?.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: isDark ? '#666' : '#999' }}>{git.globalAuthor?.email}</div>
                                                </div>
                                                <div style={{
                                                    fontSize: '0.7rem',
                                                    color: '#4ade80',
                                                    background: 'rgba(74, 222, 128, 0.1)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    border: '1px solid rgba(74, 222, 128, 0.2)'
                                                }}>
                                                    <Check size={10} /> Global
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setAuthorBuffer(git.globalAuthor!);
                                                    setIsEditingAuthor(true);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    background: 'transparent',
                                                    color: isDark ? '#888' : '#666',
                                                    border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <Edit3 size={14} />
                                                Alterar Configuração Global
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {!hasGlobal && (
                                                <div style={{
                                                    padding: '10px',
                                                    background: 'rgba(251, 191, 36, 0.08)',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    gap: '10px',
                                                    alignItems: 'flex-start',
                                                    border: '1px solid rgba(251, 191, 36, 0.2)',
                                                    marginBottom: '8px'
                                                }}>
                                                    <ShieldAlert size={16} color="#fbbf24" style={{ marginTop: '2px', flexShrink: 0 }} />
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#fbbf24',
                                                        lineHeight: 1.5
                                                    }}>
                                                        Configuração global não encontrada. Configure seu autor global.
                                                    </div>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    placeholder="Nome"
                                                    value={authorBuffer.name}
                                                    onChange={(e) => setAuthorBuffer({ ...authorBuffer, name: e.target.value })}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px 10px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                                        background: isDark ? '#2d2d2d' : '#fff',
                                                        color: isDark ? '#fff' : '#000',
                                                        fontSize: '0.85rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                                <input
                                                    placeholder="Email"
                                                    value={authorBuffer.email}
                                                    onChange={(e) => setAuthorBuffer({ ...authorBuffer, email: e.target.value })}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px 10px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                                        background: isDark ? '#2d2d2d' : '#fff',
                                                        color: isDark ? '#fff' : '#000',
                                                        fontSize: '0.85rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={handleSaveGlobalConfig}
                                                    style={{
                                                        flex: 1,
                                                        padding: '8px',
                                                        background: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)',
                                                        color: isDark ? '#4fc3f7' : '#0070f3',
                                                        border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)'}`,
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    Salvar
                                                </button>
                                                {isEditingAuthor && (
                                                    <button
                                                        onClick={() => setIsEditingAuthor(false)}
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: 'transparent',
                                                            color: isDark ? '#888' : '#666',
                                                            border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Init Button */}
                        <button
                            onClick={startInit}
                            disabled={isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal)}
                            style={{
                                padding: '12px',
                                background: (isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal))
                                    ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                                    : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                                color: (isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal))
                                    ? (isDark ? '#555' : '#999')
                                    : (isDark ? '#4fc3f7' : '#0070f3'),
                                border: `1px solid ${(isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal))
                                    ? (isDark ? '#333' : '#e5e7eb')
                                    : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                                borderRadius: '8px',
                                cursor: (isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal)) ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'opacity 0.2s'
                            }}
                        >
                            {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                            Inicializar Repositório
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Normal Git View (Already initialized repository)
    const staged = git.changes.filter(c => c.index !== ' ' && c.index !== '?');
    const unstaged = git.changes.filter(c => c.workingTree !== ' ' || c.index === '?');

    // Clean professional section header
    const SectionHeader = ({ title, count, onToggle, isOpen }: any) => (
        <div
            onClick={onToggle}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: isDark ? '#999' : '#777',
                cursor: onToggle ? 'pointer' : 'default',
                borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                transition: 'background 0.12s ease'
            }}
            onMouseEnter={(e) => onToggle && (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')}
            onMouseLeave={(e) => onToggle && (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
        >
            {onToggle && (
                <div style={{ color: isDark ? '#666' : '#999', transition: 'transform 0.12s ease' }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            )}
            <span style={{ flex: 1 }}>{title}</span>
            <span style={{
                background: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                color: isDark ? '#eee' : '#555',
                minWidth: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                padding: '0 7px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`
            }}>{count}</span>
        </div>
    );

    // Professional action toolbar for bulk operations
    const ActionToolbar = ({ children }: any) => {
        if (!children) return null;
        return (
            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '10px 16px',
                background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.015)',
                borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`
            }}>
                {children}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000' }}>
            {/* Header */}
            <div style={{
                padding: '12px 20px',
                borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#4fc3f7' : '#0070f3'
                    }}>
                        <GitBranch size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{git.currentBranch}</div>
                        <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>Repositório Ativo</div>
                    </div>
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
                        justifyContent: 'center'
                    }}
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>

                {/* Author Avatar Menu */}
                <div style={{ position: 'relative' }}>
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
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                            {git.projectAuthor?.name || git.globalAuthor?.name || 'Não configurado'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>
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
                            {gitProfiles.length > 0 && (
                                <div style={{ padding: '8px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                                    <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', padding: '4px 8px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Trocar para
                                    </div>

                                    {/* Global Author Option - Only show if we currently have a local override */}
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
                                            {/* Show check if currently active and inherited */}
                                            {!git.projectAuthor && (
                                                <Check size={14} color="#10b981" />
                                            )}
                                        </div>
                                    )}

                                    {gitProfiles
                                        .filter(profile => {
                                            const current = git.projectAuthor || git.globalAuthor;
                                            if (!current) return true;
                                            // Only hide if name AND email match exactly
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
                                                <span style={{ color: getTagColor(profile.tag), flexShrink: 0 }}>
                                                    {getTagIcon(profile.tag)}
                                                </span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {profile.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {profile.email}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}

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

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <SectionHeader
                        title="Alterações Preparadas"
                        count={staged.length}
                        isOpen={true}
                    />
                    {staged.length > 0 && (
                        <ActionToolbar>
                            <button
                                onClick={gitUnstageAll}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                    borderRadius: '6px',
                                    color: isDark ? '#ddd' : '#555',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    transition: 'all 0.12s ease'
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
                                Unstage All
                            </button>
                        </ActionToolbar>
                    )}
                    <div style={{ padding: '4px 0' }}>
                        {staged.map((file, i) => (
                            <div key={i} className="git-file-item" style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '6px 20px',
                                fontSize: '0.8rem',
                                gap: '12px'
                            }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>
                                    {file.index}
                                </div>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</span>
                                <button
                                    onClick={() => gitUnstage(file.path)}
                                    title="Remover do Stage"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', padding: '4px' }}
                                >
                                    <Minus size={14} />
                                </button>
                            </div>
                        ))}
                        {staged.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: isDark ? '#444' : '#ccc' }}>
                                Nenhuma alteração preparada
                            </div>
                        )}
                    </div>

                    <SectionHeader
                        title="Alterações Não Preparadas"
                        count={unstaged.length}
                        isOpen={true}
                    />
                    {unstaged.length > 0 && (
                        <ActionToolbar>
                            <button
                                onClick={gitStageAll}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                    borderRadius: '6px',
                                    color: isDark ? '#ddd' : '#555',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    transition: 'all 0.12s ease'
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
                                Stage All Changes
                            </button>
                            <button
                                onClick={gitDiscardAll}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                    borderRadius: '6px',
                                    color: isDark ? '#f87171' : '#dc2626',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    transition: 'all 0.12s ease'
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
                                Discard All Changes
                            </button>
                        </ActionToolbar>
                    )}
                    <div style={{ padding: '4px 0' }}>
                        {unstaged.map((file, i) => (
                            <div key={i} className="git-file-item" style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '6px 20px',
                                fontSize: '0.8rem',
                                gap: '12px'
                            }}>
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
                                <button
                                    onClick={() => gitDiscard(file.path)}
                                    title="Descartar Alterações"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', padding: '4px' }}
                                >
                                    <RotateCcw size={14} />
                                </button>
                                <button
                                    onClick={() => gitStage(file.path)}
                                    title="Adicionar ao Stage"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4ade80', padding: '4px' }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        ))}
                        {unstaged.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: isDark ? '#444' : '#ccc' }}>
                                Nenhum arquivo modificado
                            </div>
                        )}
                    </div>

                    <SectionHeader
                        title="HISTÓRICO DE COMMITS"
                        count={git.log.length}
                        isOpen={showHistory}
                        onToggle={() => setShowHistory(!showHistory)}
                    />
                    {showHistory && (
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {git.log.length === 0 ? (
                                <p style={{ fontSize: '0.75rem', color: isDark ? '#555' : '#ccc', textAlign: 'center' }}>Sem histórico de commits</p>
                            ) : (
                                git.log.map((entry, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        gap: '16px',
                                        fontSize: '0.75rem',
                                        position: 'relative',
                                        paddingBottom: '20px'
                                    }}>
                                        {i !== git.log.length - 1 && (
                                            <div style={{
                                                position: 'absolute',
                                                left: '7px',
                                                top: '16px',
                                                bottom: '0',
                                                width: '1px',
                                                background: isDark ? '#333' : '#eee'
                                            }} />
                                        )}
                                        <div style={{
                                            width: '15px',
                                            height: '15px',
                                            borderRadius: '50%',
                                            background: isDark ? '#1a1a1a' : '#fff',
                                            border: `2px solid ${isDark ? '#0070f3' : '#0070f3'}`,
                                            zIndex: 2,
                                            marginTop: '2px',
                                            flexShrink: 0
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{entry.message}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                                                <span style={{ fontFamily: 'monospace', background: isDark ? '#2d2d2d' : '#f0f0f0', padding: '1px 4px', borderRadius: '4px' }}>{entry.hash}</span>
                                                <span style={{ fontSize: '0.7rem' }}>• {entry.author}</span>
                                                <span style={{ fontSize: '0.7rem' }}>• {entry.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div style={{
                padding: '20px',
                borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <textarea
                    placeholder="O que você mudou? (Mensagem de commit...)"
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '80px',
                        background: isDark ? '#2d2d2d' : '#fff',
                        border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                        borderRadius: '12px',
                        color: isDark ? '#fff' : '#000',
                        fontSize: '0.9rem',
                        padding: '12px',
                        resize: 'none',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0070f3'}
                    onBlur={(e) => e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd'}
                />
                <button
                    onClick={handleCommit}
                    disabled={!commitMsg.trim() || staged.length === 0 || isLoading}
                    style={{
                        padding: '12px',
                        background: !commitMsg.trim() || staged.length === 0
                            ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')
                            : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                        color: !commitMsg.trim() || staged.length === 0
                            ? (isDark ? '#555' : '#999')
                            : (isDark ? '#4fc3f7' : '#0070f3'),
                        border: `1px solid ${!commitMsg.trim() || staged.length === 0
                            ? (isDark ? '#333' : '#e5e7eb')
                            : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                        borderRadius: '8px',
                        cursor: !commitMsg.trim() || staged.length === 0 ? 'default' : 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: !commitMsg.trim() || staged.length === 0 ? 'none' : '0 4px 10px rgba(0, 112, 243, 0.2)'
                    }}
                >
                    <GitCommit size={18} />
                    Confirmar Alterações (Commit)
                </button>
            </div>
            {/* Author Configuration Modal */}
            {showAuthorConfigModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '16px'
                    }}
                    onClick={() => {
                        setShowAuthorConfigModal(false);
                        setIsEditingAuthor(false);
                        setShowProfileManager(false);
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: isDark ? '#1a1a1a' : '#fff',
                            borderRadius: '10px',
                            width: '100%',
                            maxWidth: '420px',
                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '16px 16px 12px 16px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                                Configurar Autor
                            </h3>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Scope Selection */}
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                        Escopo
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <label style={{
                                            flex: 1,
                                            padding: '8px 6px',
                                            borderRadius: '6px',
                                            background: !authorConfigBuffer.isGlobal
                                                ? (isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.08)')
                                                : 'transparent',
                                            border: `1px solid ${!authorConfigBuffer.isGlobal
                                                ? (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')
                                                : (isDark ? '#333' : '#e5e7eb')}`,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '0.8rem'
                                        }}>
                                            <input
                                                type="radio"
                                                checked={!authorConfigBuffer.isGlobal}
                                                onChange={() => {
                                                    setAuthorConfigBuffer({ name: '', email: '', isGlobal: false });
                                                    setIsEditingAuthor(false);
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Local</div>
                                                <div style={{ fontSize: '0.65rem', color: isDark ? '#666' : '#999' }}>Este projeto</div>
                                            </div>
                                        </label>
                                        <label style={{
                                            flex: 1,
                                            padding: '8px 6px',
                                            borderRadius: '6px',
                                            background: authorConfigBuffer.isGlobal
                                                ? (isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(16, 185, 129, 0.08)')
                                                : 'transparent',
                                            border: `1px solid ${authorConfigBuffer.isGlobal
                                                ? 'rgba(74, 222, 128, 0.3)'
                                                : (isDark ? '#333' : '#e5e7eb')}`,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '0.8rem'
                                        }}>
                                            <input
                                                type="radio"
                                                checked={authorConfigBuffer.isGlobal}
                                                onChange={() => {
                                                    const hasGlobal = git.globalAuthor?.name && git.globalAuthor?.email;
                                                    setAuthorConfigBuffer({
                                                        name: hasGlobal && git.globalAuthor ? git.globalAuthor.name : '',
                                                        email: hasGlobal && git.globalAuthor ? git.globalAuthor.email : '',
                                                        isGlobal: true
                                                    });
                                                    setIsEditingAuthor(!hasGlobal);
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Global</div>
                                                <div style={{ fontSize: '0.65rem', color: isDark ? '#666' : '#999' }}>Todos projetos</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Global Author Display */}
                                {authorConfigBuffer.isGlobal && !isEditingAuthor && git.globalAuthor?.name && (
                                    <div style={{
                                        padding: '10px',
                                        background: isDark ? 'rgba(74, 222, 128, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                                        border: `1px solid ${isDark ? 'rgba(74, 222, 128, 0.2)' : 'rgba(16, 185, 129, 0.15)'}`,
                                        borderRadius: '6px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                Atual
                                            </div>
                                            <button
                                                onClick={() => setIsEditingAuthor(true)}
                                                style={{
                                                    padding: '3px 8px',
                                                    background: 'transparent',
                                                    border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                                    borderRadius: '4px',
                                                    color: '#10b981',
                                                    cursor: 'pointer',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Alterar
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{git.globalAuthor.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>{git.globalAuthor.email}</div>
                                    </div>
                                )}

                                {/* Saved Profiles */}
                                {!authorConfigBuffer.isGlobal && gitProfiles.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                            Perfis Salvos
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {gitProfiles.map(profile => (
                                                <div
                                                    key={profile.id}
                                                    onClick={() => setAuthorConfigBuffer({ name: profile.name, email: profile.email, isGlobal: false })}
                                                    style={{
                                                        padding: '5px 8px',
                                                        background: (authorConfigBuffer.name === profile.name && authorConfigBuffer.email === profile.email)
                                                            ? (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)')
                                                            : (isDark ? '#2d2d2d' : '#f5f5f5'),
                                                        border: `1px solid ${(authorConfigBuffer.name === profile.name && authorConfigBuffer.email === profile.email)
                                                            ? (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')
                                                            : (isDark ? '#444' : '#e5e7eb')}`,
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        fontSize: '0.7rem'
                                                    }}
                                                >
                                                    <span style={{ color: getTagColor(profile.tag), fontSize: '0.85rem' }}>
                                                        {getTagIcon(profile.tag)}
                                                    </span>
                                                    <span style={{ fontWeight: 600 }}>{profile.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Inputs */}
                                {(!authorConfigBuffer.isGlobal || isEditingAuthor) && (
                                    <>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                                                Nome
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Seu nome"
                                                value={authorConfigBuffer.name}
                                                onChange={(e) => setAuthorConfigBuffer({ ...authorConfigBuffer, name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 10px',
                                                    borderRadius: '6px',
                                                    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                    background: isDark ? '#2d2d2d' : '#fff',
                                                    color: isDark ? '#fff' : '#000',
                                                    fontSize: '0.85rem',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                placeholder="seu@email.com"
                                                value={authorConfigBuffer.email}
                                                onChange={(e) => setAuthorConfigBuffer({ ...authorConfigBuffer, email: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 10px',
                                                    borderRadius: '6px',
                                                    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                    background: isDark ? '#2d2d2d' : '#fff',
                                                    color: isDark ? '#fff' : '#000',
                                                    fontSize: '0.85rem',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Profile Manager */}
                                {!authorConfigBuffer.isGlobal && (
                                    <>
                                        <button
                                            onClick={() => setShowProfileManager(!showProfileManager)}
                                            style={{
                                                padding: '7px',
                                                background: 'transparent',
                                                color: isDark ? '#888' : '#666',
                                                border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px',
                                                fontWeight: 600
                                            }}
                                        >
                                            <Settings size={13} />
                                            Gerenciar Perfis
                                        </button>

                                        {showProfileManager && (
                                            <div style={{
                                                padding: '10px',
                                                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                                                borderRadius: '6px',
                                                border: `1px solid ${isDark ? '#444' : '#e5e7eb'}`
                                            }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '8px', color: isDark ? '#aaa' : '#666' }}>
                                                    Novo Perfil
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <input
                                                        placeholder="Nome"
                                                        value={newProfile.name}
                                                        onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 8px',
                                                            borderRadius: '4px',
                                                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                            background: isDark ? '#1a1a1a' : '#fff',
                                                            color: isDark ? '#fff' : '#000',
                                                            fontSize: '0.75rem',
                                                            outline: 'none',
                                                            boxSizing: 'border-box'
                                                        }}
                                                    />
                                                    <input
                                                        placeholder="Email"
                                                        value={newProfile.email}
                                                        onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 8px',
                                                            borderRadius: '4px',
                                                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                            background: isDark ? '#1a1a1a' : '#fff',
                                                            color: isDark ? '#fff' : '#000',
                                                            fontSize: '0.75rem',
                                                            outline: 'none',
                                                            boxSizing: 'border-box'
                                                        }}
                                                    />
                                                    <div style={{ position: 'relative' }}>
                                                        <select
                                                            value={newProfile.tag}
                                                            onChange={(e) => setNewProfile({ ...newProfile, tag: e.target.value as any })}
                                                            style={{
                                                                width: '100%',
                                                                padding: '6px 8px',
                                                                paddingRight: '26px',
                                                                borderRadius: '4px',
                                                                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                                background: isDark ? '#1a1a1a' : '#fff',
                                                                color: isDark ? '#fff' : '#000',
                                                                fontSize: '0.75rem',
                                                                appearance: 'none',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                                boxSizing: 'border-box'
                                                            }}
                                                        >
                                                            <option value="personal">Pessoal</option>
                                                            <option value="work">Trabalho</option>
                                                            <option value="ai">AI</option>
                                                            <option value="custom">Personalizado</option>
                                                        </select>
                                                        <ChevronDown size={12} style={{
                                                            position: 'absolute',
                                                            right: '8px',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            pointerEvents: 'none',
                                                            color: isDark ? '#666' : '#999'
                                                        }} />
                                                    </div>
                                                    {newProfile.tag === 'custom' && (
                                                        <input
                                                            placeholder="Nome da tag"
                                                            value={newProfile.customTagName}
                                                            onChange={(e) => setNewProfile({ ...newProfile, customTagName: e.target.value })}
                                                            style={{
                                                                width: '100%',
                                                                padding: '6px 8px',
                                                                borderRadius: '4px',
                                                                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                                background: isDark ? '#1a1a1a' : '#fff',
                                                                color: isDark ? '#fff' : '#000',
                                                                fontSize: '0.75rem',
                                                                outline: 'none',
                                                                boxSizing: 'border-box'
                                                            }}
                                                        />
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            handleAddProfile();
                                                            setShowProfileManager(false);
                                                        }}
                                                        disabled={!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)}
                                                        style={{
                                                            padding: '6px',
                                                            background: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName))
                                                                ? (isDark ? '#333' : '#eee')
                                                                : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                                                            color: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName))
                                                                ? (isDark ? '#666' : '#999')
                                                                : (isDark ? '#4fc3f7' : '#0070f3'),
                                                            border: `1px solid ${(!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName))
                                                                ? (isDark ? '#444' : '#ddd')
                                                                : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                                                            borderRadius: '4px',
                                                            cursor: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName))
                                                                ? 'not-allowed'
                                                                : 'pointer',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '12px 16px',
                            borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                            display: 'flex',
                            gap: '8px'
                        }}>
                            <button
                                onClick={() => {
                                    setShowAuthorConfigModal(false);
                                    setIsEditingAuthor(false);
                                    setShowProfileManager(false);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: 'transparent',
                                    border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                    borderRadius: '6px',
                                    color: isDark ? '#aaa' : '#666',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
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
                                        setShowProfileManager(false);
                                    }
                                }}
                                disabled={
                                    (authorConfigBuffer.isGlobal && !isEditingAuthor && !git.globalAuthor?.name) ||
                                    ((!authorConfigBuffer.isGlobal || isEditingAuthor) && (!authorConfigBuffer.name || !authorConfigBuffer.email))
                                }
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: (
                                        (authorConfigBuffer.isGlobal && !isEditingAuthor && !git.globalAuthor?.name) ||
                                        ((!authorConfigBuffer.isGlobal || isEditingAuthor) && (!authorConfigBuffer.name || !authorConfigBuffer.email))
                                    )
                                        ? (isDark ? '#333' : '#eee')
                                        : (authorConfigBuffer.isGlobal
                                            ? 'rgba(74, 222, 128, 0.15)'
                                            : 'rgba(79, 195, 247, 0.15)'),
                                    border: `1px solid ${(
                                        (authorConfigBuffer.isGlobal && !isEditingAuthor && !git.globalAuthor?.name) ||
                                        ((!authorConfigBuffer.isGlobal || isEditingAuthor) && (!authorConfigBuffer.name || !authorConfigBuffer.email))
                                    )
                                        ? (isDark ? '#444' : '#ddd')
                                        : (authorConfigBuffer.isGlobal
                                            ? 'rgba(74, 222, 128, 0.3)'
                                            : 'rgba(79, 195, 247, 0.3)')}`,
                                    borderRadius: '6px',
                                    color: (
                                        (authorConfigBuffer.isGlobal && !isEditingAuthor && !git.globalAuthor?.name) ||
                                        ((!authorConfigBuffer.isGlobal || isEditingAuthor) && (!authorConfigBuffer.name || !authorConfigBuffer.email))
                                    )
                                        ? (isDark ? '#666' : '#999')
                                        : (authorConfigBuffer.isGlobal ? '#10b981' : (isDark ? '#4fc3f7' : '#0070f3')),
                                    cursor: (
                                        (authorConfigBuffer.isGlobal && !isEditingAuthor && !git.globalAuthor?.name) ||
                                        ((!authorConfigBuffer.isGlobal || isEditingAuthor) && (!authorConfigBuffer.name || !authorConfigBuffer.email))
                                    ) ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600
                                }}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div >
            )}
        </div >
    );
};
