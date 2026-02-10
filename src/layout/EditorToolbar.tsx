import React from 'react';
import {
    Code,
    Zap,
    ZapOff,
    SquareStack,
    Save,
    X,
    Check
} from 'lucide-react';

interface EditorToolbarProps {
    isDark: boolean;
    selectedFile: string | null;
    livePreviewEnabled: boolean;
    showCanvas: boolean;
    isDirty: boolean;
    onToggleLivePreview: () => void;
    onToggleCanvas: () => void;
    onSave: () => void;
    onClose: () => void;
}

/**
 * Editor tab bar with file name and action buttons.
 * Extracted from App.tsx — all styles and behavior preserved exactly.
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    isDark,
    selectedFile,
    livePreviewEnabled,
    showCanvas,
    isDirty,
    onToggleLivePreview,
    onToggleCanvas,
    onSave,
    onClose,
}) => {
    if (!selectedFile) return null;

    return (
        <div style={{
            height: '32px',
            minHeight: '32px',
            flexShrink: 0,
            background: isDark ? '#2d2d2d' : '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 0 0 12px',
            fontSize: '0.75rem',
            color: isDark ? '#aaa' : '#666',
            borderBottom: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`,
            justifyContent: 'space-between'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: isDark ? '#aaa' : '#666'
            }}>
                <Code size={14} style={{ marginRight: '8px' }} />
                {selectedFile.split(/[\\/]/).pop()}
            </div>

            <div style={{ display: 'flex', height: '100%' }}>
                <div
                    onClick={onToggleLivePreview}
                    title={livePreviewEnabled ? "Disable Live Execution (Zap)" : "Enable Live Execution (Zap)"}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '38px',
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: livePreviewEnabled ? (isDark ? '#4ec9b0' : '#008080') : (isDark ? '#555' : '#ccc'),
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderLeft: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`
                    }}
                >
                    {livePreviewEnabled ? <Zap size={18} fill={livePreviewEnabled ? 'currentColor' : 'none'} fillOpacity={0.2} /> : <ZapOff size={18} />}
                </div>

                <div
                    onClick={onToggleCanvas}
                    title={showCanvas ? "Hide Blocks Workspace" : "Show Blocks Workspace"}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '38px',
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: showCanvas ? (isDark ? '#6366f1' : '#4f46e5') : (isDark ? '#555' : '#ccc'),
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderLeft: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`
                    }}
                >
                    <SquareStack size={18} fill={showCanvas ? 'currentColor' : 'none'} fillOpacity={0.1} />
                </div>

                <div
                    onClick={onSave}
                    title={isDirty ? "Save changes (Ctrl+S)" : "No pending changes"}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '38px',
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: isDirty ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#555' : '#ccc'),
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderLeft: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`,
                        opacity: isDirty ? 1 : 0.8
                    }}
                >
                    {isDirty ? (
                        <Save size={16} strokeWidth={2.5} />
                    ) : (
                        <Check size={16} strokeWidth={2} style={{ color: isDark ? '#4ade80' : '#16a34a' }} />
                    )}
                </div>

                <div
                    onClick={onClose}
                    title="Close file"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '38px',
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: isDark ? '#555' : '#aaa',
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderLeft: `1px solid ${isDark ? '#3c3c3c' : '#ddd'}`,
                        opacity: 0.6
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = isDark ? '#fff' : '#ef4444';
                        e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = isDark ? '#555' : '#aaa';
                        e.currentTarget.style.opacity = '0.6';
                    }}
                >
                    <X size={16} />
                </div>
            </div>
        </div>
    );
};
