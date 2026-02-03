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
                // If sourceHandle is null, it typically connects to the default handle.
                // For NoteNode, let's assume 'top' is the default for Source if no ID is provided, 
                // or if the ID matches 'top' variants.
                const handleId = edge.sourceHandle;
                if (!handleId && location === 'top') return true;
                return possibleHandleIds.includes(handleId ?? '');
            }
            if (isTarget) {
                // If targetHandle is null, it typically connects to the default handle.
                // For NoteNode, 'top' is not usually a target default (left is?), but let's be permissive.
                // Actually, if a code node connects TO a note, it might not specify targetHandle if it thinks Note is a default node.
                // If we assume 'top' is default for target too (to be safe and visible):
                const handleId = edge.targetHandle;
                if (!handleId && location === 'top') return true;
                return possibleHandleIds.includes(handleId ?? '');
            }
            return false;
        });

        const colors = new Set<string>();
        connectedEdges.forEach(edge => {
            const color = (edge.style?.stroke as string) ?? (isDark ? '#4fc3f7' : '#0070f3');
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

    const renderHandleGroup = (
        location: 'top' | 'bottom' | 'left' | 'right',
        pos: Position,
        offset: number
    ) => {
        const visual = renderHandleVisual(location);
        const size = 20;
        const centeredOffset = offset - (size / 2);

        const baseStyle = {
            ...handleStyle,
            [location]: centeredOffset,
            ...(location === 'left' || location === 'right' ? { top: '50%', transform: 'translateY(-50%)' } : { left: '50%', transform: 'translateX(-50%)' })
        };

        // In Loose mode, we can use a single handle ID for both source/target
        // We use the primary ID (e.g., 'left', 'right', 'top', 'bottom')
        const handleId = location;

        return (
            <Handle
                key={location}
                id={handleId}
                type="source" // Acts as universal port
                position={pos}
                style={baseStyle}
            >
                {visual}
            </Handle>
        );
    };

    const offset = -18;

    return (
        <>
            {renderHandleGroup('top', Position.Top, offset)}
            {renderHandleGroup('right', Position.Right, offset)}
            {renderHandleGroup('bottom', Position.Bottom, offset)}
            {renderHandleGroup('left', Position.Left, offset)}
        </>
    );
};
