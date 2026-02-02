import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import {
    History as HistoryIcon,
    Network,
    Info,
    Files,
    RefreshCw
} from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { useTranslation } from 'react-i18next';

// Components
import { SidebarPanel } from './ui/SidebarPanel';
import { FileExplorer } from './FileExplorer';
import { FunctionLibrary } from './FunctionLibrary';
import { ExtensionsView } from './ExtensionsView';
import { CommitHistory } from './git/CommitHistory';
import { GitGraphView } from './git/GitGraphView';
import { GitInfoPanel } from './git/GitInfoPanel';

export const SidebarContainer: React.FC = () => {
    const { t } = useTranslation();
    const {
        layout,
        activeSidebarTab,
        git,
        theme,
        setSidebarWidth,
        refreshGit
    } = useStore(useShallow(state => ({
        layout: state.layout,
        activeSidebarTab: state.activeSidebarTab,
        git: state.git,
        theme: state.theme,
        setSidebarWidth: state.setSidebarWidth,
        refreshGit: state.refreshGit
    })));

    const isDark = theme === 'dark';
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);

    // Sash Drag Logic
    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        let animationFrameId: number;

        const handleMouseMove = (e: MouseEvent) => {
            animationFrameId = requestAnimationFrame(() => {
                // Calculate new width based on mouse position
                // Assuming sidebar is on the left
                // e.clientX is roughly the new width
                // We subtract the ribbon width (approx 50px) if we want absolute precision relative to ribbon,
                // but usually clientX includes the ribbon.
                // However, the SidebarContainer is placed *after* the ribbon in flex.
                // So width = clientX - ribbonWidth.
                // Let's assume standard ribbon width from design constants or hardcoded approx.
                // Better approach: Calculate relative to the sidebar's start position.
                if (sidebarRef.current) {
                   const rect = sidebarRef.current.getBoundingClientRect();
                   // If the sash is at the right edge, the width is event.clientX - rect.left
                   const newWidth = Math.round(e.clientX - rect.left);
                   setSidebarWidth(newWidth);
                }
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        // Add a class to body to force cursor everywhere
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, setSidebarWidth]);

    if (!layout.sidebar.isVisible) return null;

    // Render Logic based on active tab
    const renderContent = () => {
        switch (activeSidebarTab) {
            case 'explorer':
                return (
                    <SidebarPanel
                        isDark={isDark}
                        title={t('app.explorer')}
                        icon={Files}
                    >
                        <FileExplorer />
                    </SidebarPanel>
                );
            case 'library':
                return (
                    <SidebarPanel
                        isDark={isDark}
                        title={t('app.function_library')}
                        icon={Network}
                    >
                        <ReactFlowProvider>
                            <FunctionLibrary />
                        </ReactFlowProvider>
                    </SidebarPanel>
                );
            case 'git':
                return (
                    <SidebarPanel
                        isDark={isDark}
                        title={
                            git.sidebarView === 'graph' ? t('git.graph.title')
                                : git.sidebarView === 'info' ? t('git.info.title')
                                    : t('git.status.history_list')
                        }
                        icon={
                            git.sidebarView === 'graph' ? Network
                                : git.sidebarView === 'info' ? Info
                                    : HistoryIcon
                        }
                        headerActions={
                            <button
                                onClick={(e) => { e.stopPropagation(); void refreshGit(); }}
                                title={t('git.common.refresh')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    color: isDark ? '#888' : '#777',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <RefreshCw size={14} />
                            </button>
                        }
                    >
                        {git.sidebarView === 'graph' ? <GitGraphView hideHeader />
                            : git.sidebarView === 'info' ? <GitInfoPanel isDark={isDark} logs={git.log} hideHeader />
                                : <CommitHistory isDark={isDark} logs={git.log} isOpen={true} hideHeader />}
                    </SidebarPanel>
                );
            case 'extensions':
                return <ExtensionsView />;
            default:
                return null;
        }
    };

    return (
        <div
            ref={sidebarRef}
            style={{
                width: layout.sidebar.width,
                height: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                backgroundColor: isDark ? '#121212' : '#fafafa', // Match previous design
                borderRight: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`,
            }}
        >
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {renderContent()}
            </div>

            {/* Sash */}
            <div
                onMouseDown={startResizing}
                style={{
                    position: 'absolute',
                    top: 0,
                    right: -2, // Overlap border slightly
                    width: '4px',
                    height: '100%',
                    cursor: 'col-resize',
                    zIndex: 100,
                    backgroundColor: isResizing ? (isDark ? '#007fd4' : '#007fd4') : 'transparent',
                    transition: 'background-color 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isResizing ? (isDark ? '#007fd4' : '#007fd4') : (isDark ? '#007fd4' : '#007fd4')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isResizing ? (isDark ? '#007fd4' : '#007fd4') : 'transparent'}
            />
        </div>
    );
};
