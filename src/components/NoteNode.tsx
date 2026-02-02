import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { AppNode, NodeCustomStyle } from '../types/store';
import { useStore } from '../store/useStore';
import { StickyNote, Move, Palette, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NOTE_PALETTE, STROKE_OPACITY } from '../constants/design';

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const NoteNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
    const updateNodeData = useStore(state => state.updateNodeData);
    const theme = useStore(state => state.theme);
    const { t } = useTranslation();
    const isDark = theme === 'dark';

    const [isStyleOpen, setIsStyleOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const customStyle = data.customStyle ?? {};

    // Defaults
    const borderOpacity = customStyle.borderOpacity ?? 1;
    const borderStyle = customStyle.borderStyle ?? 'solid';

    // Calculate effective border color
    const effectiveBorderColor = customStyle.borderColor
        ? hexToRgba(customStyle.borderColor, borderOpacity)
        : (isDark ? '#444' : '#e6c02a');

    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData(id, { ...data, text: e.target.value });
    }, [id, data, updateNodeData]);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData(id, { ...data, label: e.target.value });
    }, [id, data, updateNodeData]);

    const handleStyleUpdate = (updates: Partial<NodeCustomStyle>) => {
        updateNodeData(id, {
            customStyle: {
                ...customStyle,
                ...updates
            }
        });
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsStyleOpen(false);
            }
        };

        if (isStyleOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isStyleOpen]);

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
                    background: selected ? (customStyle.borderColor ?? '#a855f7') : effectiveBorderColor,
                    opacity: selected ? 1 : 0.5,
                    borderTopRightRadius: '9px',
                    borderBottomLeftRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '-1px 1px 2px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                }}
            >
                <Move size={18} color="#fff" />
            </div>

            {/* Style Popover */}
            {isStyleOpen && (
                <div
                    ref={popoverRef}
                    className="nodrag"
                    style={{
                        position: 'absolute',
                        top: '-140px',
                        right: '0',
                        background: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        padding: '12px',
                        zIndex: 100,
                        width: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: isDark ? '#fff' : '#000' }}>Estilo da Nota</span>
                        <button
                            onClick={() => setIsStyleOpen(false)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', padding: 0 }}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Colors */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {Object.values(NOTE_PALETTE).map(color => (
                            <button
                                key={color}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: color,
                                    border: customStyle.borderColor === color ? `2px solid ${isDark ? '#fff' : '#000'}` : '2px solid transparent',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }}
                                onClick={() => handleStyleUpdate({ borderColor: color })}
                            />
                        ))}
                    </div>

                    {/* Opacity */}
                    <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isDark ? '#aaa' : '#666', marginBottom: '4px', display: 'block' }}>Opacidade</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {Object.entries(STROKE_OPACITY).map(([label, value]) => (
                                <button
                                    key={label}
                                    style={{
                                        flex: 1,
                                        height: '6px',
                                        borderRadius: '3px',
                                        background: isDark ? '#fff' : '#000',
                                        opacity: value,
                                        border: borderOpacity === value ? `1px solid ${isDark ? '#4fc3f7' : '#0070f3'}` : 'none',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleStyleUpdate({ borderOpacity: value })}
                                    title={`Opacidade: ${value * 100}%`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Border Style */}
                    <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isDark ? '#aaa' : '#666', marginBottom: '4px', display: 'block' }}>Borda</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                style={{ flex: 1, height: '20px', background: 'transparent', border: `1px solid ${isDark ? '#aaa' : '#666'}`, cursor: 'pointer', opacity: borderStyle === 'solid' ? 1 : 0.5 }}
                                onClick={() => handleStyleUpdate({ borderStyle: 'solid' })}
                            />
                            <button
                                style={{ flex: 1, height: '20px', background: 'transparent', border: `1px dashed ${isDark ? '#aaa' : '#666'}`, cursor: 'pointer', opacity: borderStyle === 'dashed' ? 1 : 0.5 }}
                                onClick={() => handleStyleUpdate({ borderStyle: 'dashed' })}
                            />
                            <button
                                style={{ flex: 1, height: '20px', background: 'transparent', border: `1px dotted ${isDark ? '#aaa' : '#666'}`, cursor: 'pointer', opacity: borderStyle === 'dotted' ? 1 : 0.5 }}
                                onClick={() => handleStyleUpdate({ borderStyle: 'dotted' })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Content Container */}
            <div
                className="nodrag"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: isDark ? '#252525' : '#fff9c4',
                    borderWidth: '2px',
                    borderStyle: borderStyle,
                    borderColor: selected ? (customStyle.borderColor ?? '#a855f7') : effectiveBorderColor,
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    cursor: 'default',
                    boxShadow: selected ? `0 0 0 1px ${customStyle.borderColor ?? '#a855f7'}` : '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'border-color 0.2s ease, border-style 0.2s ease'
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
                    <StickyNote size={15} color={selected ? (customStyle.borderColor ?? '#a855f7') : effectiveBorderColor} />
                    <input
                        value={data.label ?? ''}
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

                    {/* Style Toggle Button */}
                    <button
                        onClick={() => setIsStyleOpen(!isStyleOpen)}
                        className="nodrag"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDark ? '#aaa' : '#666',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <Palette size={14} />
                    </button>
                </div>

                <textarea
                    className="note-node-textarea"
                    value={data.text ?? ''}
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
