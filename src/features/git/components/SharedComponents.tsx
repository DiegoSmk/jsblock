import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
    title: React.ReactNode | string;
    count: number;
    onToggle?: () => void;
    isOpen?: boolean;
    isDark: boolean;
    rightElement?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    count,
    onToggle,
    isOpen,
    isDark,
    rightElement
}) => {
    return (
        <div
            onClick={onToggle}
            className="git-section-header"
            style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                color: isDark ? '#999' : '#777',
                cursor: onToggle ? 'pointer' : 'default',
                borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                boxSizing: 'border-box',
                padding: '0 8px',
                height: '32px',
                fontSize: '0.7rem',
                fontWeight: 600,
                
                letterSpacing: '0.03em'
            }}
        >
            {onToggle && (
                <div style={{ color: isDark ? '#666' : '#999', transition: 'transform 0.12s ease', marginRight: '8px' }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            )}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                {count >= 0 && (
                    <span className="git-badge" style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                        color: isDark ? '#eee' : '#555',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '0.65rem'
                    }}>{count}</span>
                )}
                {rightElement}
            </div>
        </div>
    );
};

interface ActionToolbarProps {
    children: React.ReactNode;
    isDark: boolean;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({ children, isDark }) => {
    if (!children) return null;
    return (
        <div className="git-action-toolbar" style={{
            background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.015)',
            borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
            display: 'flex',
            gap: '8px',
            padding: '4px 8px'
        }}>
            {children}
        </div>
    );
};
