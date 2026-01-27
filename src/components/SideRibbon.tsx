import React from 'react';
import { Files, Search, Library, Settings, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

export const SideRibbon: React.FC = () => {
    const {
        theme, toggleTheme,
        showSidebar, toggleSidebar,
        activeSidebarTab, setSidebarTab
    } = useStore();

    const isDark = theme === 'dark';

    const RibbonButton = ({ icon: Icon, active, onClick, title, bottom }: { icon: any, active?: boolean, onClick: () => void, title: string, bottom?: boolean }) => (
        <button
            onClick={onClick}
            title={title}
            style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: active ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#888' : '#666'),
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                marginTop: bottom ? 'auto' : 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
            onMouseLeave={(e) => e.currentTarget.style.color = active ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#888' : '#666')}
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
            zIndex: 20
        }}>
            <RibbonButton
                icon={Files}
                active={showSidebar && activeSidebarTab === 'explorer'}
                onClick={() => setSidebarTab('explorer')}
                title="Explorador de Arquivos"
            />
            <RibbonButton
                icon={Search}
                onClick={() => { }}
                title="Busca (Em breve)"
            />
            <RibbonButton
                icon={Library}
                active={showSidebar && activeSidebarTab === 'library'}
                onClick={() => setSidebarTab('library')}
                title="Biblioteca"
            />

            <div style={{ flex: 1 }} />

            <RibbonButton
                icon={isDark ? Sun : Moon}
                onClick={toggleTheme}
                title={isDark ? "Modo Claro" : "Modo Escuro"}
            />
            <RibbonButton
                icon={Settings}
                onClick={() => { }}
                title="Configurações"
            />
        </div>
    );
};
