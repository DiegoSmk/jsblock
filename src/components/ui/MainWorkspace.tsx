import React from 'react';

interface MainWorkspaceProps {
    children: React.ReactNode;
    isDark: boolean;
    header?: React.ReactNode;
}

/**
 * Standardized Main Workspace component for all modules.
 * Provides a consistent background and layout for the primary content area.
 */
export const MainWorkspace: React.FC<MainWorkspaceProps> = ({
    children,
    isDark,
    header
}) => {
    return (
        <div
            className="main-workspace-container animate-entrance"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: isDark ? '#121212' : '#fafafa',
                overflow: 'hidden',
                color: isDark ? '#e0e0e0' : '#333'
            }}
        >
            {header && (
                <header
                    className="main-workspace-header"
                    style={{
                        padding: '12px 20px',
                        borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#e5e7eb'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: isDark ? '#1a1a1a' : '#fff',
                        zIndex: 20
                    }}
                >
                    {header}
                </header>
            )}
            <main
                className="main-workspace-content"
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
        </div>
    );
};
