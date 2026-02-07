import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { RecentEnvironment } from './types';
import type { AppState } from '../../types/store';

import {
    Clock,
    Star,
    Tag,
    Trash2,
    FolderOpen,
    ArrowRight,
    Briefcase,
    Smile,
    User
} from 'lucide-react';

const formatTimeAgo = (timestamp: number, t: TFunction) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} ${t('recent.time.years')}`;

    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} ${t('recent.time.months')}`;

    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} ${t('recent.time.days')}`;

    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} ${t('recent.time.hours')}`;

    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} ${t('recent.time.minutes')}`;

    return t('recent.time.now');
};

const LabelIcon = ({ label, size = 14 }: { label: string, size?: number }) => {
    switch (label) {
        case 'work': return <Briefcase size={size} color="#60a5fa" />;
        case 'fun': return <Smile size={size} color="#f472b6" />;
        case 'personal': return <User size={size} color="#4ade80" />;
        default: return <Tag size={size} color="#9ca3af" />;
    }
};

export const RecentEnvironments = ({ embedded = false }: { embedded?: boolean }) => {
    const { t } = useTranslation();
    const recentEnvironments = useStore(state => state.recentEnvironments);
    const removeRecent = useStore(state => state.removeRecent);
    const toggleFavorite = useStore(state => state.toggleFavorite);
    const setRecentLabel = useStore(state => state.setRecentLabel);
    const openWorkspace = useStore(state => state.openWorkspace);
    const setWorkspaceRoot = useStore(state => state.setWorkspaceRoot);
    const validateRecents = useStore(state => state.validateRecents);
    const setConfirmationModal = useStore(state => state.setConfirmationModal);
    const theme = useStore(state => state.theme);
    const isDark = theme === 'dark';

    useEffect(() => {
        void validateRecents();
    }, [validateRecents]);

    const handleOpen = async (path: string) => {
        if (window.electron) {
            const exists = await window.electron.fileSystem.checkExists(path);
            if (exists) {
                setWorkspaceRoot(path);
            } else {
                void validateRecents();
            }
        }
    };

    const sortedRecents = [...recentEnvironments].sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.lastOpened - a.lastOpened;
    });

    const favorites = sortedRecents.filter(r => r.isFavorite);
    const recents = sortedRecents.filter(r => !r.isFavorite);

    if (embedded) {
        const hasItems = favorites.length > 0 || recents.length > 0;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!hasItems && (
                    <div style={{ padding: '8px 0', opacity: 0.4, fontSize: '0.75rem', textAlign: 'center', color: isDark ? '#888' : '#666' }}>
                        <p>{t('recent.empty_message')}</p>
                    </div>
                )}

                {favorites.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: isDark ? '#555' : '#aaa',

                            letterSpacing: '0.05em',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Star size={10} fill={isDark ? '#444' : '#ddd'} color="transparent" />
                            {t('recent.favorites')}
                        </div>
                        {favorites.map(env => (
                            <EnvironmentRow
                                key={env.path}
                                env={env}
                                isDark={isDark}
                                onOpen={handleOpen}
                                onToggleFavorite={toggleFavorite}
                                onSetLabel={setRecentLabel}
                                onRemove={removeRecent}
                                setConfirmationModal={setConfirmationModal}
                                compact
                                t={t}
                            />
                        ))}
                    </div>
                )}
                {recents.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: isDark ? '#555' : '#aaa',

                            letterSpacing: '0.05em',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Clock size={10} color={isDark ? '#444' : '#ddd'} />
                            {t('recent.title')}
                        </div>
                        {recents.map(env => (
                            <EnvironmentRow
                                key={env.path}
                                env={env}
                                isDark={isDark}
                                onOpen={handleOpen}
                                onToggleFavorite={toggleFavorite}
                                onSetLabel={setRecentLabel}
                                onRemove={removeRecent}
                                setConfirmationModal={setConfirmationModal}
                                compact
                                t={t}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            overflowY: 'auto'
        }}>
            <div style={{
                maxWidth: '800px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 800,
                        marginBottom: '10px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {t('recent.welcome_back')}
                    </h1>
                    <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '1.1rem' }}>
                        {t('recent.select_env')}
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={() => {
                            void openWorkspace();
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 24px',
                            background: isDark ? '#2563eb' : '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <FolderOpen size={20} />
                        {t('recent.open_new')}
                    </button>
                </div>

                {favorites.length > 0 && (
                    <div>
                        <h2 style={{
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            marginBottom: '16px',
                            color: isDark ? '#e5e7eb' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Star size={20} fill="#eab308" color="#eab308" />
                            {t('recent.favorites')}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {favorites.map(env => (
                                <EnvironmentCard
                                    key={env.path}
                                    env={env}
                                    isDark={isDark}
                                    onOpen={handleOpen}
                                    onToggleFavorite={toggleFavorite}
                                    onSetLabel={setRecentLabel}
                                    onRemove={removeRecent}
                                    setConfirmationModal={setConfirmationModal}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {recents.length > 0 && (
                    <div>
                        <h2 style={{
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            marginBottom: '16px',
                            color: isDark ? '#e5e7eb' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Clock size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                            {t('recent.title')}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {recents.map(env => (
                                <EnvironmentRow
                                    key={env.path}
                                    env={env}
                                    isDark={isDark}
                                    onOpen={handleOpen}
                                    onToggleFavorite={toggleFavorite}
                                    onSetLabel={setRecentLabel}
                                    onRemove={removeRecent}
                                    setConfirmationModal={setConfirmationModal}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface EnvironmentProps {
    env: RecentEnvironment;
    isDark: boolean;
    onOpen: (path: string) => void | Promise<void>;
    onToggleFavorite: (path: string) => void | Promise<void>;
    onSetLabel: (path: string, label?: 'personal' | 'work' | 'fun' | 'other') => void | Promise<void>;
    onRemove: (path: string) => void | Promise<void>;
    setConfirmationModal: (config: AppState['confirmationModal']) => void;
    t: TFunction;
    compact?: boolean;
}

const EnvironmentCard = ({ env, isDark, onOpen, onToggleFavorite, onSetLabel, onRemove, setConfirmationModal, t }: EnvironmentProps) => {
    const [showActions, setShowActions] = useState(false);

    return (
        <div
            style={{
                position: 'relative',
                padding: '20px',
                background: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onClick={() => void onOpen(env.path)}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    padding: '8px',
                    background: isDark ? '#374151' : '#f3f4f6',
                    borderRadius: '10px',
                    color: isDark ? '#9ca3af' : '#6b7280'
                }}>
                    <FolderOpen size={24} />
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); void onToggleFavorite(env.path); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                    <Star size={20} fill={env.isFavorite ? "#eab308" : "none"} color="#eab308" />
                </button>
            </div>

            <div>
                <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: isDark ? '#f3f4f6' : '#111827',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {env.path.split(/[/\\]/).pop()}
                </h3>
                <p style={{
                    fontSize: '0.8rem',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {env.path}
                </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {env.label && <LabelIcon label={env.label} />}
                    <span style={{ fontSize: '0.75rem', color: isDark ? '#6b7280' : '#9ca3af' }}>
                        {formatTimeAgo(env.lastOpened, t)}
                    </span>
                </div>
            </div>

            {showActions && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '40px',
                    display: 'flex',
                    gap: '4px',
                    background: isDark ? '#1f2937' : '#fff',
                    padding: '4px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} onClick={e => e.stopPropagation()}>
                    <LabelSelector currentLabel={env.label} onSelect={(l) => { void onSetLabel(env.path, l); }} isDark={isDark} t={t} />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setConfirmationModal({
                                isOpen: true,
                                title: t('recent.remove_title') ?? 'Remover Recente',
                                message: t('recent.remove_confirm', { path: env.path }),
                                confirmLabel: t('app.common.remove') ?? 'Remover',
                                cancelLabel: t('app.common.cancel') ?? 'Cancelar',
                                variant: 'danger',
                                onConfirm: () => {
                                    void onRemove(env.path);
                                    setConfirmationModal(null);
                                },
                                onCancel: () => setConfirmationModal(null)
                            });
                        }}
                        style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        title={t('recent.remove')}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

const EnvironmentRow = ({ env, isDark, onOpen, onToggleFavorite, onSetLabel, onRemove, setConfirmationModal, compact, t }: EnvironmentProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: compact ? '4px 8px' : '12px 16px',
                background: compact ? 'transparent' : (isDark ? '#1f2937' : '#ffffff'),
                border: compact ? 'none' : `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: compact ? '4px' : '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                gap: compact ? '6px' : '16px',
                position: 'relative',
                margin: compact ? '1px 4px' : '0'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                setIsHovered(true);
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = compact ? 'transparent' : (isDark ? '#1f2937' : '#ffffff');
                setIsHovered(false);
            }}
            onClick={() => void onOpen(env.path)}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#666' : '#999'
            }}>
                <FolderOpen size={compact ? 14 : 20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        fontSize: compact ? '0.8rem' : '0.95rem',
                        fontWeight: compact ? 400 : 500,
                        color: isDark ? (isHovered ? '#fff' : '#ccc') : (isHovered ? '#000' : '#444'),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {env.path.split(/[/\\]/).pop()}
                    </span>
                    {env.label && (
                        <div style={{ opacity: isHovered ? 1 : 0.6 }}>
                            <LabelIcon label={env.label} size={10} />
                        </div>
                    )}
                </div>
                {!compact && (
                    <p style={{
                        fontSize: '0.75rem',
                        color: isDark ? '#9ca3af' : '#6b7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {env.path}
                    </p>
                )}
            </div>

            {!compact && (
                <div style={{ fontSize: '0.8rem', color: isDark ? '#6b7280' : '#9ca3af', minWidth: '100px', textAlign: 'right' }}>
                    {formatTimeAgo(env.lastOpened, t)}
                </div>
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s'
            }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={(e) => { e.stopPropagation(); void onToggleFavorite(env.path); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: env.isFavorite ? "#eab308" : (isDark ? '#555' : '#ccc') }}
                    title={t('recent.favorite')}
                >
                    <Star size={12} fill={env.isFavorite ? "#eab308" : "none"} />
                </button>
                <LabelSelector currentLabel={env.label} onSelect={(l) => { void onSetLabel(env.path, l); }} isDark={isDark} compact={compact} t={t} />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setConfirmationModal({
                            isOpen: true,
                            title: t('recent.remove_title') ?? 'Remover Recente',
                            message: t('recent.remove_confirm', { path: env.path }),
                            confirmLabel: t('app.common.remove') ?? 'Remover',
                            cancelLabel: t('app.common.cancel') ?? 'Cancelar',
                            variant: 'danger',
                            onConfirm: () => {
                                void onRemove(env.path);
                                setConfirmationModal(null);
                            },
                            onCancel: () => setConfirmationModal(null)
                        });
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: isDark ? '#555' : '#ccc' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = isDark ? '#555' : '#ccc'}
                    title={t('recent.remove')}
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {!compact && <ArrowRight size={16} color={isDark ? '#4b5563' : '#d1d5db'} />}
        </div>
    );
};

const LabelSelector = ({ currentLabel, onSelect, isDark, compact, t }: {
    currentLabel?: RecentEnvironment['label'];
    onSelect: (label?: RecentEnvironment['label']) => void;
    isDark: boolean;
    compact?: boolean;
    t: TFunction;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const labels: Exclude<RecentEnvironment['label'], undefined>[] = ['personal', 'work', 'fun', 'other'];

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: compact ? '2px' : '6px',
                    borderRadius: '4px',
                    color: isDark ? '#555' : '#ccc'
                }}
                onMouseEnter={e => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? '#555' : '#ccc'}
                title={t('recent.tag')}
            >
                <Tag size={compact ? 12 : 16} />
            </button>

            {isOpen && (
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: isDark ? '#1f2937' : '#fff',
                        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        zIndex: 101,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        minWidth: '120px'
                    }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(undefined); setIsOpen(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: isDark ? '#d1d5db' : '#4b5563',
                                fontSize: '0.85rem',
                                borderRadius: '4px'
                            }}
                        >
                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px dashed currentColor' }} />
                            {t('recent.none')}
                        </button>
                        {labels.map(label => (
                            <button
                                key={label}
                                onClick={(e) => { e.stopPropagation(); onSelect(label); setIsOpen(false); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px',
                                    background: currentLabel === label ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: isDark ? '#d1d5db' : '#4b5563',
                                    fontSize: '0.85rem',
                                    borderRadius: '4px',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ pointerEvents: 'none' }}><LabelIcon label={label} size={12} /></div>
                                {t(`recent.labels.${label}`)}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
