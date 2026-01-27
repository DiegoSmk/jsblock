import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { useStore } from '../store/useStore';
import { StickyNote, Move } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NoteNode = memo(({ id, data, selected }: any) => {
    const updateNodeData = useStore(state => state.updateNodeData);
    const theme = useStore(state => state.theme);
    const { t } = useTranslation();
    const isDark = theme === 'dark';

    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData(id, { ...data, text: e.target.value });
    }, [id, data, updateNodeData]);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData(id, { ...data, label: e.target.value });
    }, [id, data, updateNodeData]);

    const edges = useStore(state => state.edges);
    const isConnected = (handleId: string, type: 'source' | 'target') => {
        return edges.some(edge =>
            type === 'source'
                ? edge.source === id && edge.sourceHandle === handleId
                : edge.target === id && edge.targetHandle === handleId
        );
    };

    const handleStyle = {
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        zIndex: 50,
        pointerEvents: 'all' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    return (
        <div className="note-node-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
            <NodeResizer
                minWidth={200}
                minHeight={150}
                isVisible={selected}
                lineStyle={{ opacity: 0 }}
                handleStyle={{
                    opacity: 0,
                    width: 25,
                    height: 25,
                    borderRadius: '50%'
                }}
            />

            {/* Move Handle */}
            <div
                style={{
                    position: 'absolute',
                    top: -1,
                    right: -1,
                    width: '34px',
                    height: '34px',
                    zIndex: 20,
                    cursor: 'grab',
                    background: '#a855f7',
                    borderTopRightRadius: '9px',
                    borderBottomLeftRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '-1px 1px 2px rgba(0,0,0,0.1)'
                }}
            >
                <Move size={18} color="#fff" />
            </div>

            {/* Content Container */}
            <div
                className="nodrag"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: isDark ? '#252525' : '#fff9c4',
                    border: `2px solid ${selected ? '#a855f7' : (isDark ? '#444' : '#e6c02a')}`,
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    cursor: 'default',
                    boxShadow: selected ? '0 0 0 1px #a855f7' : '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                <div style={{
                    padding: '10px 12px',
                    paddingRight: '40px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
                    flexShrink: 0,
                    height: '40px',
                    boxSizing: 'border-box'
                }}>
                    <StickyNote size={15} color={isDark ? '#a855f7' : '#d4a017'} />
                    <input
                        value={data.label || ''}
                        onChange={handleTitleChange}
                        placeholder={t('note.title_placeholder')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            outline: 'none',
                            flex: 1,
                            minWidth: 0,
                            padding: 0,
                            cursor: 'text'
                        }}
                    />
                </div>

                <textarea
                    className="note-node-textarea"
                    value={data.text || ''}
                    onChange={handleTextChange}
                    placeholder={t('note.text_placeholder')}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#eee' : '#333',
                        fontSize: '0.85rem',
                        resize: 'none',
                        outline: 'none',
                        padding: '12px',
                        fontFamily: 'inherit',
                        lineHeight: '1.6',
                        cursor: 'text',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Connection Handles */}
            <Handle
                id="top"
                type="target"
                position={Position.Top}
                className="note-handle"
                style={{ ...handleStyle, top: -20 }}
            >
                <div className={`visual-handle ${isConnected('top', 'target') ? 'connected' : ''}`} />
            </Handle>
            <Handle
                id="right"
                type="source"
                position={Position.Right}
                className="note-handle"
                style={{ ...handleStyle, right: -20 }}
            >
                <div className={`visual-handle ${isConnected('right', 'source') ? 'connected' : ''}`} />
            </Handle>
            <Handle
                id="bottom"
                type="source"
                position={Position.Bottom}
                className="note-handle"
                style={{ ...handleStyle, bottom: -20 }}
            >
                <div className={`visual-handle ${isConnected('bottom', 'source') ? 'connected' : ''}`} />
            </Handle>
            <Handle
                id="left"
                type="target"
                position={Position.Left}
                className="note-handle"
                style={{ ...handleStyle, left: -20 }}
            >
                <div className={`visual-handle ${isConnected('left', 'target') ? 'connected' : ''}`} />
            </Handle>

            <style>{`
                /* Ensure Handle component overrides */
                .note-handle {
                    width: 40px !important;
                    height: 40px !important;
                    min-width: 40px !important;
                    min-height: 40px !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    z-index: 50 !important;
                }

                /* Visual Square */
                .visual-handle {
                    width: 12px; /* Slightly larger visual */
                    height: 12px;
                    background: #a855f7;
                    border: 2px solid #fff;
                    border-radius: 4px; /* Curved border (Squircle) */
                    opacity: 0 !important; /* Force hidden by default */
                    transition: all 0.15s ease-out;
                    transform: scale(0.8);
                }

                /* Show on Hover OR Connected */
                .note-handle:hover .visual-handle,
                .visual-handle.connected {
                    opacity: 1 !important;
                    transform: scale(1);
                }
                
                .visual-handle.connected {
                    background: #9333ea;
                    box-shadow: 0 0 0 1px #fff;
                }

                .visual-handle.connected:hover {
                    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.4);
                }

                .note-node-textarea::-webkit-scrollbar {
                    width: 12px;
                }
                .note-node-textarea::-webkit-scrollbar-track {
                    background: transparent;
                }
                .note-node-textarea::-webkit-scrollbar-thumb {
                    background-color: ${isDark ? '#a855f7' : '#d4a017'};
                    border-radius: 6px;
                    border: 3px solid transparent;
                    background-clip: content-box;
                }
                .note-node-textarea::-webkit-scrollbar-thumb:hover {
                    background-color: ${isDark ? '#c084fc' : '#b8860b'};
                }
            `}</style>
        </div>
    );
});

NoteNode.displayName = 'NoteNode';
