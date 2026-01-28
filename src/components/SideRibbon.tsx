import React from 'react';
import { Files, Search, Settings, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

export const SideRibbon: React.FC = () => {
    const {
        theme, toggleTheme,
        showSidebar,
        activeSidebarTab, setSidebarTab,
        autoSave, toggleAutoSave
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


            <div style={{ flex: 1 }} />

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '12px',
                borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`,
                marginBottom: '8px',
                width: '100%'
            }}>
                <button
                    onClick={toggleAutoSave}
                    title={autoSave ? "Desativar Auto-save" : "Ativar Auto-save"}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: autoSave ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#555' : '#ccc'),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        fontSize: '9px',
                        fontWeight: 700,
                        gap: '2px',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{
                        width: '24px',
                        height: '14px',
                        backgroundColor: autoSave ? (isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.1)') : (isDark ? '#333' : '#eee'),
                        borderRadius: '10px',
                        position: 'relative',
                        border: `1px solid ${autoSave ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#444' : '#ddd')}`
                    }}>
                        <div style={{
                            position: 'absolute',
                            left: autoSave ? '11px' : '2px',
                            top: '2px',
                            width: '8px',
                            height: '8px',
                            backgroundColor: autoSave ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#666' : '#bbb'),
                            borderRadius: '50%',
                            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                    </div>
                    <span>AUTO</span>
                </button>
            </div>

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
