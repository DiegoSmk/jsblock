import React from 'react';
import { Panel } from '@xyflow/react';
import { StickyNote, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

interface CanvasToolbarProps {
    isDark: boolean;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ isDark }) => {
    const { t } = useTranslation();
    const addNoteNode = useStore(state => state.addNoteNode);

    const buttonStyle = {
        background: 'transparent',
        border: 'none',
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
        color: isDark ? '#eee' : '#333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative' as const
    };

    return (
        <Panel
            position="bottom-center"
            className="canvas-toolbar"
            style={{
                display: 'flex',
                gap: '8px',
                padding: '6px',
                background: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                marginBottom: '24px',
                pointerEvents: 'all'
            }}
        >
            <div className="tooltip-container">
                <button
                    onClick={addNoteNode}
                    style={buttonStyle}
                    className="toolbar-btn"
                    aria-label={t('toolbar.add_note')}
                >
                    <StickyNote size={20} />
                    <div style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 6,
                        background: isDark ? '#000' : '#fff',
                        borderRadius: '50%',
                        padding: '1px',
                        display: 'flex'
                    }}>
                        <Plus size={8} strokeWidth={4} />
                    </div>
                </button>
                <div className="tooltip">{t('toolbar.add_note')}</div>
            </div>

            <style>{`
                .toolbar-btn:hover {
                    background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} !important;
                    transform: translateY(-1px);
                }
                .toolbar-btn:active {
                    transform: translateY(0);
                }
                
                /* Tooltip Logic */
                .tooltip-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                
                .tooltip {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(10px);
                    background: ${isDark ? '#000' : '#fff'};
                    color: ${isDark ? '#fff' : '#000'};
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.2s ease;
                    border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    margin-bottom: 8px;
                }

                .tooltip-container:hover .tooltip {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            `}</style>
        </Panel>
    );
};
