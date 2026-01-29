import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';

interface ScrollAreaProps {
    children: React.ReactNode;
    className?: string;
    style?: CSSProperties;
    maxHeight?: string | number;
    autoHide?: boolean;
    autoHideDelay?: number;
    thumbColor?: string;
    trackColor?: string;
    thumbHoverColor?: string;
    thumbWidth?: number;
}

/**
 * ScrollArea - Professional custom scrollbar component
 * 
 * Features:
 * - Native scroll performance (uses native overflow with hidden scrollbar)
 * - Custom styled scrollbar overlay
 * - Auto-hide functionality
 * - Smooth animations
 * - Full keyboard/mouse/trackpad support
 * - Electron/Chromium optimized
 * - Zero external dependencies
 * 
 * @example
 * <ScrollArea maxHeight="400px" autoHide>
 *   <YourContent />
 * </ScrollArea>
 */
export const ScrollArea: React.FC<ScrollAreaProps> = ({
    children,
    className = '',
    style = {},
    maxHeight,
    autoHide = true,
    autoHideDelay = 1000,
    thumbColor,
    trackColor,
    thumbHoverColor,
    thumbWidth = 6
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const [isScrolling, setIsScrolling] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop, setThumbTop] = useState(0);
    const [hasScroll, setHasScroll] = useState(false);

    const scrollTimeoutRef = useRef<number | null>(null);
    const dragStartRef = useRef<{ y: number; scrollTop: number } | null>(null);

    // Calculate thumb dimensions and position
    const updateScrollbar = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollHeight, clientHeight, scrollTop } = container;
        const hasScrollableContent = scrollHeight > clientHeight;

        setHasScroll(hasScrollableContent);

        if (!hasScrollableContent) {
            setThumbHeight(0);
            return;
        }

        // Calculate thumb height (proportional to visible area)
        const ratio = clientHeight / scrollHeight;
        const calculatedThumbHeight = Math.max(clientHeight * ratio, 40); // Min 40px for usability

        // Calculate thumb position
        const maxScrollTop = scrollHeight - clientHeight;
        const maxThumbTop = clientHeight - calculatedThumbHeight;
        const calculatedThumbTop = (scrollTop / maxScrollTop) * maxThumbTop;

        setThumbHeight(calculatedThumbHeight);
        setThumbTop(calculatedThumbTop);
    }, []);

    // Handle scroll events
    const handleScroll = useCallback(() => {
        updateScrollbar();
        setIsScrolling(true);

        // Auto-hide timer
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, autoHideDelay);
    }, [updateScrollbar, autoHideDelay]);

    // Handle mouse down on thumb (start drag)
    const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const container = scrollContainerRef.current;
        if (!container) return;

        setIsDragging(true);
        dragStartRef.current = {
            y: e.clientY,
            scrollTop: container.scrollTop
        };

        document.body.style.userSelect = 'none';
    }, []);

    // Handle mouse move during drag
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = scrollContainerRef.current;
            if (!container || !dragStartRef.current) return;

            const deltaY = e.clientY - dragStartRef.current.y;
            const { scrollHeight, clientHeight } = container;
            const maxScrollTop = scrollHeight - clientHeight;
            const maxThumbTop = clientHeight - thumbHeight;

            // Calculate new scroll position
            const scrollRatio = deltaY / maxThumbTop;
            const newScrollTop = dragStartRef.current.scrollTop + (scrollRatio * maxScrollTop);

            container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            dragStartRef.current = null;
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, thumbHeight]);

    // Handle click on track (jump to position)
    const handleTrackClick = useCallback((e: React.MouseEvent) => {
        const container = scrollContainerRef.current;
        const track = trackRef.current;
        if (!container || !track) return;

        const trackRect = track.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const { scrollHeight, clientHeight } = container;
        const maxScrollTop = scrollHeight - clientHeight;

        // Jump to clicked position
        const scrollRatio = clickY / trackRect.height;
        container.scrollTop = scrollRatio * maxScrollTop;
    }, []);

    // Update scrollbar on mount and content changes
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        updateScrollbar();

        // Observer for content size changes
        const resizeObserver = new ResizeObserver(updateScrollbar);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [updateScrollbar]);

    // Determine if scrollbar should be visible
    const isVisible = hasScroll && (!autoHide || isScrolling || isDragging || isHovering);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: maxHeight ? undefined : '100%',
                maxHeight: maxHeight || undefined,
                overflow: 'hidden',
                ...style
            }}
            className={className}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Scroll Container - Native scroll with hidden scrollbar */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // IE/Edge
                    // Hide webkit scrollbar
                    ...({
                        '::-webkit-scrollbar': {
                            display: 'none'
                        }
                    } as any)
                }}
                className="scroll-area-content"
            >
                {children}
            </div>

            {/* Custom Scrollbar Track */}
            {hasScroll && (
                <div
                    ref={trackRef}
                    onClick={handleTrackClick}
                    style={{
                        position: 'absolute',
                        top: 2,
                        bottom: 2,
                        right: 4, // Increased offset to avoid window resize zone
                        width: thumbWidth + 4,
                        background: trackColor || 'transparent',
                        opacity: isVisible ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                        pointerEvents: isVisible ? 'auto' : 'none',
                        zIndex: 50,
                        cursor: 'pointer'
                    }}
                >
                    {/* Custom Scrollbar Thumb */}
                    <div
                        ref={thumbRef}
                        onMouseDown={handleThumbMouseDown}
                        style={{
                            position: 'absolute',
                            right: 2,
                            top: thumbTop,
                            width: thumbWidth,
                            height: thumbHeight,
                            background: isDragging || isHovering
                                ? (thumbHoverColor || 'rgba(255, 255, 255, 0.4)')
                                : (thumbColor || 'rgba(255, 255, 255, 0.2)'),
                            borderRadius: thumbWidth / 2,
                            transition: isDragging ? 'none' : 'background 0.15s ease, width 0.15s ease',
                            cursor: 'grab',
                            ...(isDragging && {
                                cursor: 'grabbing'
                            })
                        }}
                    />
                </div>
            )}

            {/* Global style injection for webkit scrollbar hiding */}
            <style>{`
                .scroll-area-content::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
