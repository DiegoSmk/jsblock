import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
    const [actualSide, setActualSide] = useState(side);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<any>(null);
    const theme = useStore(state => state.theme);
    const isDark = theme === 'dark';

    const updatePosition = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;
        const offset = 8;

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
        setActualSide(side);
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            updatePosition();
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useLayoutEffect(() => {
        if (isVisible && tooltipRef.current && triggerRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const padding = 12;
            let { top, left } = coords;
            let newSide = actualSide;

            // Check if it overflows vertical
            if (newSide === 'top' && tooltipRect.top < padding) {
                // Flip to bottom if there's space
                if (triggerRect.bottom + tooltipRect.height + padding < window.innerHeight) {
                    top = triggerRect.bottom + 8;
                    newSide = 'bottom';
                }
            } else if (newSide === 'bottom' && tooltipRect.bottom > window.innerHeight - padding) {
                // Flip to top if there's space
                if (triggerRect.top - tooltipRect.height - padding > 0) {
                    top = triggerRect.top - 8;
                    newSide = 'top';
                }
            }

            // Horizontal correction for top/bottom tooltips
            if (newSide === 'top' || newSide === 'bottom') {
                if (tooltipRect.right > window.innerWidth - padding) {
                    left -= (tooltipRect.right - (window.innerWidth - padding));
                }
                if (tooltipRect.left < padding) {
                    left += (padding - tooltipRect.left);
                }
            }

            // Check horizontal overflow for left/right tooltips
            if (newSide === 'right' && tooltipRect.right > window.innerWidth - padding) {
                if (triggerRect.left - tooltipRect.width - padding > 0) {
                    left = triggerRect.left - 8;
                    newSide = 'left';
                }
            } else if (newSide === 'left' && tooltipRect.left < padding) {
                if (triggerRect.right + tooltipRect.width + padding < window.innerWidth) {
                    left = triggerRect.right + 8;
                    newSide = 'right';
                }
            }

            // Vertical correction for left/right tooltips
            if (newSide === 'left' || newSide === 'right') {
                if (tooltipRect.bottom > window.innerHeight - padding) {
                    top -= (tooltipRect.bottom - (window.innerHeight - padding));
                }
                if (tooltipRect.top < padding) {
                    top += (padding - tooltipRect.top);
                }
            }

            if (top !== coords.top || left !== coords.left || newSide !== actualSide) {
                setCoords({ top, left });
                setActualSide(newSide);
            }
        }
    }, [isVisible, content]); // Re-run when visible or content changes

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const getTransform = (s: string) => {
        switch (s) {
            case 'top': return 'translate(-50%, -100%)';
            case 'bottom': return 'translate(-50%, 0)';
            case 'left': return 'translate(-100%, -50%)';
            case 'right': return 'translate(0, -50%)';
            default: return 'translate(-50%, -100%)';
        }
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ display: 'inline-flex' }}
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform: getTransform(actualSide),
                        background: isDark ? 'rgba(20, 20, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        color: isDark ? '#fff' : '#000',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        lineHeight: '1.4',
                        fontWeight: 500,
                        whiteSpace: 'normal', // Allow wrapping if very long
                        maxWidth: '280px',
                        zIndex: 10000,
                        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)',
                        border: `1px solid ${isDark ? '#333' : '#eee'}`,
                        pointerEvents: 'none',
                        backdropFilter: 'blur(8px)',
                        transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: 'tooltipIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                >
                    {content}
                    <style>{`
                        @keyframes tooltipIn {
                            from { opacity: 0; transform: ${getTransform(actualSide)} scale(0.95); }
                            to { opacity: 1; transform: ${getTransform(actualSide)} scale(1); }
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </>
    );
};
