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
    const getHandleColors = (baseHandleId: string) => {
        const sourceHandleId = baseHandleId.endsWith('-s') ? baseHandleId : (['top', 'left'].includes(baseHandleId) ? `${baseHandleId}-s` : baseHandleId);
        const targetHandleId = baseHandleId.endsWith('-t') ? baseHandleId : (['right', 'bottom'].includes(baseHandleId) ? `${baseHandleId}-t` : baseHandleId);

        const connectedEdges = edges.filter(edge =>
            (edge.source === id && (edge.sourceHandle === sourceHandleId || edge.sourceHandle === baseHandleId)) ||
            (edge.target === id && (edge.targetHandle === targetHandleId || edge.targetHandle === baseHandleId))
        );

        const colors = new Set<string>();
        connectedEdges.forEach(edge => {
            const color = (edge.style?.stroke as string) || (isDark ? '#4fc3f7' : '#0070f3');
            if (color) colors.add(color);
        });

        return Array.from(colors);
    };

    const renderHandleVisual = (baseHandleId: string) => {
        const colors = getHandleColors(baseHandleId);
        const hasConnection = colors.length > 0;
        const animationName = `blink-${id}-${baseHandleId}`;

        const keyframes = colors.length > 1
            ? `@keyframes ${animationName} {
                ${colors.map((c, i) => `${(i / colors.length) * 100}% { border-color: ${c}; }`).join('\n')}
                100% { border-color: ${colors[0]}; }
              }`
            : '';

        const style: React.CSSProperties = {
            backgroundColor: effectiveBorderColor
        };
        if (colors.length === 1) {
            style.borderColor = colors[0];
        } else if (colors.length > 1) {
            style.animation = `${animationName} ${colors.length * 2}s infinite linear`;
        }

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
        justifyContent: 'center'
    };

    return (
        <>
            {/* Top Side */}
            <Handle
                id="top"
                type="source"
                position={Position.Top}
                className="note-handle"
                style={{ ...handleStyle, top: -20 }}
            >
                {renderHandleVisual('top')}
            </Handle>
            <Handle
                id="top-t"
                type="target"
                position={Position.Top}
                className="note-handle"
                style={{ ...handleStyle, top: -20, opacity: 0 }}
            />

            {/* Right Side */}
            <Handle
                id="right"
                type="source"
                position={Position.Right}
                className="note-handle"
                style={{ ...handleStyle, right: -20 }}
            >
                {renderHandleVisual('right')}
            </Handle>
            <Handle
                id="right-t"
                type="target"
                position={Position.Right}
                className="note-handle"
                style={{ ...handleStyle, right: -20, opacity: 0 }}
            />

            {/* Bottom Side */}
            <Handle
                id="bottom"
                type="source"
                position={Position.Bottom}
                className="note-handle"
                style={{ ...handleStyle, bottom: -20 }}
            >
                {renderHandleVisual('bottom')}
            </Handle>
            <Handle
                id="bottom-t"
                type="target"
                position={Position.Bottom}
                className="note-handle"
                style={{ ...handleStyle, bottom: -20, opacity: 0 }}
            />

            {/* Left Side */}
            <Handle
                id="left"
                type="target"
                position={Position.Left}
                className="note-handle"
                style={{ ...handleStyle, left: -20 }}
            >
                {renderHandleVisual('left')}
            </Handle>
            <Handle
                id="left-s"
                type="source"
                position={Position.Left}
                className="note-handle"
                style={{ ...handleStyle, left: -20, opacity: 0 }}
            />
        </>
    );
};
