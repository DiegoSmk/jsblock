import React, { memo, useCallback, useState, useRef } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import type { AppNode, NodeCustomStyle } from '../types/store';
import { useStore } from '../store/useStore';
import { StickyNote, Move, X, RotateCcw, MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NOTE_PALETTE, STROKE_OPACITY } from '../constants/design';
import { createPortal } from 'react-dom';

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper for menu buttons
interface MenuButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color?: string;
    isDark?: boolean;
}

const MenuButton = ({ icon: Icon, label, onClick, color, isDark }: MenuButtonProps) => (
    <button
        onClick={onClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer',
            color: color ?? (isDark ? '#eee' : '#333'),
            transition: 'background 0.2s',
            textAlign: 'left',
            fontSize: '0.9rem',
            outline: 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
        <Icon size={16} />
        {label}
    </button>
);

export const NoteNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
    const updateNodeData = useStore(state => state.updateNodeData);
    const theme = useStore(state => state.theme);
    const { t } = useTranslation();
    const isDark = theme === 'dark';

    const [menuState, setMenuState] = useState<'closed' | 'menu' | 'style' | 'details'>('closed');
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    const customStyle = data.customStyle ?? {};

    // Defaults
    const borderOpacity = customStyle.borderOpacity ?? 1;
    const borderStyle = customStyle.borderStyle ?? 'solid';

    const effectiveBorderColor = React.useMemo(() => hexToRgba(
        customStyle.borderColor ?? (isDark ? '#444444' : '#e6c02a'),
        borderOpacity
    ), [customStyle.borderColor, borderOpacity, isDark]);

    const scrollThumbColor = React.useMemo(() => hexToRgba(
        customStyle.borderColor ?? (isDark ? '#444444' : '#e6c02a'),
        Math.min(1, borderOpacity * 0.5)
    ), [customStyle.borderColor, borderOpacity, isDark]);

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

    const toggleMenu = () => {
        if (menuState === 'closed') {
            // Opening: Calculate Position
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                // Default to top-right of button
                let top = rect.top - 10;
                let left = rect.right + 10;

                // Check boundaries (simple heuristic)
                if (left + 220 > window.innerWidth) {
                    left = rect.left - 230; // Flip to left
                }
                if (top + 300 > window.innerHeight) {
                    top = window.innerHeight - 310;
                }
                if (top < 10) top = 10;

                setPopupPosition({ top, left });
            }
            setMenuState('menu');
        } else {
            setMenuState('closed');
        }
    };

    // Click outside handler is now managed by the backdrop overlay in the portal

    const edges = useStore(useShallow(useCallback(state =>
        state.edges.filter(edge => edge.source === id || edge.target === id),
        [id])));
    const onNodesChange = useStore(state => state.onNodesChange);
    const getHandleColors = (handleId: string, type: 'source' | 'target') => {
        const connectedEdges = edges.filter(edge =>
            type === 'source'
                ? edge.source === id && edge.sourceHandle === handleId
                : edge.target === id && edge.targetHandle === handleId
        );

        const colors = new Set<string>();
        connectedEdges.forEach(edge => {
            const color = (edge.style?.stroke as string) || (isDark ? '#4fc3f7' : '#0070f3');
            if (color) colors.add(color);
        });

        return Array.from(colors);
    };

    const renderHandleVisual = (handleId: string, type: 'source' | 'target') => {
        const colors = getHandleColors(handleId, type);
        const hasConnection = colors.length > 0;

        // Generate animation name if multiple colors
        const animationName = `blink-${id}-${handleId}`;
        const keyframes = colors.length > 1
            ? `@keyframes ${animationName} {
                ${colors.map((c, i) => `${(i / colors.length) * 100}% { border-color: ${c}; }`).join('\n')}
                100% { border-color: ${colors[0]}; }
              }`
            : '';

        const style: React.CSSProperties = {};
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
                    width: 40,
                    height: 40,
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

            {/* Menu & Style Portal */}
            {menuState !== 'closed' && createPortal(
                <>
                    {/* Backdrop Overlay to close menu on click outside */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9998,
                            cursor: 'default'
                        }}
                        onMouseDown={(e) => {
                            e.stopPropagation(); // Prevent passing click to canvas
                            setMenuState('closed');
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuState('closed');
                        }}
                    />
                    <div
                        ref={popoverRef}
                        className="nodrag"
                        style={{
                            position: 'fixed',
                            top: popupPosition.top,
                            left: popupPosition.left,
                            background: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(12px)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                            padding: '12px',
                            zIndex: 9999,
                            width: '210px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            animation: 'fadeIn 0.15s ease-out'
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {menuState === 'menu' ? (
                            <>
                                <MenuButton
                                    icon={Trash2}
                                    label={t('note.delete') || "Excluir"}
                                    color={isDark ? '#ef4444' : '#dc2626'}
                                    isDark={isDark}
                                    onClick={() => {
                                        onNodesChange([{ id, type: 'remove' }]);
                                        setMenuState('closed');
                                    }}
                                />
                                <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '2px 0' }} />
                                <MenuButton
                                    icon={StickyNote}
                                    label="Estilo"
                                    isDark={isDark}
                                    onClick={() => setMenuState('style')}
                                />
                                <MenuButton
                                    icon={MoreHorizontal}
                                    label="Detalhes"
                                    isDark={isDark}
                                    onClick={() => setMenuState('details')}
                                />
                            </>
                        ) : menuState === 'style' ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <button
                                        onClick={() => setMenuState('menu')}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                                    >
                                        {/* Back arrow could go here */}
                                        Estilo
                                    </button>
                                    <div style={{ display: 'flex', gap: '4px' }}>

                                        <button
                                            onClick={() => handleStyleUpdate({ borderColor: undefined, borderOpacity: undefined, borderStyle: undefined })}
                                            title="Restaurar Padrão"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: isDark ? '#aaa' : '#666',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                        <button
                                            onClick={() => setMenuState('closed')}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', padding: '4px' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Colors */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <button
                                        title={t('style.default')}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: 'transparent',
                                            border: !customStyle.borderColor ? `2px solid ${isDark ? '#fff' : '#000'}` : `1px dashed ${isDark ? '#aaa' : '#666'}`,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isDark ? '#fff' : '#000',
                                            transition: 'all 0.1s'
                                        }}
                                        onClick={() => handleStyleUpdate({ borderColor: undefined })}
                                    >
                                        <div style={{ width: '12px', height: '2px', background: 'currentColor', transform: 'rotate(45deg)', position: 'absolute' }} />
                                    </button>
                                    {Object.values(NOTE_PALETTE).map(color => (
                                        <button
                                            key={color}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                background: color,
                                                border: customStyle.borderColor === color ? `2px solid ${isDark ? '#fff' : '#000'}` : '2px solid transparent',
                                                cursor: 'pointer',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                transition: 'transform 0.1s'
                                            }}
                                            onClick={() => handleStyleUpdate({ borderColor: color })}
                                        />
                                    ))}
                                </div>

                                {/* Opacity */}
                                <div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isDark ? '#aaa' : '#666', marginBottom: '8px', display: 'block' }}>Opacidade da Borda</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {Object.entries(STROKE_OPACITY).map(([label, value]) => (
                                            <button
                                                key={label}
                                                style={{
                                                    flex: 1,
                                                    height: '6px',
                                                    borderRadius: '3px',
                                                    background: customStyle.borderColor ?? (isDark ? '#fff' : '#000'),
                                                    opacity: value,
                                                    border: borderOpacity === value ? `1px solid ${isDark ? '#fff' : '#000'}` : 'none',
                                                    boxShadow: borderOpacity === value ? '0 0 0 1px rgba(0,0,0,0.2)' : 'none',
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
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isDark ? '#aaa' : '#666', marginBottom: '8px', display: 'block' }}>Estilo da Linha</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            style={{ flex: 1, height: '24px', background: 'transparent', border: `1px solid ${isDark ? '#aaa' : '#666'}`, cursor: 'pointer', opacity: borderStyle === 'solid' ? 1 : 0.5, borderRadius: '4px' }}
                                            onClick={() => handleStyleUpdate({ borderStyle: 'solid' })}
                                        />
                                        <button
                                            style={{ flex: 1, height: '24px', background: 'transparent', border: `1px dashed ${isDark ? '#aaa' : '#666'}`, cursor: 'pointer', opacity: borderStyle === 'dashed' ? 1 : 0.5, borderRadius: '4px' }}
                                            onClick={() => handleStyleUpdate({ borderStyle: 'dashed' })}
                                        />
                                        <button
                                            style={{ flex: 1, height: '24px', background: 'transparent', border: `1px dotted ${isDark ? '#aaa' : '#666'}`, cursor: 'pointer', opacity: borderStyle === 'dotted' ? 1 : 0.5, borderRadius: '4px' }}
                                            onClick={() => handleStyleUpdate({ borderStyle: 'dotted' })}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <button
                                        onClick={() => setMenuState('menu')}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                                    >
                                        Detalhes
                                    </button>
                                    <button
                                        onClick={() => setMenuState('closed')}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', padding: '4px' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: isDark ? '#eee' : '#333' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: isDark ? '#aaa' : '#666' }}>Criação</span>
                                        <span>{data.createdAt ? new Date(data.createdAt).toLocaleString() : '---'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: isDark ? '#aaa' : '#666' }}>Última Atualização</span>
                                        <span>{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '---'}</span>
                                    </div>
                                    <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '4px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Conexões</span>
                                        <span style={{
                                            background: effectiveBorderColor,
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700
                                        }}>
                                            {edges.filter(e => e.source === id || e.target === id).length}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>,
                document.body
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

                    {/* Style Toggle Button - Improved positioning and visibility */}
                    <button
                        ref={buttonRef}
                        onClick={toggleMenu}
                        className="nodrag style-btn"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDark ? '#aaa' : '#666',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            opacity: menuState !== 'closed' ? 1 : 0, // Hidden by default, shown on hover via CSS
                        }}
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                <textarea
                    className="note-node-textarea nowheel nodrag"
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
                {renderHandleVisual('top', 'target')}
            </Handle>
            <Handle
                id="right"
                type="source"
                position={Position.Right}
                className="note-handle"
                style={{ ...handleStyle, right: -20 }}
            >
                {renderHandleVisual('right', 'source')}
            </Handle>
            <Handle
                id="bottom"
                type="source"
                position={Position.Bottom}
                className="note-handle"
                style={{ ...handleStyle, bottom: -20 }}
            >
                {renderHandleVisual('bottom', 'source')}
            </Handle>
            <Handle
                id="left"
                type="target"
                position={Position.Left}
                className="note-handle"
                style={{ ...handleStyle, left: -20 }}
            >
                {renderHandleVisual('left', 'target')}
            </Handle>

            <style>{`
                /* Show Style Button on Hover */
                .note-node-wrapper:hover .style-btn,
                .style-btn:focus,
                .style-btn:active {
                    opacity: 1 !important;
                    background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
                }

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
                    width: 12px;
                    height: 12px;
                    background: ${effectiveBorderColor}; /* Inner color matches note border/theme */
                    border: 2px solid #ffffff; /* FORCE WHITE BORDER for visibility */
                    border-radius: 4px;
                    opacity: 0 !important;
                    transition: all 0.15s ease-out;
                    transform: scale(0.8);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3); /* Stronger shadow */
                }

                /* Neutralize Hover if not selected or custom colored */
                
                /* Show on Hover OR Connected */
                .note-handle:hover .visual-handle,
                .visual-handle.connected {
                    opacity: 1 !important;
                    transform: scale(1);
                }
                
                .visual-handle.connected {
                    /* Background color always matches note accent/border */
                    background: ${effectiveBorderColor};
                    /* Border color is handled by inline style for connections */
                }

                .visual-handle.connected:hover {
                    box-shadow: 0 0 0 2px ${effectiveBorderColor};
                }

                .note-node-textarea::-webkit-scrollbar {
                    width: 10px;
                    cursor: default;
                }
                .note-node-textarea::-webkit-scrollbar-track {
                    background: transparent;
                    cursor: default;
                }
                .note-node-textarea::-webkit-scrollbar-thumb {
                    background-color: ${scrollThumbColor}; 
                    border-radius: 6px;
                    border: 3px solid transparent;
                    background-clip: content-box;
                    cursor: pointer !important;
                }
                .note-node-textarea::-webkit-scrollbar-thumb:hover {
                    background-color: ${effectiveBorderColor}; /* Full note opacity on hover */
                    cursor: pointer !important;
                }
            `}</style>
        </div >
    );
});

NoteNode.displayName = 'NoteNode';
