import { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import type { AppNode } from '../types/store';
import { useStore } from '../store/useStore';
import { Copy, Check, Merge, ArrowUpRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUtilityDefinition } from '../registry/utilities';

export const UtilityNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
    const { updateNodeData, edges, nodes, addToast, theme, onNodesChange } = useStore(
        useShallow((state) => ({
            updateNodeData: state.updateNodeData,
            edges: state.edges,
            nodes: state.nodes,
            addToast: state.addToast,
            theme: state.theme,
            onNodesChange: state.onNodesChange
        }))
    );

    const isDark = theme === 'dark';



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

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
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
                minWidth: isTask ? '100px' : '40px'
            }}
            onClick={isCopy ? handleCopy : handleToggleTask}
        >
            {isCollector && <Merge size={18} color={color} />}
            {isPortal && <ArrowUpRight size={18} color={color} />}
            {(!isTask && !isCollector && !isPortal) && <Icon size={18} color={color ?? (isDark ? '#ccc' : '#666')} />}

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
                            flexShrink: 0
                        }}
                    >
                        {data.checked && <Check size={14} color="#fff" />}
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
                            minWidth: 0
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

            {/* Hybrid Handle: Acts as both source and target visually */}
            <Handle
                type="target"
                style={{
                    background: isDark ? '#4fc3f7' : '#0070f3',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    zIndex: 10,
                    left: -7,
                    transition: 'all 0.2s',
                    border: '2px solid #fff' // Adding border back as user mentioned "gray point with white border" they like/expect
                }}
                position={Position.Left}
                isConnectable={true}
            />
            {isTask && (
                <Handle
                    type="source"
                    style={{
                        background: '#4caf50',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        zIndex: 10,
                        right: -7,
                        transition: 'all 0.2s',
                        border: '2px solid #fff'
                    }}
                    position={Position.Right}
                    isConnectable={true}
                />
            )}
        </motion.div>
    );
});

UtilityNode.displayName = 'UtilityNode';
