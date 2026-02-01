import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PanelHeaderProps {
    title: string;
    icon?: LucideIcon;
    isDark: boolean;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ title, icon: Icon, isDark }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icon && (
                <div style={{
                    color: isDark ? '#aaa' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                }}>
                    <Icon size={14} />
                </div>
            )}
            <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isDark ? '#ccc' : '#444',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {title}
            </span>
        </div>
    );
};
