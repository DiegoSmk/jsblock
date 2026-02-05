import React from 'react';
import { Blocks } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const ExtensionLandingPage: React.FC = () => {
    const { theme } = useStore();
    const isDark = theme === 'dark';

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? '#0a0a0a' : '#fff',
            color: isDark ? '#666' : '#999',
            padding: '20px',
            textAlign: 'center'
        }}>
            <div style={{
                marginBottom: '24px',
                padding: '20px',
                borderRadius: '16px',
                background: isDark ? '#1a1a1a' : '#f5f5f5',
                border: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                color: isDark ? '#333' : '#e0e0e0'
            }}>
                <Blocks size={48} strokeWidth={1.5} />
            </div>

            <h2 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: isDark ? '#eee' : '#333',
                marginBottom: '8px'
            }}>
                No Extension Selected
            </h2>

            <p style={{
                maxWidth: '300px',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                color: isDark ? '#666' : '#999'
            }}>
                Select an extension from the sidebar to view its details, configuration, and permissions.
            </p>
        </div>
    );
};
