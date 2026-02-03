import React from 'react';
import { Panel } from '@xyflow/react';
import { StickyNote, Plus, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { getAllUtilities, type UtilityType } from '../registry/utilities';

interface CanvasToolbarProps {
    isDark: boolean;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ isDark }) => {
    const { t } = useTranslation();
    const addNoteNode = useStore(state => state.addNoteNode);
    const addUtilityNode = useStore(state => state.addUtilityNode);
    const [showUtilityMenu, setShowUtilityMenu] = React.useState(false);

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

    const dropdownActionStyle = {
        padding: '8px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.8rem',
        color: isDark ? '#eee' : '#333',
        transition: 'background 0.2s',
        borderRadius: '4px',
        width: '100%',
        border: 'none',
        background: 'transparent',
        textAlign: 'left' as const
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

            <div className="tooltip-container">
                <button
                    onClick={() => setShowUtilityMenu(!showUtilityMenu)}
                    style={{
                        ...buttonStyle,
                        background: showUtilityMenu ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent'
                    }}
                    className="toolbar-btn"
                >
                    <Wrench size={20} />
                </button>
                <div className="tooltip">Utilitários</div>

                {showUtilityMenu && (
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '12px',
                        background: isDark ? '#1e1e1e' : '#fff',
                        border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        padding: '4px',
                        minWidth: '150px',
                        zIndex: 1000
                    }}>
                        <div style={{ padding: '4px' }}>
                            {getAllUtilities().map((util) => (
                                <button
                                    key={util.type}
                                    style={dropdownActionStyle}
                                    className="menu-item"
                                    onClick={() => {
                                        addUtilityNode(util.type);
                                        setShowUtilityMenu(false);
                                    }}
                                >
                                    <util.icon size={16} />
                                    <span>{util.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
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
