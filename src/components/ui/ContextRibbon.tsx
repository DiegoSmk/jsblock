import React from 'react';
import { useStore } from '../../store/useStore';
import { DESIGN_TOKENS } from '../../constants/design';

interface ContextRibbonItem {
    id: string;
    icon: React.ElementType;
    label: string;
    disabled?: boolean;
}

interface ContextRibbonProps {
    items: ContextRibbonItem[];
    activeId: string;
    onSelect: (id: string) => void;
}

export const ContextRibbon: React.FC<ContextRibbonProps> = ({
    items,
    activeId,
    onSelect
}) => {
    const { theme } = useStore();
    const isDark = theme === 'dark';

    // Visibility Rule: Only show if 2 or more items exists
    if (items.length < 2) return null;

    return (
        <div style={{
            width: DESIGN_TOKENS.RIBBON_WIDTH,
            height: '100%',
            backgroundColor: isDark ? DESIGN_TOKENS.COLORS.BG.CONTEXT_RIBBON.DARK : DESIGN_TOKENS.COLORS.BG.CONTEXT_RIBBON.LIGHT, // Using token
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 0',
            borderRight: `1px solid ${isDark ? '#2d2d2d' : '#d1d1d1'}`,
            zIndex: 19 // Just below SideRibbon (20)
        }}>
            {items.map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;

                return (
                    <button
                        key={item.id}
                        onClick={() => !item.disabled && onSelect(item.id)}
                        title={item.label}
                        disabled={item.disabled}
                        style={{
                            width: '32px', // Slightly smaller hit area to differentiate? Or keep 40px but smaller visual
                            height: '32px',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isActive
                                ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                                : 'transparent',
                            border: 'none',
                            borderRadius: '6px', // Rounded squares for context items vs potentially different shape for global
                            color: item.disabled
                                ? (isDark ? '#444' : '#ccc')
                                : isActive
                                    ? (isDark ? '#fff' : '#000')
                                    : (isDark ? '#888' : '#666'),
                            cursor: item.disabled ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                            if (!item.disabled && !isActive) {
                                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                                e.currentTarget.style.color = isDark ? '#ddd' : '#333';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!item.disabled && !isActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = isDark ? '#888' : '#666';
                            }
                        }}
                    >
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </button>
                );
            })}
        </div>
    );
};
