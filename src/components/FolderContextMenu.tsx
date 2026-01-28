import React from 'react';
import { FileCode, FolderPlus, Trash2 } from 'lucide-react';

interface FolderContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (type: 'file' | 'folder' | 'delete', ext?: string) => void;
    isDark: boolean;
    t: any;
}

const menuButtonStyle = (isDark: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: isDark ? '#ccc' : '#444',
    fontSize: '0.8rem',
    borderRadius: '4px',
    textAlign: 'left' as const,
    transition: 'background 0.2s',
    '&:hover': {
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        color: isDark ? '#fff' : '#000'
    }
} as any);

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({ x, y, onClose, onAction, isDark, t }) => {
    return (
        <>
            <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
                onClick={onClose}
                onContextMenu={(e) => { e.preventDefault(); onClose(); }}
            />
            <div style={{
                position: 'fixed',
                top: y,
                left: x,
                background: isDark ? '#1e1e1e' : '#fff',
                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                borderRadius: '8px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 1001,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                minWidth: '160px'
            }}>
                <button
                    onClick={() => onAction('file', '.js')}
                    style={menuButtonStyle(isDark)}
                >
                    <FileCode size={14} color="#f7df1e" />
                    <span>{t('file_explorer.new_js') || 'Novo Arquivo JS'}</span>
                </button>
                <button
                    onClick={() => onAction('file', '.ts')}
                    style={menuButtonStyle(isDark)}
                >
                    <FileCode size={14} color="#3178c6" />
                    <span>{t('file_explorer.new_ts') || 'Novo Arquivo TS'}</span>
                </button>
                <button
                    onClick={() => onAction('folder')}
                    style={menuButtonStyle(isDark)}
                >
                    <FolderPlus size={14} color={isDark ? '#888' : '#666'} />
                    <span>{t('file_explorer.new_folder') || 'Nova Pasta'}</span>
                </button>
                <div style={{ height: '1px', background: isDark ? '#333' : '#eee', margin: '4px 0' }} />
                <button
                    onClick={() => onAction('delete')}
                    style={{ ...menuButtonStyle(isDark), color: '#ef4444' }}
                >
                    <Trash2 size={14} />
                    <span>{t('file_explorer.delete') || 'Excluir'}</span>
                </button>
            </div>
        </>
    );
};
