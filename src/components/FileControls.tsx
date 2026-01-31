import React from 'react';
import { Save, X } from 'lucide-react';

interface FileControlsProps {
    isDark: boolean;
    isDirty: boolean;
    onSave: () => void;
    onClose: () => void;
}

export const FileControls: React.FC<FileControlsProps> = ({ isDark, isDirty, onSave, onClose }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            marginLeft: '8px',
            padding: '2px 6px',
            borderRadius: '6px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? '#333' : '#ddd'}`
        }}>
            <button
                onClick={onSave}
                title={isDirty ? "Save changes (Ctrl+S)" : "No pending changes (Ctrl+S)"}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDirty ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#555' : '#aaa'),
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    transform: isDirty ? 'scale(1.05)' : 'scale(1)',
                    opacity: isDirty ? 1 : 0.6
                }}
            >
                <Save size={16} strokeWidth={isDirty ? 2.5 : 2} />
            </button>

            <button
                onClick={onClose}
                title="Close file"
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#555' : '#aaa',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: 0.6
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = isDark ? '#fff' : '#000';
                    e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = isDark ? '#555' : '#aaa';
                    e.currentTarget.style.opacity = '0.6';
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};
