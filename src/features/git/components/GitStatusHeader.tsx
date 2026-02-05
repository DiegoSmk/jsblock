import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, User, Settings, Globe, FileText, ChevronDown, EyeOff, Folder, Briefcase, Sparkles, Smile } from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';
import { BranchSwitcher } from './BranchSwitcher';
import { ScrollArea } from '../../../components/ui/ScrollArea';
import { useStore } from '../../../store/useStore';

interface GitStatusHeaderProps {
    isDark: boolean;
    isLoading: boolean;
    onRefresh: () => void;
    onOpenTemplateModal: () => void;
    onSelectTemplate: (content: string) => void;
    onOpenIgnoreModal: () => void;
    onLoadIgnorePatterns: () => void;
    ignoredPatterns: string[];
    showAuthorMenu: boolean;
    setShowAuthorMenu: (show: boolean) => void;
    setAuthorConfigBuffer: (config: { name: string, email: string, isGlobal: boolean }) => void;
    setShowAuthorConfigModal: (show: boolean) => void;
}

export const GitStatusHeader: React.FC<GitStatusHeaderProps> = ({
    isDark, isLoading, onRefresh,
    onOpenTemplateModal, onSelectTemplate,
    onOpenIgnoreModal, onLoadIgnorePatterns, ignoredPatterns,
    showAuthorMenu, setShowAuthorMenu, setAuthorConfigBuffer, setShowAuthorConfigModal
}) => {
    const { t } = useTranslation();
    const { git, commitTemplates, gitProfiles, setGitConfig, resetToGlobal } = useStore();

    // Local state for dropdowns
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
    const [isIgnoreDropdownOpen, setIsIgnoreDropdownOpen] = useState(false);

    const authorMenuRef = useRef<HTMLDivElement>(null);
    const templateDropdownRef = useRef<HTMLDivElement>(null);
    const ignoreDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (authorMenuRef.current && !authorMenuRef.current.contains(event.target as Node)) {
                setShowAuthorMenu(false);
            }
            if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
                setIsTemplateDropdownOpen(false);
            }
            if (ignoreDropdownRef.current && !ignoreDropdownRef.current.contains(event.target as Node)) {
                setIsIgnoreDropdownOpen(false);
            }
        };

        if (showAuthorMenu || isTemplateDropdownOpen || isIgnoreDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAuthorMenu, isTemplateDropdownOpen, isIgnoreDropdownOpen, setShowAuthorMenu]);

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

    return (
        <div
            className="animate-entrance"
            style={{
                padding: '12px 20px',
                borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animationDelay: '0.05s',
                opacity: 0,
                position: 'relative',
                zIndex: 30
            }}
        >
            <BranchSwitcher isDark={isDark} />

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Git Ignore Dropdown */}
                <div style={{ position: 'relative' }} ref={ignoreDropdownRef}>
                    <Tooltip content={t('git.status.ignore_tooltip')} side="bottom">
                        <button
                            onClick={() => {
                                if (!isIgnoreDropdownOpen) onLoadIgnorePatterns();
                                setIsIgnoreDropdownOpen(!isIgnoreDropdownOpen);
                            }}
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
                        >
                            <EyeOff size={14} />
                            <ChevronDown size={12} style={{ transform: isIgnoreDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                    </Tooltip>

                    {isIgnoreDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            background: isDark ? '#1a1a1a' : '#fff',
                            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            minWidth: '280px',
                            boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            overflow: 'hidden',
                            transformOrigin: 'top right',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* ... Ignore Content ... */}
                            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#666' : '#999' }}>
                                {t('git.modals.ignore.title')}
                            </div>
                            <div style={{ height: '200px' }}>
                                <ScrollArea style={{ height: '100%' }}>
                                    {ignoredPatterns.length === 0 ? (
                                        <div style={{ padding: '12px', fontSize: '0.75rem', color: isDark ? '#666' : '#999', fontStyle: 'italic', textAlign: 'center' }}>
                                            Nenhum padrão definido.
                                        </div>
                                    ) : (
                                        ignoredPatterns.map((pattern) => (
                                            <div key={pattern} style={{ padding: '6px 12px', fontSize: '0.8rem', color: isDark ? '#ddd' : '#333', borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#f5f5f5'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {pattern.endsWith('/') ? <Folder size={12} /> : <FileText size={12} />}
                                                {pattern}
                                            </div>
                                        ))
                                    )}
                                </ScrollArea>
                            </div>
                            <div style={{ padding: '8px', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, background: isDark ? '#222' : '#f9fafb' }}>
                                <button
                                    onClick={() => {
                                        onOpenIgnoreModal();
                                        setIsIgnoreDropdownOpen(false);
                                    }}
                                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: 'none', background: isDark ? '#333' : '#e5e7eb', color: isDark ? '#ccc' : '#666', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <Settings size={12} /> {t('git.status.ignore_tooltip')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Templates Dropdown */}
                <div style={{ position: 'relative' }} ref={templateDropdownRef}>
                    <Tooltip content={t('git.status.template_tooltip')} side="bottom">
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
                        >
                            <FileText size={14} />
                            <ChevronDown size={12} style={{ transform: isTemplateDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                    </Tooltip>

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
                            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#666' : '#999' }}>
                                {t('git.status.template_tooltip')}
                            </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {commitTemplates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => {
                                            onSelectTemplate(template.content);
                                            setIsTemplateDropdownOpen(false);
                                        }}
                                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: isDark ? '#ddd' : '#333', borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#f5f5f5'}` }}
                                    >
                                        <FileText size={14} color={isDark ? '#4fc3f7' : '#0070f3'} />
                                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '8px', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, background: isDark ? '#222' : '#f9fafb' }}>
                                <button
                                    onClick={() => {
                                        onOpenTemplateModal();
                                        setIsTemplateDropdownOpen(false);
                                    }}
                                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: 'none', background: isDark ? '#333' : '#e5e7eb', color: isDark ? '#ccc' : '#666', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <Settings size={12} /> {t('git.status.template_tooltip')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <Tooltip content={t('git.status.refresh_tooltip')} side="bottom">
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        style={{ background: isDark ? '#2d2d2d' : '#f5f5f5', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </Tooltip>

                {/* Author Avatar Menu */}
                <div style={{ position: 'relative' }} ref={authorMenuRef}>
                    <Tooltip content={git.projectAuthor?.name ?? git.globalAuthor?.name ?? t('git.modals.author.title')} side="bottom">
                        <div
                            onClick={() => setShowAuthorMenu(!showAuthorMenu)}
                            style={{ width: '32px', height: '32px', borderRadius: '8px', background: isDark ? '#2d2d2d' : '#f5f5f5', border: `1px solid ${isDark ? '#444' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isDark ? '#aaa' : '#666' }}
                        >
                            <User size={16} />
                        </div>
                    </Tooltip>

                    {showAuthorMenu && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: isDark ? '#1a1a1a' : '#fff', border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, borderRadius: '8px', minWidth: '280px', boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, overflow: 'hidden' }}>
                            <div style={{ padding: '12px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                                <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', marginBottom: '6px', letterSpacing: '0.5px' }}>{t('git.graph.author')}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#4fc3f7' : '#0070f3' }}>
                                        <User size={14} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {git.projectAuthor?.name ?? git.globalAuthor?.name ?? t('git.modals.author.title')}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {git.projectAuthor?.email ?? git.globalAuthor?.email ?? ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '8px', borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                                <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', padding: '4px 8px', marginBottom: '4px', letterSpacing: '0.5px' }}>Trocar para</div>
                                {git.globalAuthor && git.projectAuthor && (
                                    <div
                                        onClick={() => { void resetToGlobal(); setShowAuthorMenu(false); }}
                                        style={{ padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}
                                    >
                                        <Globe size={14} color="#10b981" />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600 }}>{git.globalAuthor.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>{git.globalAuthor.email} (Global)</div>
                                        </div>
                                    </div>
                                )}
                                {gitProfiles.map(profile => (
                                    <div
                                        key={profile.id}
                                        onClick={() => {
                                            void setGitConfig({ name: profile.name, email: profile.email }, false);
                                            setShowAuthorMenu(false);
                                        }}
                                        style={{ padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}
                                    >
                                        <div style={{ color: getTagColor(profile.tag) }}>{getTagIcon(profile.tag)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600 }}>{profile.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999' }}>{profile.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '8px' }}>
                                <div
                                    onClick={() => {
                                        setShowAuthorMenu(false);
                                        setAuthorConfigBuffer({ name: '', email: '', isGlobal: false });
                                        setShowAuthorConfigModal(true);
                                    }}
                                    style={{ padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: isDark ? '#4fc3f7' : '#0070f3' }}
                                >
                                    <Settings size={14} /> {t('git.modals.author.title')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
