import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { PanelHeader } from './PanelHeader';

interface SidebarPanelProps {
    title: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    isDark: boolean;
    headerActions?: React.ReactNode;
    leftActions?: React.ReactNode;
    footer?: React.ReactNode;
}

/**
 * Standardized Sidebar Panel component for all modules.
 * Provides a consistent header, background, and layout.
 */
export const SidebarPanel: React.FC<SidebarPanelProps> = ({
    title,
    icon,
    children,
    isDark,
    headerActions,
    leftActions,
    footer
}) => {
    return (
        <div
            className="sidebar-panel-container"
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: isDark ? '#1a1a1a' : '#fff',
                borderRight: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`,
                overflow: 'hidden',
                color: isDark ? '#ccc' : '#444'
            }}
        >
            <header
                className="sidebar-panel-header"
                style={{
                    height: '32px',
                    minHeight: '32px',
                    flexShrink: 0,
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                    userSelect: 'none',
                    zIndex: 10
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    {leftActions && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {leftActions}
                            <div style={{ width: '1px', height: '14px', background: isDark ? '#333' : '#ddd', margin: '0 6px' }} />
                        </div>
                    )}
                    <PanelHeader title={title} icon={icon} isDark={isDark} />
                </div>
                {headerActions && (
                    <div className="sidebar-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {headerActions}
                    </div>
                )}
            </header>

            <main
                key={title}
                className="sidebar-panel-content animate-entrance"
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {children}
            </main>

            {footer && (
                <footer
                    className="sidebar-panel-footer"
                    style={{
                        borderTop: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                        zIndex: 10
                    }}
                >
                    {footer}
                </footer>
            )}
        </div>
    );
};
