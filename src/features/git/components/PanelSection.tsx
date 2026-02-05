import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PanelSectionHeader } from '../../../components/ui/PanelSectionHeader';

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
    actions?: React.ReactNode;
}

export const PanelSection: React.FC<PanelSectionProps> = ({
    id,
    icon,
    title,
    count,
    tooltip,
    isDark,
    children,
    defaultOpen = true,
    animationDelay = 0,
    isOpen: controlledIsOpen,
    onToggle,
    actions
}) => {
    const [localIsOpen, setLocalIsOpen] = useState(defaultOpen);

    const isOpen = controlledIsOpen ?? localIsOpen;

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
            <PanelSectionHeader
                id={id}
                icon={icon}
                title={title}
                count={count}
                tooltip={tooltip}
                isDark={isDark}
                isOpen={isOpen}
                onToggle={handleToggle}
                actions={actions}
            />

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
