import React from 'react';

interface NoteNodeStylesProps {
    id: string;
    isDark: boolean;
    effectiveBorderColor: string;
    scrollThumbColor: string;
}

export const NoteNodeStyles: React.FC<NoteNodeStylesProps> = ({
    id,
    isDark,
    effectiveBorderColor,
    scrollThumbColor
}) => {
    return (
        <style>{`
            /* Show Style Button on Hover */
            .note-node-${id}:hover .style-btn,
            .note-node-${id} .style-btn:focus,
            .note-node-${id} .style-btn:active {
                opacity: 1 !important;
                background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
            }

            /* Ensure Handle component overrides */
            .note-node-${id} .note-handle {
                width: 32px !important;
                height: 32px !important;
                min-width: 32px !important;
                min-height: 32px !important;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                z-index: 300 !important;
            }

            /* Visual Square */
            .note-node-${id} .visual-handle {
                width: 14px;
                height: 14px;
                border: 2px solid #ffffff;
                border-radius: 4px;
                opacity: 0;
                transition: all 0.15s ease-out;
                transform: scale(0.9);
                box-shadow: 0 1px 4px rgba(0,0,0,0.4);
            }

            /* Show at low opacity when node is hovered */
            .note-node-${id}:hover .visual-handle {
                opacity: 0.3;
            }
            
            /* Show at full opacity when port is hovered or connected */
            .note-node-${id} .note-handle:hover .visual-handle,
            .note-node-${id} .visual-handle.connected {
                opacity: 1 !important;
                transform: scale(1);
            }
            
            /* Keep connected ones visible */
            .note-node-${id} .visual-handle.connected {
                opacity: 1 !important;
            }

            .note-node-${id} .visual-handle.connected:hover {
                box-shadow: 0 0 0 2px ${effectiveBorderColor};
            }

            .note-node-${id} .note-node-textarea::-webkit-scrollbar {
                width: 10px;
                cursor: default;
            }
            .note-node-${id} .note-node-textarea::-webkit-scrollbar-track {
                background: transparent;
                cursor: default;
            }
            .note-node-${id} .note-node-textarea::-webkit-scrollbar-thumb {
                background-color: ${scrollThumbColor}; 
                border-radius: 6px;
                border: 3px solid transparent;
                background-clip: content-box;
                cursor: pointer !important;
            }
            .note-node-${id} .note-node-textarea::-webkit-scrollbar-thumb:hover {
                background-color: ${effectiveBorderColor}; 
                cursor: pointer !important;
            }
        `}</style>
    );
};
