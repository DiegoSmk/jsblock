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
                        width: `${Math.round(size * 0.45)}px`,
                        height: `${Math.round(size * 0.45)}px`,
                        background: activeColor,
                        borderRadius: '50%', // Now a circle
                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: 'scale(1)',
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        marginTop: `-${Math.round(size * 0.45) / 2}px`,
                        marginLeft: `-${Math.round(size * 0.45) / 2}px`,
                        boxShadow: `0 0 4px ${activeColor}40`
                    }}
                />
            )}
        </div>
    );
};
