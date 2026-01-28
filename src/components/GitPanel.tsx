import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
    RefreshCw, Plus, Minus, GitCommit, GitBranch,
    ChevronRight, ChevronDown, AlertCircle, User,
    Mail, Settings, Check, Edit3, ShieldAlert
} from 'lucide-react';

export const GitPanel: React.FC = () => {
    const {
        theme, git, refreshGit, fetchGitConfig,
        gitStage, gitUnstage, gitCommit, gitInit,
        setGitConfig, openedFolder
    } = useStore();

    const isDark = theme === 'dark';
    const [commitMsg, setCommitMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(true);

    // Setup for Init Flow
    const [isEditingAuthor, setIsEditingAuthor] = useState(false);
    const [authorBuffer, setAuthorBuffer] = useState({ name: '', email: '' });
    const [configLevel, setConfigLevel] = useState<'global' | 'local'>('local');

    useEffect(() => {
        if (openedFolder) {
            handleRefresh();
            fetchGitConfig();
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
        // If we are editing author, we use that. Otherwise we use global.
        if (isEditingAuthor) {
            await gitInit(authorBuffer, configLevel === 'global');
        } else {
            // Just init. If global exists, it will be used by default by git.
            // But requirement says: "Perguntar qual autor deve ser utilizado"
            // So we should probably always show the author selection before init if we want to be explicit.
            await gitInit();
        }
        setIsLoading(false);
    };

    const handleSaveConfig = async () => {
        await setGitConfig(authorBuffer, configLevel === 'global');
        setIsEditingAuthor(false);
    };

    if (!openedFolder) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#555' : '#ccc' }}>
                Abra uma pasta para usar o Git
            </div>
        );
    }

    if (!git.isRepo) {
        const hasGlobal = !!(git.globalAuthor?.name || git.globalAuthor?.email);
        const displayAuthor = isEditingAuthor ? authorBuffer : (git.globalAuthor || { name: 'Não definido', email: 'Não definido' });

        return (
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                background: isDark ? '#1a1a1a' : '#fff',
                color: isDark ? '#fff' : '#000'
            }}>
                <div style={{
                    maxWidth: '450px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px',
                    textAlign: 'center'
                }}>
                    {/* Header Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #0070f3, #00a1ff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            boxShadow: '0 10px 30px rgba(0, 112, 243, 0.3)'
                        }}>
                            <GitBranch size={40} />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Controle de Versão</h1>
                        <p style={{ fontSize: '0.95rem', color: isDark ? '#888' : '#666', lineHeight: 1.5 }}>
                            A pasta atual não possui um repositório Git inicializado.
                            Comece a rastrear suas mudanças agora.
                        </p>
                    </div>

                    {/* Author Section */}
                    <div style={{
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: `1px solid ${isDark ? '#333' : '#eee'}`,
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#aaa' : '#555', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <User size={14} />
                                Identidade do Autor
                            </div>
                            {!isEditingAuthor && (
                                <button
                                    onClick={() => {
                                        setAuthorBuffer(git.globalAuthor || { name: '', email: '' });
                                        setIsEditingAuthor(true);
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#0070f3',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <Edit3 size={14} /> Editar
                                </button>
                            )}
                        </div>

                        {isEditingAuthor ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            placeholder="Nome"
                                            value={authorBuffer.name}
                                            onChange={(e) => setAuthorBuffer({ ...authorBuffer, name: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: `1px solid ${isDark ? '#444' : '#ccc'}`,
                                                background: isDark ? '#2d2d2d' : '#fff',
                                                color: isDark ? '#fff' : '#000',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            placeholder="Email"
                                            value={authorBuffer.email}
                                            onChange={(e) => setAuthorBuffer({ ...authorBuffer, email: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: `1px solid ${isDark ? '#444' : '#ccc'}`,
                                                background: isDark ? '#2d2d2d' : '#fff',
                                                color: isDark ? '#fff' : '#000',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                        <input type="radio" checked={configLevel === 'local'} onChange={() => setConfigLevel('local')} />
                                        Apenas neste projeto
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                        <input type="radio" checked={configLevel === 'global'} onChange={() => setConfigLevel('global')} />
                                        Global (Todos os projetos)
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <button
                                        onClick={handleSaveConfig}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: '#0070f3',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        Aplicar Identidade
                                    </button>
                                    <button
                                        onClick={() => setIsEditingAuthor(false)}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'transparent',
                                            color: isDark ? '#888' : '#666',
                                            border: `1px solid ${isDark ? '#444' : '#ccc'}`,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isDark ? '#333' : '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#888' : '#666' }}>
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{displayAuthor.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: isDark ? '#666' : '#999' }}>{displayAuthor.email}</div>
                                    </div>
                                    {hasGlobal && (
                                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                                            <Check size={12} /> Global
                                        </div>
                                    )}
                                </div>
                                {!hasGlobal && (
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '10px 12px',
                                        background: 'rgba(251, 191, 36, 0.1)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        gap: '10px',
                                        alignItems: 'center',
                                        border: '1px solid rgba(251, 191, 36, 0.2)'
                                    }}>
                                        <ShieldAlert size={18} color="#fbbf24" />
                                        <div style={{ fontSize: '0.75rem', color: '#fbbf24', lineHeight: 1.4 }}>
                                            Autor não configurado. Você precisará de um nome e email para criar commits após inicializar.
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={startInit}
                        disabled={isLoading}
                        style={{
                            padding: '16px',
                            background: '#0070f3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 14px rgba(0, 112, 243, 0.4)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Plus size={20} />}
                        Inicializar Repositório Git
                    </button>

                    <p style={{ fontSize: '0.75rem', color: isDark ? '#444' : '#ccc' }}>
                        Isso criará uma pasta invisível <code>.git</code> no seu projeto para rastrear o histórico.
                    </p>
                </div>
            </div>
        );
    }

    // Normal Git View (already implemented, but can be polished)
    const staged = git.changes.filter(c => c.index !== ' ' && c.index !== '?');
    const unstaged = git.changes.filter(c => c.workingTree !== ' ' || c.index === '?');

    const SectionHeader = ({ title, count, onToggle, isOpen }: any) => (
        <div
            onClick={onToggle}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isDark ? '#888' : '#666',
                cursor: 'pointer',
                borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#e5e7eb'}`
            }}
        >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span style={{ flex: 1 }}>{title}</span>
            <span style={{
                background: isDark ? '#333' : '#ddd',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '10px'
            }}>{count}</span>
        </div>
    );

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
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Changes Sections */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Staged Changes */}
                    <SectionHeader title="ALTERAÇÕES PREPARADAS (STAGED)" count={staged.length} isOpen={true} />
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

                    {/* Unstaged Changes */}
                    <SectionHeader title="ALTERAÇÕES NÃO PREPARADAS" count={unstaged.length} isOpen={true} />
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

                    {/* History */}
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
                                        {/* Timeline Line */}
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
                                        {/* Timeline Dot */}
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

            {/* Commit Box */}
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
                        background: !commitMsg.trim() || staged.length === 0 ? (isDark ? '#333' : '#eee') : '#0070f3',
                        color: !commitMsg.trim() || staged.length === 0 ? (isDark ? '#666' : '#999') : '#fff',
                        border: 'none',
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
        </div>
    );
};
