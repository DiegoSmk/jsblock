import { Handle, Position, type Edge } from '@xyflow/react';

interface NoteNodeHandlesProps {
    id: string;
    isDark: boolean;
    edges: Edge[];
    effectiveBorderColor: string;
}

export const NoteNodeHandles: React.FC<NoteNodeHandlesProps> = ({
    id,
    isDark,
    edges,
    effectiveBorderColor
}) => {
    // Helper to determine if a handle (visual location) has active connections
    const getHandleColors = (location: 'top' | 'bottom' | 'left' | 'right') => {
        // We need to check all physical handles at this location
        // Top: 'top' (source), 'top-t' (target)
        // Bottom: 'bottom' (source), 'bottom-t' (target)
        // Left: 'left' (target), 'left-s' (source)
        // Right: 'right' (source), 'right-t' (target)

        const possibleHandleIds = [location, `${location}-s`, `${location}-t`];

        const connectedEdges = edges.filter(edge => {
            const isSource = edge.source === id;
            const isTarget = edge.target === id;

            if (isSource) {
                // If sourceHandle is null, it connects to "default" handle (top?)
                // But for NoteNode we usually set IDs. If null, maybe ignore or assume top?
                // Let's assume strict ID match or null matches "top" if location is top?
                // To be safe, we check if edge.sourceHandle is in possibleHandleIds.
                return possibleHandleIds.includes(edge.sourceHandle || '');
            }
            if (isTarget) {
                return possibleHandleIds.includes(edge.targetHandle || '');
            }
            return false;
        });

        const colors = new Set<string>();
        connectedEdges.forEach(edge => {
            const color = (edge.style?.stroke as string) || (isDark ? '#4fc3f7' : '#0070f3');
            if (color) colors.add(color);
        });

        return Array.from(colors);
    };

    const renderHandleVisual = (location: 'top' | 'bottom' | 'left' | 'right') => {
        const colors = getHandleColors(location);
        const hasConnection = colors.length > 0;
        const animationName = `blink-${id}-${location}`;

        const keyframes = colors.length > 1
            ? `@keyframes ${animationName} {
                ${colors.map((c, i) => `${(i / colors.length) * 100}% { border-color: ${c}; }`).join('\n')}
                100% { border-color: ${colors[0]}; }
              }`
            : '';

        const style: React.CSSProperties = {
            backgroundColor: effectiveBorderColor,
            opacity: hasConnection ? 1 : undefined // Enforce visibility if connected
        };

        if (colors.length === 1) {
            style.borderColor = colors[0];
        } else if (colors.length > 1) {
            style.animation = `${animationName} ${colors.length * 2}s infinite linear`;
        }

        // Add class 'connected' if it has connections, which CSS might use to force opacity: 1
        return (
            <>
                {colors.length > 1 && <style>{keyframes}</style>}
                <div
                    className={`visual-handle ${hasConnection ? 'connected' : ''}`}
                    style={style}
                />
            </>
        );
    };

    const handleStyle: React.CSSProperties = {
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        zIndex: 50,
        pointerEvents: 'all',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20, // Increase hit area
        height: 20
    };

    return (
        <>
            {/* Top Side */}
            <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', zIndex: 51 }}>
                {renderHandleVisual('top')}
            </div>
            <Handle id="top" type="source" position={Position.Top} style={{ ...handleStyle, top: -10 }} />
            <Handle id="top-t" type="target" position={Position.Top} style={{ ...handleStyle, top: -10, opacity: 0 }} />

            {/* Right Side */}
            <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', zIndex: 51 }}>
                 {renderHandleVisual('right')}
            </div>
            <Handle id="right" type="source" position={Position.Right} style={{ ...handleStyle, right: -10 }} />
            <Handle id="right-t" type="target" position={Position.Right} style={{ ...handleStyle, right: -10, opacity: 0 }} />

            {/* Bottom Side */}
            <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', zIndex: 51 }}>
                {renderHandleVisual('bottom')}
            </div>
            <Handle id="bottom" type="source" position={Position.Bottom} style={{ ...handleStyle, bottom: -10 }} />
            <Handle id="bottom-t" type="target" position={Position.Bottom} style={{ ...handleStyle, bottom: -10, opacity: 0 }} />

            {/* Left Side */}
            <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', zIndex: 51 }}>
                {renderHandleVisual('left')}
            </div>
            <Handle id="left" type="target" position={Position.Left} style={{ ...handleStyle, left: -10 }} />
            <Handle id="left-s" type="source" position={Position.Left} style={{ ...handleStyle, left: -10, opacity: 0 }} />
        </>
    );
};
