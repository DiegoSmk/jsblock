import { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import type { AppNode } from '../types/store';
import { useStore } from '../store/useStore';
import { Copy, Check, Merge, ArrowUpRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUtilityDefinition } from '../registry/utilities';

// Hybrid Handle Component
const HybridHandle = ({
    id,
    position,
    isConnected,
    isHovered,
    showDebug
}: {
    id: string,
    position: Position,
    isConnected: boolean,
    isHovered: boolean,
    showDebug: boolean
}) => {
    const opacity = isConnected || isHovered ? 1 : 0;

    // Common styles for both source and target handles
    const baseStyle: React.CSSProperties = {
        background: '#94a3b8',
        border: '2px solid #fff',
        width: 14,
        height: 14,
        transition: 'opacity 0.2s',
        opacity,
        zIndex: 10,
    };

    const debugStyle: React.CSSProperties = showDebug ? {
        outline: '2px solid red',
        backgroundColor: 'rgba(255,0,0,0.2)'
    } : {};

    const finalStyle = { ...baseStyle, ...debugStyle };

    return (
        <>
            <Handle
                type="target"
                id={id}
                position={position}
                style={{ ...finalStyle, [position === Position.Left ? 'left' : 'right']: -7 }}
                isConnectable={true}
            />
            <Handle
                type="source"
                id={id}
                position={position}
                style={{ ...finalStyle, [position === Position.Left ? 'left' : 'right']: -7 }}
                isConnectable={true}
            />
        </>
    );
};

export const UtilityNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
    const { updateNodeData, edges, nodes, addToast, theme, onNodesChange, settings } = useStore(
        useShallow((state) => ({
            updateNodeData: state.updateNodeData,
            edges: state.edges,
            nodes: state.nodes,
            addToast: state.addToast,
            theme: state.theme,
            onNodesChange: state.onNodesChange,
            settings: state.settings
        }))
    );

    const isDark = theme === 'dark';
    const [isHovered, setIsHovered] = useState(false);

    const def = getUtilityDefinition(data.utilityType as any);
    const Icon = def?.icon ?? Copy;
    const color = isDark ? def?.color.dark : def?.color.light;

    const isTask = data.utilityType === 'task';
    const isCopy = data.utilityType === 'copy';
    const isCollector = data.utilityType === 'collector';
    const isPortal = data.utilityType === 'portal';

    const handleCopy = useCallback(() => {
        // Find connected source node
        const connectedEdge = edges.find(e => e.target === id);
        if (!connectedEdge) {
            addToast({ type: 'warning', message: 'Conecte uma nota para copiar seu conteúdo' });
            return;
        }

        const sourceNode = nodes.find(n => n.id === connectedEdge.source);
        if (sourceNode && (sourceNode.data.text !== undefined || sourceNode.data.label !== undefined)) {
            const textToCopy = (sourceNode.data.text! ?? sourceNode.data.label! ?? '');
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    addToast({ type: 'success', message: 'Conteúdo copiado para a área de transferência!' });
                })
                .catch(() => {
                    addToast({ type: 'error', message: 'Falha ao copiar conteúdo' });
                });
        }
    }, [id, edges, nodes, addToast]);

    const handleToggleTask = () => {
        updateNodeData(id, { checked: !data.checked });
    };

    // Local state for input to handle composition characters properly
    const [localLabel, setLocalLabel] = useState(data.label ?? '');

    // Sync local state when external data changes (e.g. undo/redo)
    useEffect(() => {
        setLocalLabel(data.label ?? '');
    }, [data.label]);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onNodesChange([{ type: 'remove', id }]);
    };

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalLabel(e.target.value);
    };

    const handleLabelBlur = () => {
        if (localLabel !== data.label) {
            updateNodeData(id, { label: localLabel });
        }
    };

    // Connection checks
    const leftId = 'left';
    const rightId = 'right'; // If we use ids, we should check them.
    // However, previously handles might not have had IDs (default).
    // If I add IDs now, old edges might break if they rely on handleId?
    // Edges store sourceHandle and targetHandle. If they were null/undefined, and now I set them, connections might visually detach?
    // "Transition ... to Utility Nodes". If these are new nodes, it's fine.
    // If existing nodes, we might need to handle migration or use default handle (no ID) for one of them?
    // But we have TWO positions. Left and Right.
    // The previous implementation had:
    // Left: type="target" (no id implies null)
    // Right: type="source" (no id implies null) (Only if isTask)
    // If I now use `id="left"` and `id="right"`, existing edges will look for handle=null and won't find it.
    // But since I am using "Hybrid", maybe I should support both?
    // Or maybe I just assume new nodes? The user said "Padronizar a experiência visual".
    // I will use IDs 'left' and 'right'. If this breaks existing edges on dev branch, the user might need to reconnect or migration.
    // Given "feature/utility-nodes-refactor", breaking changes might be acceptable or expected, but let's try to be safe.
    // If I don't provide ID, it defaults to null. I can't have two handles with null ID.
    // So I MUST provide IDs if I have multiple.
    // The previous code had `Position.Left` and `Position.Right`. React Flow distinguishes by position? No, by ID. If ID is missing, it assumes single handle?
    // Wait, if I have multiple handles, I MUST provide IDs.
    // The previous code:
    // <Handle type="target" ... position={Position.Left} />
    // <Handle type="source" ... position={Position.Right} />
    // These are different types. React Flow allows one source and one target without IDs (I think).
    // But if I have "Hybrid", I have source AND target at Left.
    // So I definitely need IDs now.

    const isConnectedLeft = edges.some(e => (e.source === id && e.sourceHandle === leftId) || (e.target === id && e.targetHandle === leftId));
    const isConnectedRight = edges.some(e => (e.source === id && e.sourceHandle === rightId) || (e.target === id && e.targetHandle === rightId));

    // Also check for legacy connections (handleId is null)
    const isConnectedLegacyLeft = edges.some(e => e.target === id && !e.targetHandle);
    const isConnectedLegacyRight = edges.some(e => e.source === id && !e.sourceHandle);

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: isTask ? 'auto' : '40px',
                height: '40px',
                background: isDark ? '#1e1e1e' : '#fff',
                border: `2px solid ${selected ? (isDark ? '#4fc3f7' : '#0070f3') : (color ?? (isDark ? '#333' : '#ddd'))} `,
                borderRadius: isTask ? '8px' : '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isTask ? '0 12px' : '0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                gap: '8px',
                minWidth: isTask ? '100px' : '40px',
                position: 'relative' // Ensure handles are positioned relative to this
            }}
            onClick={isCopy ? handleCopy : handleToggleTask}
        >
            <div style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isCollector && <Merge size={18} color={color} />}
                {isPortal && <ArrowUpRight size={18} color={color} />}
                {(!isTask && !isCollector && !isPortal) && <Icon size={18} color={color ?? (isDark ? '#ccc' : '#666')} />}
            </div>

            {isTask && (
                <>
                    <div
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: `2px solid ${data.checked ? '#4caf50' : (isDark ? '#666' : '#999')} `,
                            background: data.checked ? '#4caf50' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            flexShrink: 0,
                            pointerEvents: 'auto' // Interactive
                        }}
                    >
                        {data.checked && <Check size={14} color="#fff" style={{ pointerEvents: 'none' }} />}
                    </div>
                    <input
                        type="text"
                        value={localLabel}
                        onChange={handleLabelChange}
                        onBlur={handleLabelBlur}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Tarefa..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: isDark ? '#eee' : '#333',
                            fontSize: '0.9rem',
                            outline: 'none',
                            textDecoration: data.checked ? 'line-through' : 'none',
                            opacity: data.checked ? 0.6 : 1,
                            minWidth: 0,
                            pointerEvents: 'auto' // Interactive
                        }}
                    />
                </>
            )}

            {/* Hover Delete Button */}
            {selected && (
                <div
                    onClick={handleDelete}
                    style={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        background: '#ef4444',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        zIndex: 50
                    }}
                >
                    <X size={12} color="#fff" />
                </div>
            )}

            {/* Hybrid Handles */}
            <HybridHandle
                id={leftId}
                position={Position.Left}
                isConnected={isConnectedLeft || isConnectedLegacyLeft}
                isHovered={isHovered}
                showDebug={settings.showDebugHandles}
            />

            {isTask && (
                <HybridHandle
                    id={rightId}
                    position={Position.Right}
                    isConnected={isConnectedRight || isConnectedLegacyRight}
                    isHovered={isHovered}
                    showDebug={settings.showDebugHandles}
                />
            )}
        </motion.div>
    );
});

UtilityNode.displayName = 'UtilityNode';
