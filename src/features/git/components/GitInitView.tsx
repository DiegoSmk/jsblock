import { GitBranch, AlertCircle, User, Settings, Check, Edit3, ShieldAlert, Plus, RefreshCw, ChevronDown, X } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import './GitInitView.css';
import { getTagIcon, getTagColor } from '../utils/gitHelpers';
import type { GitProfile } from '../types';
import type { AppState } from '../../../types/store';

export const GitInitView: React.FC = () => {
    const {
        isDark,
        openedFolder,
        isLoading,
        git,
        configLevel,
        setConfigLevel,
        authorBuffer,
        setAuthorBuffer,
        isEditingAuthor,
        setIsEditingAuthor,
        gitProfiles,
        showProfileManager,
        setShowProfileManager,
        startInit,
        handleSaveGlobalConfig,
        handleAddProfile,
        removeGitProfile,
        newProfile,
        setNewProfile
    } = useStore(useShallow((state: AppState) => ({
        isDark: state.theme === 'dark',
        openedFolder: state.openedFolder,
        isLoading: state.git.isLoading,
        git: state.git,
        configLevel: state.git.configLevel,
        setConfigLevel: state.setConfigLevel,
        authorBuffer: state.git.authorBuffer,
        setAuthorBuffer: state.setAuthorBuffer,
        isEditingAuthor: state.git.isEditingAuthor,
        setIsEditingAuthor: state.setIsEditingAuthor,
        gitProfiles: state.gitProfiles,
        showProfileManager: state.git.showProfileManager,
        setShowProfileManager: state.setShowProfileManager,
        startInit: state.startInit,
        handleSaveGlobalConfig: state.handleSaveGlobalConfig,
        handleAddProfile: state.handleAddProfile,
        removeGitProfile: state.removeGitProfile,
        newProfile: state.git.newProfile,
        setNewProfile: state.setNewProfile
    })));

    if (!openedFolder) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#555' : '#ccc' }}>
                Abra uma pasta para usar o Git
            </div>
        );
    }

    const hasGlobal = !!(git.globalAuthor?.name ?? git.globalAuthor?.email);

    return (
        <div
            className="git-init-container animate-entrance"
            style={{
                background: isDark ? '#1a1a1a' : '#fff',
                color: isDark ? '#fff' : '#000',
            }}
        >
            {/* Header */}
            <div
                className="git-init-header animate-entrance"
                style={{
                    borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                }}
            >
                <GitBranch size={18} color={isDark ? '#4fc3f7' : '#0070f3'} />
                <div>
                    <div className="git-init-title">Controle de Versão</div>
                    <div className="git-init-subtitle" style={{ color: isDark ? '#666' : '#999' }}>Repositório não inicializado</div>
                </div>
            </div>

            {/* Content */}
            <div className="git-init-content">
                <div className="git-init-inner">
                    {/* Info Card */}
                    <div
                        className="git-info-card animate-entrance"
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                        }}
                    >
                        <AlertCircle size={20} color={isDark ? '#fbbf24' : '#f59e0b'} style={{ flexShrink: 0 }} />
                        <p className="git-info-text" style={{
                            color: isDark ? '#888' : '#666',
                        }}>
                            Esta pasta ainda não está sendo rastreada pelo Git. Inicialize um repositório para começar a versionar suas alterações.
                        </p>
                    </div>

                    {/* Author Section */}
                    <div
                        className="git-author-section animate-entrance"
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                        }}
                    >
                        <div className="git-section-header">
                            <div className="git-section-title" style={{
                                color: isDark ? '#888' : '#666',
                            }}>
                                <User size={14} />
                                Autor dos Commits
                            </div>
                        </div>

                        {/* Config Level Selector */}
                        <div className="git-config-selector">
                            <div className="git-config-label" style={{ color: isDark ? '#666' : '#999' }}>
                                Onde salvar?
                            </div>

                            {/* Local Option */}
                            <label className="git-radio-option" style={{
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
                            <label className="git-radio-option" style={{
                                background: configLevel === 'global' ? (isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(0, 112, 243, 0.05)') : 'transparent',
                                border: `1px solid ${configLevel === 'global' ? (isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.15)') : 'transparent'}`
                            }}>
                                <input
                                    type="radio"
                                    checked={configLevel === 'global'}
                                    onChange={() => {
                                        setConfigLevel('global');
                                        if (hasGlobal && git.globalAuthor) {
                                            setAuthorBuffer(git.globalAuthor);
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
                                        <div className="git-config-label" style={{ color: isDark ? '#666' : '#999', marginBottom: '8px' }}>
                                            Perfis Salvos
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {gitProfiles.map((profile: GitProfile) => (
                                                <button
                                                    key={profile.id}
                                                    onClick={() => setAuthorBuffer({ name: profile.name, email: profile.email })}
                                                    className="git-profile-tag-btn"
                                                    style={{
                                                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                                        border: `1px solid ${isDark ? '#444' : '#e5e7eb'}`,
                                                        color: getTagColor(profile.tag, isDark)
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
                                        className="git-input"
                                        style={{
                                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                            background: isDark ? '#2d2d2d' : '#fff',
                                            color: isDark ? '#fff' : '#000',
                                        }}
                                    />
                                    <input
                                        placeholder="Email"
                                        value={authorBuffer.email}
                                        onChange={(e) => setAuthorBuffer({ ...authorBuffer, email: e.target.value })}
                                        className="git-input"
                                        style={{
                                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                            background: isDark ? '#2d2d2d' : '#fff',
                                            color: isDark ? '#fff' : '#000',
                                        }}
                                    />
                                </div>

                                {/* Manage Profiles Button */}
                                <button
                                    onClick={() => setShowProfileManager(!showProfileManager)}
                                    className="git-btn-secondary"
                                    style={{
                                        color: isDark ? '#888' : '#666',
                                        border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                    }}
                                >
                                    <Settings size={14} />
                                    Gerenciar Perfis
                                </button>

                                {/* Profile Manager */}
                                {showProfileManager && (
                                    <div className="git-profile-manager" style={{
                                        background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
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
                                                className="git-input"
                                                style={{
                                                    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                    background: isDark ? '#1a1a1a' : '#fff',
                                                    color: isDark ? '#fff' : '#000',
                                                }}
                                            />
                                            <input
                                                placeholder="Email"
                                                value={newProfile.email}
                                                onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                                                className="git-input"
                                                style={{
                                                    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                    background: isDark ? '#1a1a1a' : '#fff',
                                                    color: isDark ? '#fff' : '#000',
                                                }}
                                            />
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    value={newProfile.tag}
                                                    onChange={(e) => setNewProfile({ ...newProfile, tag: e.target.value as GitProfile['tag'] })}
                                                    className="git-input"
                                                    style={{
                                                        width: '100%',
                                                        paddingRight: '28px',
                                                        border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                        background: isDark ? '#1a1a1a' : '#fff',
                                                        color: isDark ? '#fff' : '#000',
                                                        appearance: 'none',
                                                        cursor: 'pointer',
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
                                                    className="git-input"
                                                    style={{
                                                        border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                                                        background: isDark ? '#1a1a1a' : '#fff',
                                                        color: isDark ? '#fff' : '#000',
                                                    }}
                                                />
                                            )}
                                            <button
                                                onClick={handleAddProfile}
                                                disabled={!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)}
                                                className="git-init-btn"
                                                style={{
                                                    background: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? (isDark ? '#333' : '#eee') : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                                                    color: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? (isDark ? '#666' : '#999') : (isDark ? '#4fc3f7' : '#0070f3'),
                                                    border: `1px solid ${(!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? (isDark ? '#444' : '#ddd') : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                                                    cursor: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? 'not-allowed' : 'pointer',
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
                                                {gitProfiles.map((profile: GitProfile) => (
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
                                                            <span style={{ color: getTagColor(profile.tag, isDark) }}>{getTagIcon(profile.tag)}</span>
                                                            <span>{profile.name}</span>
                                                            <span style={{ color: isDark ? '#666' : '#999', fontSize: '0.7rem' }}>({profile.email})</span>
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
                                                if (git.globalAuthor) {
                                                    setAuthorBuffer(git.globalAuthor);
                                                    setIsEditingAuthor(true);
                                                }
                                            }}
                                            className="git-btn-secondary"
                                            style={{
                                                color: isDark ? '#888' : '#666',
                                                border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
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
                                                className="git-input"
                                                style={{
                                                    border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                                    background: isDark ? '#2d2d2d' : '#fff',
                                                    color: isDark ? '#fff' : '#000',
                                                }}
                                            />
                                            <input
                                                placeholder="Email"
                                                value={authorBuffer.email}
                                                onChange={(e) => setAuthorBuffer({ ...authorBuffer, email: e.target.value })}
                                                className="git-input"
                                                style={{
                                                    border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
                                                    background: isDark ? '#2d2d2d' : '#fff',
                                                    color: isDark ? '#fff' : '#000',
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => void handleSaveGlobalConfig()}
                                                className="git-init-btn"
                                                style={{
                                                    flex: 1,
                                                    background: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)',
                                                    color: isDark ? '#4fc3f7' : '#0070f3',
                                                    border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)'}`,
                                                }}
                                            >
                                                Salvar
                                            </button>
                                            {isEditingAuthor && (
                                                <button
                                                    onClick={() => setIsEditingAuthor(false)}
                                                    className="git-btn-secondary"
                                                    style={{
                                                        padding: '8px 16px',
                                                        color: isDark ? '#888' : '#666',
                                                        border: `1px solid ${isDark ? '#444' : '#d1d1d1'}`,
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
                    <div className="animate-entrance" style={{ animationDelay: '0.2s', opacity: 0 }}>
                        <button
                            onClick={() => void startInit()}
                            disabled={isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal)}
                            className="git-init-btn"
                            style={{
                                background: (isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal))
                                    ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                                    : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                                color: (isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal))
                                    ? (isDark ? '#555' : '#999')
                                    : (isDark ? '#4fc3f7' : '#0070f3'),
                                border: `1px solid ${(isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal))
                                    ? (isDark ? '#333' : '#e5e7eb')
                                    : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                                cursor: (isLoading || (configLevel === 'local' && (!authorBuffer.name || !authorBuffer.email)) || (configLevel === 'global' && !hasGlobal)) ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                            Inicializar Repositório
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
