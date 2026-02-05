
import React from 'react';
import { useStore } from '../../../store/useStore';
import { ChevronRight, Home } from 'lucide-react';

export const ScopeBreadcrumbs = () => {
    const navigationStack = useStore((state) => state.navigationStack);
    const navigateToScope = useStore((state) => state.navigateToScope);
    const theme = useStore((state) => state.theme);
    const isDark = theme === 'dark';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: `1px solid ${isDark ? '#333' : '#eee'}`,
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 100
        }}>
            {navigationStack.map((item, index) => (
                <React.Fragment key={item.id}>
                    {index > 0 && <ChevronRight size={16} color={isDark ? '#666' : '#999'} />}
                    <div
                        onClick={() => navigateToScope(index)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            color: index === navigationStack.length - 1
                                ? (isDark ? '#fff' : '#000')
                                : (isDark ? '#888' : '#666'),
                            fontWeight: index === navigationStack.length - 1 ? 800 : 500,
                            fontSize: '0.9rem',
                            transition: 'color 0.2s ease',
                            userSelect: 'none'
                        }}
                    >
                        {index === 0 && <Home size={14} />}
                        {item.label}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};
