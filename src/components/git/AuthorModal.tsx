import React from 'react';
import { Settings, X, Plus, Trash2, ArrowLeft, Briefcase, User, Sparkles, Smile, Tag } from 'lucide-react';

interface Author {
    name: string;
    email: string;
}

interface Profile {
    id: string;
    name: string;
    email: string;
    tag: 'work' | 'personal' | 'ai' | 'custom';
}

interface AuthorModalProps {
    isDark: boolean;
    isOpen: boolean;
    onClose: () => void;
    authorConfigBuffer: { name: string; email: string; isGlobal: boolean };
    setAuthorConfigBuffer: (config: any) => void;
    isEditingAuthor: boolean;
    setIsEditingAuthor: (editing: boolean) => void;
    gitProfiles: Profile[];
    globalAuthor: Author | null;
    onSave: () => void;
    getTagColor: (tag: string) => string;
    getTagIcon: (tag: string) => React.ReactNode;
    showProfileManager: boolean;
    setShowProfileManager: (show: boolean) => void;
    handleAddProfile: () => void;
    removeGitProfile: (id: string) => void;
    newProfile: { name: string; email: string; tag: 'work' | 'personal' | 'ai' | 'custom'; customTagName: string };
    setNewProfile: (profile: any) => void;
}

export const AuthorModal: React.FC<AuthorModalProps> = ({
    isDark, isOpen, onClose,
    authorConfigBuffer, setAuthorConfigBuffer,
    isEditingAuthor, setIsEditingAuthor,
    gitProfiles, globalAuthor,
    onSave, getTagColor, getTagIcon,
    showProfileManager, setShowProfileManager,
    handleAddProfile, removeGitProfile,
    newProfile, setNewProfile
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '16px',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: isDark ? '#1a1a1a' : '#fff',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '400px',
                    border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '85vh',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {showProfileManager && (
                        <button
                            onClick={() => setShowProfileManager(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: isDark ? '#888' : '#666',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '6px',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#2a2a2a' : '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, flex: 1, color: isDark ? '#fff' : '#1a1a1a' }}>
                        {showProfileManager ? 'Gerenciar Perfis' : 'Configurar Autor'}
                    </h3>
                    {!showProfileManager && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: isDark ? '#666' : '#999',
                                padding: '4px',
                                borderRadius: '6px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#2a2a2a' : '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {showProfileManager ? (
                        /* Profile Manager View */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{
                                padding: '16px',
                                background: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
                                borderRadius: '10px',
                                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '12px', color: isDark ? '#666' : '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Novo Perfil
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input
                                        placeholder="Nome do Perfil"
                                        value={newProfile.name}
                                        onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: `1px solid ${isDark ? '#444' : '#d1d5db'}`,
                                            background: isDark ? '#000' : '#fff',
                                            color: isDark ? '#fff' : '#000',
                                            fontSize: '0.9rem',
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
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: `1px solid ${isDark ? '#444' : '#d1d5db'}`,
                                            background: isDark ? '#000' : '#fff',
                                            color: isDark ? '#fff' : '#000',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        {(['personal', 'work', 'ai', 'custom'] as const).map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setNewProfile({ ...newProfile, tag })}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    borderRadius: '6px',
                                                    border: `1px solid ${newProfile.tag === tag ? getTagColor(tag) : (isDark ? '#333' : '#e5e7eb')}`,
                                                    background: newProfile.tag === tag ? `${getTagColor(tag)}20` : 'transparent',
                                                    color: newProfile.tag === tag ? getTagColor(tag) : (isDark ? '#666' : '#999'),
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                    gap: '4px',
                                                    fontSize: '0.7rem'
                                                }}
                                                title={tag === 'custom' ? 'Personalizado' : tag}
                                            >
                                                {getTagIcon(tag)}
                                            </button>
                                        ))}
                                    </div>

                                    {newProfile.tag === 'custom' && (
                                        <input
                                            placeholder="Nome da Flag (Ex: Freelance)"
                                            value={newProfile.customTagName}
                                            onChange={(e) => setNewProfile({ ...newProfile, customTagName: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: `1px solid ${isDark ? '#444' : '#d1d5db'}`,
                                                background: isDark ? '#000' : '#fff',
                                                color: isDark ? '#fff' : '#000',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                marginTop: '4px'
                                            }}
                                        />
                                    )}

                                    <button
                                        onClick={handleAddProfile}
                                        disabled={!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)}
                                        style={{
                                            marginTop: '8px',
                                            padding: '10px',
                                            background: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? (isDark ? '#222' : '#eee') : (isDark ? '#4fc3f7' : '#0070f3'),
                                            color: (!newProfile.name || !newProfile.email || (newProfile.tag === 'custom' && !newProfile.customTagName)) ? (isDark ? '#444' : '#999') : '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        <Plus size={18} /> Criar Perfil
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#666' : '#999', textTransform: 'uppercase' }}>
                                    Perfis Existentes
                                </div>
                                {gitProfiles.map(p => (
                                    <div key={p.id} style={{
                                        padding: '12px',
                                        background: isDark ? '#222' : '#fff',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        border: `1px solid ${isDark ? '#333' : '#f3f4f6'}`,
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: isDark ? '#333' : '#f3f4f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: getTagColor(p.tag),
                                            flexShrink: 0
                                        }}>
                                            {getTagIcon(p.tag)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: isDark ? '#666' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                                        </div>
                                        <button
                                            onClick={() => removeGitProfile(p.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#f87171',
                                                padding: '8px',
                                                borderRadius: '8px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {gitProfiles.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px', color: isDark ? '#444' : '#ccc', fontSize: '0.85rem' }}>
                                        Nenhum perfil cadastrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Configuration View */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Scope Selection */}
                            <div>
                                <div style={{ fontSize: '0.75rem', color: isDark ? '#666' : '#999', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Escopo de Configuração
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <label style={{
                                        flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px',
                                        background: !authorConfigBuffer.isGlobal ? (isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)') : 'transparent',
                                        border: `2px solid ${!authorConfigBuffer.isGlobal ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#333' : '#e5e7eb')}`,
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input type="radio" checked={!authorConfigBuffer.isGlobal} onChange={() => setAuthorConfigBuffer({ ...authorConfigBuffer, isGlobal: false })} />
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Local</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: isDark ? '#555' : '#999', marginLeft: '24px' }}>Apenas este projeto</span>
                                    </label>
                                    <label style={{
                                        flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px',
                                        background: authorConfigBuffer.isGlobal ? (isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(16, 185, 129, 0.05)') : 'transparent',
                                        border: `2px solid ${authorConfigBuffer.isGlobal ? (isDark ? '#4ade80' : '#10b981') : (isDark ? '#333' : '#e5e7eb')}`,
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input type="radio" checked={authorConfigBuffer.isGlobal} onChange={() => setAuthorConfigBuffer({ ...authorConfigBuffer, isGlobal: true })} />
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Global</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: isDark ? '#555' : '#999', marginLeft: '24px' }}>Todos os projetos</span>
                                    </label>
                                </div>
                            </div>

                            {/* Saved Profiles List */}
                            {!authorConfigBuffer.isGlobal && gitProfiles.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: isDark ? '#666' : '#999', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}>
                                        Perfis Rápidos
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {gitProfiles.map(profile => {
                                            const isSelected = authorConfigBuffer.name === profile.name && authorConfigBuffer.email === profile.email;
                                            return (
                                                <div
                                                    key={profile.id}
                                                    onClick={() => setAuthorConfigBuffer({ ...authorConfigBuffer, name: profile.name, email: profile.email })}
                                                    style={{
                                                        padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                                                        background: isSelected ? (isDark ? '#2d2d2d' : '#f3f4f6') : (isDark ? '#222' : '#fff'),
                                                        border: `1px solid ${isSelected ? getTagColor(profile.tag) : (isDark ? '#333' : '#e5e7eb')}`,
                                                        color: isSelected ? getTagColor(profile.tag) : (isDark ? '#888' : '#666'),
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <span style={{ opacity: isSelected ? 1 : 0.6 }}>{getTagIcon(profile.tag)}</span>
                                                    {profile.name}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Manual Inputs */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '6px', fontWeight: 600 }}>NOME</label>
                                    <input
                                        type="text" value={authorConfigBuffer.name}
                                        onChange={(e) => setAuthorConfigBuffer({ ...authorConfigBuffer, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${isDark ? '#333' : '#d1d5db'}`, background: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '6px', fontWeight: 600 }}>EMAIL</label>
                                    <input
                                        type="email" value={authorConfigBuffer.email}
                                        onChange={(e) => setAuthorConfigBuffer({ ...authorConfigBuffer, email: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${isDark ? '#333' : '#d1d5db'}`, background: isDark ? '#262626' : '#fff', color: isDark ? '#fff' : '#000', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Manage Button */}
                            {!authorConfigBuffer.isGlobal && (
                                <button
                                    onClick={() => setShowProfileManager(true)}
                                    style={{
                                        marginTop: '4px', width: '100%', padding: '12px', background: 'transparent', color: isDark ? '#888' : '#666', border: `1px dashed ${isDark ? '#444' : '#d1d5db'}`, borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = isDark ? '#666' : '#999';
                                        e.currentTarget.style.color = isDark ? '#bbb' : '#333';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = isDark ? '#444' : '#d1d5db';
                                        e.currentTarget.style.color = isDark ? '#888' : '#666';
                                    }}
                                >
                                    <Settings size={16} /> Gerenciar Perfis Salvos
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!showProfileManager && (
                    <div style={{ padding: '16px', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                        <button onClick={onClose} style={{ padding: '10px 16px', background: 'transparent', color: isDark ? '#888' : '#666', border: `1px solid ${isDark ? '#333' : '#d1d5db'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                            Cancelar
                        </button>
                        <button
                            onClick={onSave}
                            disabled={!authorConfigBuffer.name || !authorConfigBuffer.email}
                            style={{
                                padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                                background: (!authorConfigBuffer.name || !authorConfigBuffer.email) ? (isDark ? '#222' : '#eee') : (isDark ? '#4fc3f7' : '#0070f3'),
                                color: (!authorConfigBuffer.name || !authorConfigBuffer.email) ? (isDark ? '#444' : '#aaa') : '#fff',
                                border: 'none',
                                opacity: (!authorConfigBuffer.name || !authorConfigBuffer.email) ? 0.6 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            Salvar Alterações
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
