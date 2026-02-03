import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { ChevronDown } from 'lucide-react';

interface PanelSectionHeaderProps {
    id: string; // Keep for compatibility if needed, though not stricly used for rendering
    icon?: LucideIcon;
    title: string;
    count?: number;
    tooltip?: string;
    isDark: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
    actions?: React.ReactNode;
}

/**
 * Standardized Section Header for Panel internal navigation (e.g. Overview, Statistics).
 */
export const PanelSectionHeader: React.FC<PanelSectionHeaderProps> = ({
    icon: Icon,
    title,
    count,
    tooltip,
    isDark,
    isOpen,
    onToggle,
    actions
}) => {
    return (
        <>
            <style>{`
                .section-header:hover {
                    background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'} !important;
                }
            `}</style>

            <div
                className="section-header"
                onClick={onToggle}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle?.();
                    }
                }}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 2px 8px 12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: onToggle ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    outline: 'none',
                    userSelect: 'none',
                    boxSizing: 'border-box'
                }}
            >
                {Icon && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? (isOpen ? '#4ade80' : '#666') : (isOpen ? '#22c55e' : '#999'),
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: isOpen ? 'scale(1.1)' : 'scale(1)'
                    }}>
                        <Icon size={16} strokeWidth={2.5} />
                    </div>
                )}

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Tooltip content={tooltip ?? title} side="top" delay={600}>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? (isOpen ? '#fff' : '#888') : (isOpen ? '#1a1a1a' : '#666'),
                            letterSpacing: '0.02em',
                            transition: 'all 0.3s',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {title}
                        </span>
                    </Tooltip>
                    {count !== undefined && count > 0 && (
                        <span style={{
                            fontSize: '0.65rem',
                            padding: '1px 6px',
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            borderRadius: '10px',
                            color: isDark ? '#666' : '#999',
                            fontWeight: 800
                        }}>
                            {count}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    {actions}
                    {onToggle && (
                        <ChevronDown
                            size={16}
                            style={{
                                color: isDark ? '#444' : '#ccc',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                opacity: 0.6
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    );
};
