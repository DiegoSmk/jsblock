import { useMemo } from 'react';
import { Handle, Position, useHandleConnections } from '@xyflow/react';
import { useStore } from '../store/useStore';

export const LogicNode = ({ id, data }: { id: string, data: { op: string, scopeId: string } }) => {
    const theme = useStore((state) => state.theme);
    const nodes = useStore((state) => state.nodes);
    const updateNodeData = useStore((state) => (state as any).updateNodeData);
    const isDark = theme === 'dark';

    const connections = useHandleConnections({
        type: 'source',
        id: 'result'
    });

    const targetNodeId = connections[0]?.target;
    const targetNode = useMemo(() => nodes.find(n => n.id === targetNodeId), [nodes, targetNodeId]);

    const operators = useMemo(() => {
        const allOps = ['+', '-', '*', '/', '==', '===', '!=', '>', '<', '>=', '<=', '&&', '||'];
        if (!connections.length || !targetNode) return allOps;
        const targetType = targetNode.type;
        const targetHandle = connections[0].targetHandle;
        const isControlFlow =
            (targetType === 'ifNode' && targetHandle === 'condition') ||
            (targetType === 'whileNode' && targetHandle === 'condition') ||
            (targetType === 'forNode' && targetHandle === 'test');
        if (isControlFlow) {
            return ['==', '===', '!=', '>', '<', '>=', '<=', '&&', '||'];
        }
        return allOps;
    }, [connections, targetNode]);

    const handleSelect = (op: string) => {
        updateNodeData(id, { op });
    };

    return (
        <div className="premium-node" style={{
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? 'linear-gradient(135deg, #450a0a 0%, #200505 100%)' : 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)',
            borderColor: '#f44336', // Matching console.error red
            overflow: 'visible', // Crucial to show handles fully
        }}>
            <Handle
                type="target"
                position={Position.Left}
                id="input-a"
                className="handle-data"
                style={{
                    left: '-8px',
                    background: '#f472b6' // Input
                }}
            />

            <Handle
                type="target"
                position={Position.Right}
                id="input-b"
                className="handle-data"
                style={{
                    right: '-8px',
                    background: '#f472b6' // Input
                }}
            />

            <div
                className="nodrag"
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 2,
                }}>
                <select
                    className="nodrag"
                    value={data.op}
                    onChange={(e) => handleSelect(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        background: '#f44336', // Matching console.error red
                        color: '#fff',
                        borderRadius: '8px',
                        width: '36px', // Smaller as requested
                        height: '36px', // Smaller as requested
                        fontSize: '0.9rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        border: 'none',
                        textAlign: 'center',
                        textIndent: '1px',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        boxShadow: '0 4px 10px rgba(244, 67, 54, 0.4)',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0',
                        zIndex: 10
                    }}
                >
                    {operators.map(op => (
                        <option
                            key={op}
                            value={op}
                            style={{
                                background: isDark ? '#1e293b' : '#fff',
                                color: isDark ? '#fff' : '#1e293b',
                                fontSize: '0.9rem',
                                padding: '8px'
                            }}
                        >
                            {op}
                        </option>
                    ))}
                </select>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="result"
                className="handle-data"
                style={{
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    // Default grey via CSS
                }}
            />

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
};
