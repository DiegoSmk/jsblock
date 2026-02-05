import React, { useState } from 'react';
import { X, Eye, EyeOff, RotateCcw, Layout, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../../components/../../store/useStore';
import { useTranslation } from 'react-i18next';

interface GitPanelConfigProps {
    isDark: boolean;
    onClose: () => void;
}

export const GitPanelConfig: React.FC<GitPanelConfigProps> = ({ isDark, onClose }) => {
    const { t } = useTranslation();
    const { gitPanelConfig, updateGitPanelConfig, resetGitPanelConfig } = useStore();
    const [isResetting, setIsResetting] = useState(false);

    const handleToggleSection = (sectionId: string) => {
        const newSections = gitPanelConfig.sections.map(s =>
            s.id === sectionId ? { ...s, visible: !s.visible } : s
        );
        updateGitPanelConfig({ sections: newSections });
    };

    const handleReset = () => {
        setIsResetting(true);
        resetGitPanelConfig();
        setTimeout(() => setIsResetting(false), 800);
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100%',
                height: '100%',
                background: isDark ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                animation: 'panelFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                borderLeft: `1px solid ${isDark ? '#333' : '#eee'}`
            }}
        >
            <style>{`
                @keyframes panelFadeIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        padding: '6px',
                        background: isDark ? '#2d2d2d' : '#f0f0f0',
                        borderRadius: '8px',
                        color: isDark ? '#4fc3f7' : '#0070f3'
                    }}>
                        <Layout size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isDark ? '#fff' : '#1a1a1a' }}>{t('git.info.panel_config.title')}</div>
                        <div style={{ fontSize: '0.65rem', color: isDark ? '#666' : '#999' }}>{t('git.info.panel_config.subtitle')}</div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        color: isDark ? '#888' : '#666',
                        display: 'flex',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = isDark ? '#333' : '#f0f0f0';
                        e.currentTarget.style.color = isDark ? '#fff' : '#000';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = isDark ? '#888' : '#666';
                    }}
                >
                    <X size={18} />
                </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {gitPanelConfig.sections.map((section, index) => (
                        <div
                            key={section.id}
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                borderRadius: '10px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease',
                                animation: `slideInUp 0.3s ease-out ${index * 0.05}s forwards`,
                                opacity: 0,
                                transform: 'translateY(10px)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: section.visible ? (isDark ? '#4ade80' : '#22c55e') : (isDark ? '#444' : '#ccc'),
                                    boxShadow: section.visible ? `0 0 8px ${isDark ? '#4ade8055' : '#22c55e55'}` : 'none',
                                    transition: 'all 0.3s'
                                }} />
                                <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: section.visible ? (isDark ? '#eee' : '#1a1a1a') : (isDark ? '#666' : '#999'),
                                    transition: 'all 0.3s'
                                }}>
                                    {section.label}
                                </span>
                            </div>
                            <button
                                onClick={() => handleToggleSection(section.id)}
                                style={{
                                    background: section.visible ? (isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(34, 197, 94, 0.1)') : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    color: section.visible ? (isDark ? '#4ade80' : '#22c55e') : (isDark ? '#888' : '#666'),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                            >
                                {section.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                {section.visible ? t('git.info.panel_config.visible') : t('git.info.panel_config.hidden')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '20px',
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'
            }}>
                <button
                    onClick={handleReset}
                    disabled={isResetting}
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: isResetting ? 'default' : 'pointer',
                        color: isDark ? '#aaa' : '#666',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                        if (!isResetting) {
                            e.currentTarget.style.background = isDark ? '#333' : '#f9f9f9';
                            e.currentTarget.style.borderColor = isDark ? '#666' : '#bbb';
                        }
                    }}
                    onMouseLeave={e => {
                        if (!isResetting) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd';
                        }
                    }}
                >
                    {isResetting ? <CheckCircle2 size={16} color="#4ade80" /> : <RotateCcw size={16} />}
                    {isResetting ? t('git.info.panel_config.restored') : t('git.info.panel_config.reset')}
                </button>
            </div>
        </div>
    );
};
