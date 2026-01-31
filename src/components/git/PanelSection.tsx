import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { ChevronDown } from 'lucide-react';

interface PanelSectionProps {
    id: string;
    icon?: LucideIcon;
    title: string;
    count?: number;
    tooltip?: string;
    isDark: boolean;
    children: React.ReactNode;
    defaultOpen?: boolean;
    animationDelay?: number;
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

export const PanelSection: React.FC<PanelSectionProps> = ({
    icon: Icon,
    title,
    count,
    tooltip,
    isDark,
    children,
    defaultOpen = true,
    animationDelay = 0,
    isOpen: controlledIsOpen,
    onToggle
}) => {
    const [localIsOpen, setLocalIsOpen] = useState(defaultOpen);

    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen;

    const handleToggle = () => {
        if (onToggle) {
            onToggle(!isOpen);
        } else {
            setLocalIsOpen(!isOpen);
        }
    };

    return (
        <div
            style={{
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                animation: `sectionSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${animationDelay}s forwards`,
                opacity: 0,
                transform: 'translateY(15px)',
                overflow: 'hidden'
            }}
        >
            <style>{`
                @keyframes sectionSlideIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .section-header:hover {
                    background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'} !important;
                }
            `}</style>

            <button
                className="section-header"
                onClick={handleToggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    outline: 'none'
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

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tooltip content={tooltip || title} side="top" delay={600}>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? (isOpen ? '#fff' : '#888') : (isOpen ? '#1a1a1a' : '#666'),
                            letterSpacing: '0.02em',
                            transition: 'all 0.3s'
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ChevronDown
                        size={16}
                        style={{
                            color: isDark ? '#444' : '#ccc',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                            opacity: 0.6
                        }}
                    />
                </div>
            </button>

            <div
                style={{
                    maxHeight: isOpen ? '2000px' : '0',
                    opacity: isOpen ? 1 : 0,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden',
                    background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.005)'
                }}
            >
                {children}
            </div>
        </div>
    );
};
