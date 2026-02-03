import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import type { AppNode } from '../types/store';
import { useStore } from '../store/useStore';
import { Copy, Check } from 'lucide-react';

export const UtilityNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
    const { updateNodeData, edges, nodes, addToast, theme } = useStore(
        useShallow((state) => ({
            updateNodeData: state.updateNodeData,
            edges: state.edges,
            nodes: state.nodes,
            addToast: state.addToast,
            theme: state.theme
        }))
    );

    const isDark = theme === 'dark';
    const isTask = data.utilityType === 'task';
    const isCopy = data.utilityType === 'copy';

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

    return (
        <div
            style={{
                width: isTask ? 'auto' : '40px',
                height: '40px',
                background: isDark ? '#1e1e1e' : '#fff',
                border: `2px solid ${selected ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#333' : '#ddd')}`,
                borderRadius: isTask ? '8px' : '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isTask ? '0 12px' : '0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                gap: '8px',
                minWidth: isTask ? '100px' : '40px'
            }}
            onClick={isCopy ? handleCopy : handleToggleTask}
        >
            {isCopy && <Copy size={18} color={isDark ? '#ccc' : '#666'} />}

            {isTask && (
                <>
                    <div
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: `2px solid ${data.checked ? '#4caf50' : (isDark ? '#666' : '#999')}`,
                            background: data.checked ? '#4caf50' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        {data.checked && <Check size={14} color="#fff" />}
                    </div>
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: isDark ? '#eee' : '#333',
                        textDecoration: data.checked ? 'line-through' : 'none',
                        opacity: data.checked ? 0.6 : 1
                    }}>
                        {data.label ?? 'Tarefa'}
                    </span>
                </>
            )}

            {/* Target handle: where the note connects to the utility */}
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    background: isDark ? '#4fc3f7' : '#0070f3',
                    width: 8,
                    height: 8,
                    border: '2px solid #fff'
                }}
            />

            {/* Source handle: only for tasks to allow sub-tasks */}
            {isTask && (
                <Handle
                    type="source"
                    position={Position.Right}
                    style={{
                        background: '#4caf50',
                        width: 8,
                        height: 8,
                        border: '2px solid #fff'
                    }}
                />
            )}
        </div>
    );
});

UtilityNode.displayName = 'UtilityNode';
