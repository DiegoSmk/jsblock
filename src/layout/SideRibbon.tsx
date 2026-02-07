import React from 'react';
import { Settings, Sun, Moon, GitBranch, Box, Blocks, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { DESIGN_TOKENS } from '../constants/design';
import type { LucideIcon } from 'lucide-react';

interface RibbonButtonProps {
    icon: LucideIcon;
    active?: boolean;
    onClick: () => void;
    title: string;
    bottom?: boolean;
    disabled?: boolean;
    isDark: boolean;
}

const RibbonButton: React.FC<RibbonButtonProps> = ({
    icon: Icon,
    active,
    onClick,
    title,
    bottom,
    disabled,
    isDark
}) => (
    <button
        onClick={disabled ? undefined : onClick}
        title={title}
        disabled={disabled}
        style={{
            width: DESIGN_TOKENS.RIBBON_WIDTH,
            height: DESIGN_TOKENS.RIBBON_WIDTH,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: disabled ? (isDark ? '#333' : '#ccc') : active ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#888' : '#666'),
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
            marginTop: bottom ? 'auto' : 0,
            opacity: disabled ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.color = isDark ? '#fff' : '#000';
        }}
        onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.color = active ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#888' : '#666');
        }}
    >
        <Icon size={DESIGN_TOKENS.RIBBON_ICON_SIZE} strokeWidth={active ? 2.5 : 2} />
        {active && (
            <div style={{
                position: 'absolute',
                left: 0,
                top: '10px',
                bottom: '10px',
                width: '2px',
                background: isDark ? '#4fc3f7' : '#0070f3',
                borderRadius: '0 4px 4px 0'
            }} />
        )}
    </button>
);

export const SideRibbon: React.FC = () => {
    const { t } = useTranslation();
    const {
        theme, toggleTheme,
        activeSidebarTab, setSidebarTab,
        openedFolder
    } = useStore();

    const isDark = theme === 'dark';

    return (
        <div style={{
            width: DESIGN_TOKENS.RIBBON_WIDTH,
            height: '100%',
            backgroundColor: isDark ? '#1a1a1a' : '#e3e5e8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 0',
            borderRight: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`,
            zIndex: 20,
            position: 'relative' // For absolute positioning inside
        }}>
            <RibbonButton
                icon={Box}
                active={activeSidebarTab === 'explorer' || activeSidebarTab === 'library'}
                onClick={() => setSidebarTab('explorer')}
                title={t('app.tooltips.blueprints')}
                isDark={isDark}
            />
            <RibbonButton
                icon={Search}
                active={activeSidebarTab === 'search'}
                onClick={() => setSidebarTab('search')}
                title={t('app.search')} // Need to check if this key exists or add it
                disabled={!openedFolder}
                isDark={isDark}
            />
            <RibbonButton
                icon={GitBranch}
                active={activeSidebarTab === 'git'}
                onClick={() => setSidebarTab('git')}
                title={t('app.tooltips.git')}
                disabled={!openedFolder}
                isDark={isDark}
            />
            <RibbonButton
                icon={Blocks}
                active={activeSidebarTab === 'extensions'}
                onClick={() => setSidebarTab('extensions')}
                title={t('app.tooltips.extensions')}
                isDark={isDark}
            />

            <div style={{ flex: 1 }} />

            <RibbonButton
                icon={isDark ? Sun : Moon}
                onClick={toggleTheme}
                title={isDark ? t('app.tooltips.theme_light') : t('app.tooltips.theme_dark')}
                isDark={isDark}
            />
            <RibbonButton
                icon={Settings}
                active={activeSidebarTab === 'settings'}
                onClick={() => setSidebarTab('settings')}
                title={t('app.tooltips.settings')}
                isDark={isDark}
            />
        </div>
    );
};
