import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface GlassButtonProps {
    onClick: () => void;
    icon?: LucideIcon;
    label?: string;
    title?: string;
    variant?: 'default' | 'primary' | 'danger';
    isDark: boolean;
    style?: React.CSSProperties;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
    onClick,
    icon: Icon,
    label,
    title,
    variant = 'default',
    isDark,
    style
}) => {
    // Definindo cores baseadas no variante e no tema
    const colors = {
        default: {
            bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            hoverBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            text: isDark ? '#ddd' : '#444'
        },
        primary: {
            bg: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
            border: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)',
            hoverBg: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
            text: isDark ? '#a5b4fc' : '#4f46e5'
        },
        danger: {
            bg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
            border: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.2)',
            hoverBg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            text: isDark ? '#f87171' : '#dc2626'
        }
    };

    const currentColors = colors[variant];

    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <button
            onClick={onClick}
            title={title}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: isHovered ? currentColors.hoverBg : currentColors.bg,
                border: `1px solid ${currentColors.border}`,
                cursor: 'pointer',
                color: currentColors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '4px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(4px)',
                ...style
            }}
        >
            {Icon && <Icon size={14} />}
            {label && <span>{label}</span>}
        </button>
    );
};
