import React from 'react';

interface MenuButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color?: string;
    isDark?: boolean;
}

export const MenuButton = ({ icon: Icon, label, onClick, color, isDark }: MenuButtonProps) => (
    <button
        onClick={onClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer',
            color: color ?? (isDark ? '#eee' : '#333'),
            transition: 'background 0.2s',
            textAlign: 'left',
            fontSize: '0.9rem',
            outline: 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
        <Icon size={16} />
        {label}
    </button>
);
