import React, { useState, useEffect, useRef } from 'react';
import {
    FolderOpen, X, Minus, Square, Info, LogOut,
    History as HistoryIcon, Network, PanelLeft, Files,
    Library, ChevronRight, File as FileIcon, Folder
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { DESIGN_TOKENS } from '../constants/design';


import { ScrollArea } from '../components/ui/ScrollArea';
import { GlassButton } from '../components/ui/GlassButton';

interface BreadcrumbItemProps {
    name: string;
    path: string;
    isDark: boolean;
    onSelect: (path: string) => void;
    isLast: boolean;
}

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ name, path, isDark, onSelect, isLast }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<{ name: string; isDirectory: boolean }[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClick = () => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        if (window.electron) {
            void (async () => {
                try {
                    const entries = await window.electron.fileSystem.readDir(path);

                    // Sort folders first
                    const sorted = (entries as { name: string; isDirectory: boolean }[]).sort((a, b) => {
                        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
                        return a.isDirectory ? -1 : 1;
                    });
                    setItems(sorted);
                    setIsOpen(true);
                } catch (e: unknown) {
                    console.error('Failed to read dir', e instanceof Error ? e.message : String(e));
                }
            })();
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
                onClick={handleClick}
                style={{
                    background: isOpen ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: isLast ? (isDark ? '#eee' : '#333') : (isDark ? '#aaa' : '#666'),
                    cursor: 'pointer',
                    padding: '2px 6px',
                    fontSize: '12px',
                    fontWeight: isLast ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                    e.currentTarget.style.color = isDark ? '#fff' : '#000';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = isOpen ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : 'transparent';
                    e.currentTarget.style.color = isLast ? (isDark ? '#eee' : '#333') : (isDark ? '#aaa' : '#666');
                }}
            >
                {!isLast && <Folder size={12} opacity={0.6} />}
                {name}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: isDark ? '#1e1e1e' : '#fff',
                    border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    minWidth: '220px',
                    zIndex: 1000,
                    padding: '4px'
                }}>
                    <ScrollArea maxHeight="300px">
                        {items.map(item => (
                            <div
                                key={item.name}
                                onClick={() => {
                                    if (!item.isDirectory) {
                                        onSelect(item.name);
                                    }
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '6px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: item.isDirectory ? 'default' : 'pointer',
                                    borderRadius: '4px',
                                    color: isDark ? '#ccc' : '#444',
                                    transition: 'all 0.1s'
                                }}
                                onMouseEnter={e => {
                                    if (!item.isDirectory) {
                                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                                        e.currentTarget.style.color = isDark ? '#fff' : '#000';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!item.isDirectory) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = isDark ? '#ccc' : '#444';
                                    }
                                }}
                            >
                                {item.isDirectory ? <Folder size={14} color={isDark ? '#4fc3f7' : '#0070f3'} /> : <FileIcon size={14} color={isDark ? '#aaa' : '#666'} />}
                                <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                            </div>
                        ))}
                        {items.length === 0 && <div style={{ padding: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>Empty Folder</div>}
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};

const Breadcrumbs: React.FC<{
    openedFolder: string;
    selectedFile: string;
    isDark: boolean;
    setSelectedFile: (path: string) => Promise<void>;
}> = ({ openedFolder, selectedFile, isDark, setSelectedFile }) => {
    // Calculate segments
    // openedFolder: /a/b
    // selectedFile: /a/b/c/d/e.ts
    // relative: c/d/e.ts
    // parts: [c, d, e.ts]
    // paths:
    // c -> /a/b/c
    // d -> /a/b/c/d
    // e.ts -> /a/b/c/d (parent dir!)

    // We want the dropdown to show contents of the directory represented by the segment.
    // For 'c', we want contents of 'c'.
    // For 'd', we want contents of 'd'.
    // For 'e.ts', we want contents of 'd' (siblings).

    const relativePath = selectedFile.startsWith(openedFolder)
        ? selectedFile.slice(openedFolder.length).replace(/^[\\/]/, '')
        : selectedFile;
    const parts = relativePath.split(/[\\/]/);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '8px' }}>
            {parts.map((part, index) => {
                const isLast = index === parts.length - 1;
                // Construct path for this segment
                const segmentPath = openedFolder + '/' + parts.slice(0, index + 1).join('/');

                // If it is the last one (file), the path to read should be the parent
                const dirToRead = isLast
                    ? openedFolder + '/' + parts.slice(0, index).join('/')
                    : segmentPath;

                return (
                    <div key={segmentPath} style={{ display: 'flex', alignItems: 'center' }}>
                        <BreadcrumbItem
                            name={part}
                            path={dirToRead}
                            isDark={isDark}
                            onSelect={(p) => {
                                // p will be name of selected file
                                // We need to construct full path
                                // dirToRead + '/' + p
                                void setSelectedFile(`${dirToRead}/${p}`).catch(err => {
                                    if (err instanceof Error && err.message === 'cancel') return;
                                    console.error('Breadcrumb selection failed', err);
                                });
                            }}
                            isLast={isLast}
                        />
                        {!isLast && <ChevronRight size={12} style={{ opacity: 0.5, margin: '0 2px' }} color={isDark ? '#666' : '#999'} />}
                    </div>
                );
            })}
        </div>
    );
};

interface AppHeaderProps {
    isDark: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isDark }) => {
    const { t } = useTranslation();
    const {
        activeSidebarTab,
        toggleSidebar,
        setSidebarTab,
        selectedFile,
        setSelectedFile,
        setConfirmationModal,
        openedFolder,
        openModal,
        git,
        setGitSidebarView,
        layout,
        openWorkspace,
        setWorkspaceRoot
    } = useStore();

    const showSidebar = layout.sidebar.isVisible;
    const folderName = openedFolder ? openedFolder.split(/[\\/]/).pop() : null;


    return (
        <header style={{
            height: DESIGN_TOKENS.RIBBON_WIDTH,
            minHeight: DESIGN_TOKENS.RIBBON_WIDTH,
            flexShrink: 0,
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
                                // Modal closed (no-op)
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
                                            // Modal closed (no-op)
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
                    selectedFile && openedFolder ? (
                        <Breadcrumbs
                            openedFolder={openedFolder}
                            selectedFile={selectedFile}
                            isDark={isDark}
                            setSelectedFile={setSelectedFile}
                        />
                    ) : (
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
                    )
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
                    <GlassButton
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
                                        setWorkspaceRoot(null);
                                        void setSelectedFile(null).catch(() => { });
                                        setConfirmationModal(null);
                                    },
                                    onCancel: () => setConfirmationModal(null)
                                });
                            } else {
                                void openWorkspace();
                            }
                        }}
                        isDark={isDark}
                        icon={openedFolder ? LogOut : FolderOpen}
                        label={openedFolder ? t('app.window_controls.close') : t('app.open')}
                    />

                    {/* Beta Badge (Visual Style Only) */}
                    <div style={{ pointerEvents: 'none', marginLeft: '8px' }}>
                        <GlassButton
                            onClick={() => { /* No-op (Beta Badge) */ }}
                            title="Versão Beta"
                            isDark={isDark}
                            variant="primary"
                            icon={Info}
                            label="Beta"
                        />
                    </div>

                    {/* Window Controls */}
                    <div style={{ display: 'flex', marginLeft: '8px', borderLeft: `1px solid ${isDark ? '#333' : '#ddd'}`, paddingLeft: '8px' }}>
                        <button
                            onClick={() => {
                                window.electron?.windowMinimize();
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
                                window.electron?.windowMaximize();
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
                                window.electron?.windowClose();
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
