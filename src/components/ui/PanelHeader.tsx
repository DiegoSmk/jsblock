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
                    color: isDark ? '#4ade80' : '#16a34a', // Green-ish color
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                    padding: '4px',
                    borderRadius: '4px'
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
