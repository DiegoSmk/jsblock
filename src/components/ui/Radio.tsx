import React from 'react';

interface RadioProps {
    checked: boolean;
    onChange: () => void;
    activeColor: string;
    isDark: boolean;
    size?: number;
}

export const Radio: React.FC<RadioProps> = ({
    checked,
    onChange,
    activeColor,
    isDark,
    size = 18
}) => {
    return (
        <div
            onClick={onChange}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                border: `2px solid ${checked ? activeColor : (isDark ? '#444' : '#d1d5db')}`,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: checked ? `${activeColor}15` : 'transparent',
                flexShrink: 0,
                position: 'relative',
                boxSizing: 'border-box'
            }}
        >
            {checked && (
                <div
                    style={{
                        width: '55%',
                        height: '55%',
                        background: activeColor,
                        borderRadius: '50%',
                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: 'scale(1)',
                        boxShadow: `0 0 4px ${activeColor}40`,
                        flexShrink: 0
                    }}
                />
            )}
        </div>
    );
};
