import React from 'react';
import {
    FolderOpen, X, Minus, Square, Info, LogOut,
    History as HistoryIcon, Network, RefreshCw, PanelLeft, Files,
    Library
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { DESIGN_TOKENS } from '../../constants/design';
import type { ElectronAPI } from '../../types/electron';

interface AppHeaderProps {
    isDark: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isDark }) => {
    const { t } = useTranslation();
    const {
        activeSidebarTab,
        toggleSidebar,
        setSidebarTab,
        setOpenedFolder,
        setSelectedFile,
        setConfirmationModal,
        openedFolder,
        openModal,
        git,
        setGitSidebarView,
        layout,
        forceLayout
    } = useStore();

    const showSidebar = layout.sidebar.isVisible;
    const folderName = openedFolder ? openedFolder.split(/[\\/]/).pop() : null;


    return (
        <header style={{
            height: DESIGN_TOKENS.RIBBON_WIDTH,
            padding: '0 8px',
            background: isDark ? '#1e1e1e' : '#f3f4f6',
            borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            userSelect: 'none',
            WebkitAppRegion: 'drag'
        } as React.CSSProperties}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                {['explorer', 'library', 'git'].includes(activeSidebarTab) && (
                    <button
                        onClick={() => toggleSidebar()}
                        title={showSidebar ? t('app.hide_explorer') : t('app.show_explorer')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: showSidebar ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#888' : '#666'),
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <PanelLeft size={20} strokeWidth={2} />
                    </button>
                )}

                {showSidebar && (activeSidebarTab === 'explorer' || activeSidebarTab === 'library') && (
                    <div style={{ display: 'flex', gap: '2px', marginLeft: '4px', paddingRight: '12px', borderRight: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
                        <button
                            onClick={() => setSidebarTab('explorer')}
                            title="Explorador de Arquivos"
                            style={{
                                background: activeSidebarTab === 'explorer' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: activeSidebarTab === 'explorer' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                                padding: '6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Files size={18} />
                        </button>
                        <button
                            onClick={() => openedFolder && setSidebarTab('library')}
                            title="Biblioteca de Funções"
                            disabled={!openedFolder}
                            style={{
                                background: activeSidebarTab === 'library' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                border: 'none',
                                cursor: !openedFolder ? 'default' : 'pointer',
                                color: !openedFolder ? (isDark ? '#333' : '#ccc') : activeSidebarTab === 'library' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                                padding: '6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: !openedFolder ? 0.5 : 1
                            }}
                        >
                            <Library size={18} />
                        </button>
                    </div>
                )}

                {showSidebar && activeSidebarTab === 'git' && (
                    <div style={{ display: 'flex', gap: '2px', marginLeft: '4px', paddingRight: '12px', borderRight: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
                        <button
                            onClick={() => setGitSidebarView('info')}
                            title={t('git.info.title')}
                            style={{
                                background: git.sidebarView === 'info' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: git.sidebarView === 'info' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                                padding: '6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Info size={18} />
                        </button>
                        <button
                            onClick={() => setGitSidebarView('history')}
                            title={t('git.status.history_list')}
                            style={{
                                background: git.sidebarView === 'history' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: git.sidebarView === 'history' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                                padding: '6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <HistoryIcon size={18} />
                        </button>
                        <button
                            onClick={() => setGitSidebarView('graph')}
                            title={t('git.graph.title')}
                            style={{
                                background: git.sidebarView === 'graph' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: git.sidebarView === 'graph' ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#666'),
                                padding: '6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Network size={18} />
                        </button>
                    </div>
                )}


                <div
                    className="app-logo"
                    style={{ transform: 'scale(0.8)', cursor: 'pointer', marginLeft: '8px' }}
                    onClick={() => {
                        const randomIndex = Math.floor(Math.random() * 5); // Fallback random
                        openModal({
                            title: 'About',
                            initialValue: '',
                            type: 'about',
                            payload: { fallenIndex: randomIndex },
                            confirmLabel: 'Close',
                            onSubmit: () => {
                                // Modal closed
                            }
                        });
                    }}
                >
                    <span className="logo-js" style={{ fontSize: '14px' }}>JS</span>
                    <div className="logo-blocks" style={{ gap: '2px' }}>
                        {['B', 'L', 'O', 'C', 'K'].map((letter) => (
                            <div
                                key={`logo-${letter}`}
                                className="logo-block"
                                style={{
                                    width: '14px',
                                    height: '14px',
                                    fontSize: '9px',
                                    borderRadius: '3px',
                                    background: 'transparent',
                                    color: isDark ? '#fff' : '#000',
                                    fontWeight: 700
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const randomIndex = Math.floor(Math.random() * 5);
                                    openModal({
                                        title: 'About',
                                        initialValue: '',
                                        type: 'about',
                                        payload: { fallenIndex: randomIndex },
                                        confirmLabel: 'Close',
                                        onSubmit: () => {
                                            // Modal closed
                                        }
                                    });
                                }}
                            >
                                <span className="logo-letter-visual">{letter}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {activeSidebarTab === 'settings' && (
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.5, color: isDark ? '#fff' : '#000', marginLeft: '12px' }}>
                        System / Settings
                    </div>
                )}

                {folderName && activeSidebarTab !== 'settings' && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                        color: isDark ? '#aaa' : '#666'
                    }}>
                        <FolderOpen size={12} />
                        <span style={{ fontWeight: 500 }}>{folderName}</span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <div
                    style={{
                        marginRight: '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    <button
                        onClick={() => {
                            forceLayout();
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDark ? '#aaa' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <RefreshCw size={14} />
                        <span>{t('app.layout')}</span>
                    </button>

                    <button
                        onClick={() => {
                            if (openedFolder) {
                                setConfirmationModal({
                                    isOpen: true,
                                    title: t('app.confirm_close_folder.title') ?? 'Fechar Projeto',
                                    message: t('app.confirm_close_folder.message') ?? 'Tem certeza que deseja fechar a pasta atual? Quaisquer alterações não salvas serão perdidas.',
                                    confirmLabel: t('app.window_controls.close') ?? 'Fechar',
                                    cancelLabel: t('app.common.cancel') ?? 'Cancelar',
                                    variant: 'warning',
                                    onConfirm: () => {
                                        setOpenedFolder(null);
                                        void setSelectedFile(null);
                                        setConfirmationModal(null);
                                    },
                                    onCancel: () => setConfirmationModal(null)
                                });
                            } else {
                                const electronAPI = (window as unknown as { electronAPI?: ElectronAPI }).electronAPI;
                                if (electronAPI) {
                                    electronAPI.selectFolder()
                                        .then((path) => {
                                            if (path) setOpenedFolder(path);
                                        })
                                        .catch(console.error);
                                }
                            }
                        }}
                        style={{
                            background: isDark ? '#2d2d2d' : '#fff',
                            border: `1px solid ${isDark ? '#444' : '#ccc'}`,
                            cursor: 'pointer',
                            color: isDark ? '#ddd' : '#444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '4px'
                        }}
                    >
                        {openedFolder ? <LogOut size={14} /> : <FolderOpen size={14} />}
                        <span>{openedFolder ? t('app.window_controls.close') : t('app.open')}</span>
                    </button>

                    {/* Window Controls */}
                    <div style={{ display: 'flex', marginLeft: '8px', borderLeft: `1px solid ${isDark ? '#333' : '#ddd'}`, paddingLeft: '8px' }}>
                        <button
                            onClick={() => {
                                void window.electronAPI.windowMinimize();
                            }}
                            title={t('app.window_controls.minimize')}
                            style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', padding: '4px 8px', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                            onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
                        >
                            <Minus size={16} />
                        </button>
                        <button
                            onClick={() => {
                                void window.electronAPI.windowMaximize();
                            }}
                            title={t('app.window_controls.maximize')}
                            style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', padding: '4px 8px', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                            onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
                        >
                            <Square size={14} />
                        </button>
                        <button
                            onClick={() => {
                                void window.electronAPI.windowClose();
                            }}
                            title={t('app.window_controls.close')}
                            style={{ background: 'transparent', border: 'none', color: isDark ? '#aaa' : '#666', padding: '4px 8px', cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#aaa' : '#666'}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
