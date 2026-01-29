import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';

// Injects styles once to avoid duplication
const injectGlobalStyles = () => {
    if (typeof document === 'undefined') return;
    const styleId = 'scroll-area-global-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .scroll-area-native-viewport {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .scroll-area-native-viewport::-webkit-scrollbar {
            display: none;
        }
    `;
    document.head.appendChild(style);
};

export type ScrollVisibility = 'auto' | 'hover' | 'always';

interface ScrollAreaProps {
    children: React.ReactNode;
    className?: string;
    style?: CSSProperties;
    maxHeight?: string | number;
    visibility?: ScrollVisibility;
    autoHideDelay?: number;
    thumbColor?: string;
    trackColor?: string;
    thumbHoverColor?: string;
    thumbWidth?: number;

    // Deprecated props (kept for backward compat, but mapped to visibility)
    autoHide?: boolean;
    alwaysVisible?: boolean;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
    children,
    className = '',
    style = {},
    maxHeight,
    visibility = 'auto',
    autoHideDelay = 1000,
    thumbColor,
    trackColor,
    thumbHoverColor,
    thumbWidth = 6,
    // Compat handling
    autoHide,
    alwaysVisible
}) => {
    // Resolve visibility mode prioritizing the new prop, falling back to legacy props
    const mode: ScrollVisibility = alwaysVisible ? 'always' : (autoHide === false ? 'always' : visibility);

    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const [isScrolling, setIsScrolling] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop, setThumbTop] = useState(0);
    const [hasScroll, setHasScroll] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dragStartRef = useRef<{ y: number; scrollTop: number } | null>(null);

    useEffect(() => {
        injectGlobalStyles();

        // Check for reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduceMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const updateScrollbar = useCallback(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const { scrollHeight, clientHeight, scrollTop } = viewport;
        const hasScrollableContent = scrollHeight > clientHeight;

        setHasScroll(hasScrollableContent);

        if (!hasScrollableContent) {
            setThumbHeight(0);
            return;
        }

        const ratio = clientHeight / scrollHeight;
        const calculatedThumbHeight = Math.max(clientHeight * ratio, 32); // Min thumb height 32px

        const maxScrollTop = scrollHeight - clientHeight;
        const maxThumbTop = clientHeight - calculatedThumbHeight;
        const calculatedThumbTop = (scrollTop / maxScrollTop) * maxThumbTop;

        setThumbHeight(calculatedThumbHeight);
        setThumbTop(calculatedThumbTop);
    }, []);

    // Handle scroll
    const handleScroll = useCallback(() => {
        updateScrollbar();
        setIsScrolling(true);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        if (mode === 'auto') {
            scrollTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
            }, autoHideDelay);
        }
    }, [updateScrollbar, autoHideDelay, mode]);

    // Handle drag
    const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const viewport = viewportRef.current;
        if (!viewport) return;

        setIsDragging(true);
        dragStartRef.current = {
            y: e.clientY,
            scrollTop: viewport.scrollTop
        };

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const viewport = viewportRef.current;
            if (!viewport || !dragStartRef.current) return;

            const deltaY = e.clientY - dragStartRef.current.y;
            const { scrollHeight, clientHeight } = viewport;
            const maxThumbTop = clientHeight - thumbHeight;
            const maxScroll = scrollHeight - clientHeight;

            const scrollRatio = maxScroll / maxThumbTop;
            const newScrollTop = dragStartRef.current.scrollTop + (deltaY * scrollRatio);

            viewport.scrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            dragStartRef.current = null;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, thumbHeight]);

    // Handle track click
    const handleTrackClick = useCallback((e: React.MouseEvent) => {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        if (!viewport || !track) return;

        const trackRect = track.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const targetThumbTop = clickY - (thumbHeight / 2);

        const { scrollHeight, clientHeight } = viewport;
        const maxScrollTop = scrollHeight - clientHeight;
        const maxThumbTop = clientHeight - thumbHeight;

        const scrollRatio = targetThumbTop / maxThumbTop;
        const targetScrollTop = scrollRatio * maxScrollTop;

        viewport.scrollTo({
            top: Math.max(0, Math.min(targetScrollTop, maxScrollTop)),
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    }, [thumbHeight, reduceMotion]);

    // Observer
    useEffect(() => {
        const viewport = viewportRef.current;
        const content = contentRef.current;
        if (!viewport || !content) return;

        updateScrollbar();

        const resizeObserver = new ResizeObserver(() => {
            updateScrollbar();
        });

        // Observe elements
        resizeObserver.observe(viewport);
        resizeObserver.observe(content);

        return () => {
            resizeObserver.disconnect();
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [updateScrollbar]);

    // Determine visibility based on mode
    const isVisible = hasScroll && (
        mode === 'always' ||
        isDragging ||
        isHovering ||
        isFocused ||
        (mode === 'auto' && isScrolling) ||
        (mode === 'hover' && (isHovering || isDragging))
    );

    return (
        <div
            className={className}
            style={{
                position: 'relative',
                width: '100%',
                height: maxHeight ? undefined : '100%',
                maxHeight: maxHeight || undefined,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...style
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                ref={viewportRef}
                onScroll={handleScroll}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="scroll-area-native-viewport"
                style={{
                    flex: 1,
                    width: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    outline: 'none',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                tabIndex={0}
                role="region"
                aria-label="Scrollable content"
            >
                <div
                    ref={contentRef}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {children}
                </div>
            </div>

            {hasScroll && (
                <div
                    ref={trackRef}
                    aria-hidden="true"
                    onClick={handleTrackClick}
                    style={{
                        position: 'absolute',
                        top: 2,
                        bottom: 2,
                        right: 4,
                        width: thumbWidth + 4,
                        background: trackColor || 'transparent',
                        opacity: isVisible ? 1 : 0,
                        transition: reduceMotion ? 'none' : 'opacity 0.2s ease',
                        pointerEvents: isVisible ? 'auto' : 'none',
                        zIndex: 50,
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    <div
                        ref={thumbRef}
                        onMouseDown={handleThumbMouseDown}
                        style={{
                            position: 'absolute',
                            right: 2,
                            top: thumbTop,
                            width: thumbWidth,
                            height: thumbHeight,
                            background: isDragging || isHovering || isFocused
                                ? (thumbHoverColor || 'rgba(150, 150, 150, 0.5)')
                                : (thumbColor || 'rgba(150, 150, 150, 0.3)'),
                            borderRadius: thumbWidth / 2,
                            transition: isDragging || reduceMotion
                                ? 'none'
                                : 'background 0.15s ease, width 0.15s ease',
                            cursor: isDragging ? 'grabbing' : 'grab',
                        }}
                    />
                </div>
            )}
        </div>
    );
};
