import React from 'react';
import { Settings, Sun, Moon, GitBranch, Box } from 'lucide-react';
import { useStore } from '../store/useStore';

export const SideRibbon: React.FC = () => {
    const {
        theme, toggleTheme,
        activeSidebarTab, setSidebarTab,
        openedFolder
    } = useStore();

    const isDark = theme === 'dark';

    const RibbonButton = ({ icon: Icon, active, onClick, title, bottom, disabled }: { icon: any, active?: boolean, onClick: () => void, title: string, bottom?: boolean, disabled?: boolean }) => (
        <button
            onClick={disabled ? undefined : onClick}
            title={title}
            disabled={disabled}
            style={{
                width: '40px',
                height: '40px',
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
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
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

    return (
        <div style={{
            width: '40px',
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
                title="Ambiente de Blueprints"
            />
            <RibbonButton
                icon={GitBranch}
                active={activeSidebarTab === 'git'}
                onClick={() => setSidebarTab('git')}
                title="Git (Controle de Versão)"
                disabled={!openedFolder}
            />

            <div style={{ flex: 1 }} />

            <RibbonButton
                icon={isDark ? Sun : Moon}
                onClick={toggleTheme}
                title={isDark ? "Modo Claro" : "Modo Escuro"}
            />
            <RibbonButton
                icon={Settings}
                active={activeSidebarTab === 'settings'}
                onClick={() => setSidebarTab('settings')}
                title="Configurações"
            />
        </div>
    );
};
