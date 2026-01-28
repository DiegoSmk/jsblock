import React from 'react';

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
}

export const AuthorModal: React.FC<AuthorModalProps> = ({
    isDark, isOpen, onClose,
    authorConfigBuffer, setAuthorConfigBuffer,
    isEditingAuthor, setIsEditingAuthor,
    gitProfiles, globalAuthor,
    onSave, getTagColor, getTagIcon
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
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '16px'
            }}
            onClick={onClose}
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
                                            const hasGlobal = globalAuthor?.name && globalAuthor?.email;
                                            setAuthorConfigBuffer({
                                                name: hasGlobal && globalAuthor ? globalAuthor.name : '',
                                                email: hasGlobal && globalAuthor ? globalAuthor.email : '',
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
                        {authorConfigBuffer.isGlobal && !isEditingAuthor && globalAuthor?.name && (
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
                                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{globalAuthor.name}</div>
                                <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>{globalAuthor.email}</div>
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
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                        onClick={onClose}
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
                    <button
                        onClick={onSave}
                        disabled={!authorConfigBuffer.name || !authorConfigBuffer.email}
                        style={{
                            padding: '8px 16px',
                            background: (!authorConfigBuffer.name || !authorConfigBuffer.email)
                                ? (isDark ? 'rgba(79, 195, 247, 0.05)' : 'rgba(0, 112, 243, 0.05)')
                                : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                            color: (!authorConfigBuffer.name || !authorConfigBuffer.email)
                                ? (isDark ? '#444' : '#aaa')
                                : (isDark ? '#4fc3f7' : '#0070f3'),
                            border: `1px solid ${(!authorConfigBuffer.name || !authorConfigBuffer.email)
                                ? (isDark ? '#333' : '#eee')
                                : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                            borderRadius: '6px',
                            cursor: (!authorConfigBuffer.name || !authorConfigBuffer.email) ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}
                    >
                        Salvar Configuração
                    </button>
                </div>
            </div>
        </div>
    );
};
