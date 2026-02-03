import { memo } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { Move, MoreHorizontal, StickyNote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import type { AppNode } from '../../types/store';
import { useNoteLogic } from './useNoteLogic';
import { NoteNodeMenu } from './NoteNodeMenu';
import { NoteNodeHandles } from './NoteNodeHandles';
import { NoteNodeStyles } from './NoteNodeStyles';

export const NoteNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
    const theme = useStore(state => state.theme);
    const isDark = theme === 'dark';

    const {
        edges,
        menuState,
        setMenuState,
        popoverRef,
        buttonRef,
        popupPosition,
        taskStatus,
        effectiveBorderColor,
        scrollThumbColor,
        backgroundColor,
        handleTextChange,
        handleTitleChange,
        handleStyleUpdate,
        toggleMenu,
        onNodesChange,
        setConfirmationModal,
        borderStyle,
        customStyle
    } = useNoteLogic(id, data, isDark);

    return (
        <div className={`note-node-wrapper note-node-${id}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
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

            <NoteNodeMenu
                id={id}
                label={data.label ?? ''}
                menuState={menuState}
                setMenuState={setMenuState}
                popupPosition={popupPosition}
                popoverRef={popoverRef}
                isDark={isDark}
                customStyle={customStyle}
                handleStyleUpdate={handleStyleUpdate}
                onNodesChange={onNodesChange}
                setConfirmationModal={setConfirmationModal}
                createdAt={data.createdAt}
                updatedAt={data.updatedAt}
                edgesCount={edges.length}
                effectiveBorderColor={effectiveBorderColor}
            />

            {/* Content Container */}
            <motion.div
                className="nodrag"
                initial={false}
                animate={{
                    backgroundColor,
                    borderColor: selected ? (customStyle.borderColor ?? '#a855f7') : effectiveBorderColor,
                    opacity: taskStatus === 'completed' ? 0.7 : 1
                }}
                transition={{ duration: 0.3 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderWidth: '2px',
                    borderStyle: borderStyle,
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    cursor: 'default',
                    boxShadow: selected ? `0 0 0 1px ${customStyle.borderColor ?? '#a855f7'}` : '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '10px 12px',
                    paddingRight: '40px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                }}>
                    <StickyNote size={14} color={effectiveBorderColor} />
                    <input
                        value={data.label}
                        onChange={handleTitleChange}
                        placeholder="Título da nota..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isDark ? '#eee' : '#333',
                            width: '100%',
                            padding: 0
                        }}
                    />

                    {/* Style/Settings Button */}
                    <button
                        ref={buttonRef}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu();
                        }}
                        className="style-btn"
                        style={{
                            position: 'absolute',
                            right: '42px',
                            top: '8px',
                            background: menuState !== 'closed' ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                            color: isDark ? '#aaa' : '#666',
                            transition: 'all 0.2s',
                            opacity: menuState !== 'closed' ? 1 : 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 25
                        }}
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                {/* Editor Area */}
                <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                    <textarea
                        value={data.text}
                        onChange={handleTextChange}
                        placeholder="Comece a escrever aqui..."
                        className="note-node-textarea"
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            padding: '12px',
                            resize: 'none',
                            fontSize: '0.85rem',
                            lineHeight: 1.5,
                            color: isDark ? '#ddd' : '#444',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            </motion.div>

            <NoteNodeHandles
                id={id}
                isDark={isDark}
                edges={edges}
                effectiveBorderColor={effectiveBorderColor}
            />

            <NoteNodeStyles
                id={id}
                isDark={isDark}
                effectiveBorderColor={effectiveBorderColor}
                scrollThumbColor={scrollThumbColor}
            />

            <NodeResizer
                minWidth={200}
                minHeight={150}
                isVisible={selected}
                lineStyle={{
                    border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'}`,
                    opacity: 1
                }}
                handleStyle={{
                    opacity: 0,
                    width: 20,
                    height: 20,
                    zIndex: 200,
                    margin: -10
                }}
            />
        </div>
    );
});

NoteNode.displayName = 'NoteNode';
