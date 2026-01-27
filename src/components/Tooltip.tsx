import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top', delay = 200 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const theme = useStore(state => state.theme);
    const isDark = theme === 'dark';

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                let top = 0;
                let left = 0;
                const offset = 8;

                // Simple positioning logic
                if (side === 'top') {
                    top = rect.top - offset;
                    left = rect.left + rect.width / 2;
                } else if (side === 'bottom') {
                    top = rect.bottom + offset;
                    left = rect.left + rect.width / 2;
                } else if (side === 'left') {
                    top = rect.top + rect.height / 2;
                    left = rect.left - offset;
                } else if (side === 'right') {
                    top = rect.top + rect.height / 2;
                    left = rect.right + offset;
                }

                setCoords({ top, left });
                setIsVisible(true);
            }
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ display: 'inline-flex' }} // Maintain layout
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform:
                            side === 'top' ? 'translate(-50%, -100%)' :
                                side === 'bottom' ? 'translate(-50%, 0)' :
                                    side === 'left' ? 'translate(-100%, -50%)' :
                                        'translate(0, -50%)',
                        background: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        color: isDark ? '#fff' : '#000',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        zIndex: 9999,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        pointerEvents: 'none',
                        backdropFilter: 'blur(4px)',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    {content}
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: ${side === 'top' ? 'translate(-50%, -90%)' :
                            side === 'bottom' ? 'translate(-50%, -10%)' :
                                side === 'left' ? 'translate(-90%, -50%)' :
                                    'translate(-10%, -50%)'
                        }; }
                            to { opacity: 1; transform: ${side === 'top' ? 'translate(-50%, -100%)' :
                            side === 'bottom' ? 'translate(-50%, 0)' :
                                side === 'left' ? 'translate(-100%, -50%)' :
                                    'translate(0, -50%)'
                        }; }
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </>
    );
};
