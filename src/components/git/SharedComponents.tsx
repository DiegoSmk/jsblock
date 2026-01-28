import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    count: number;
    onToggle?: () => void;
    isOpen?: boolean;
    isDark: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count, onToggle, isOpen, isDark }) => (
    <div
        onClick={onToggle}
        className="git-section-header"
        style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            color: isDark ? '#999' : '#777',
            cursor: onToggle ? 'pointer' : 'default',
            borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`,
        }}
    >
        {onToggle && (
            <div style={{ color: isDark ? '#666' : '#999', transition: 'transform 0.12s ease' }}>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
        )}
        <span style={{ flex: 1 }}>{title}</span>
        <span className="git-badge" style={{
            background: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
            color: isDark ? '#eee' : '#555',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`
        }}>{count}</span>
    </div>
);

interface ActionToolbarProps {
    children: React.ReactNode;
    isDark: boolean;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({ children, isDark }) => {
    if (!children) return null;
    return (
        <div className="git-action-toolbar" style={{
            background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.015)',
            borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'}`
        }}>
            {children}
        </div>
    );
};
