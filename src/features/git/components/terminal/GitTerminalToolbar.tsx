import React from 'react';
import { Zap, X, Plus } from 'lucide-react';
import { useStore } from '../../../../store/useStore';

interface GitTerminalToolbarProps {
    isDark: boolean;
    onAddClick: () => void;
    onRunCommand: (cmd: string, autoExecute: boolean) => void;
}

export const GitTerminalToolbar: React.FC<GitTerminalToolbarProps> = ({ isDark, onAddClick, onRunCommand }) => {
    const { quickCommands, removeQuickCommand } = useStore();

    return (
        <div
            className="animate-entrance"
            style={{
                padding: '8px 16px',
                borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                background: isDark ? '#1a1a1a' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minHeight: '40px',
                animationDelay: '0.1s',
                opacity: 0
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDark ? '#555' : '#aaa' }}>
                <Zap size={14} />
            </div>

            <div style={{
                flex: 1,
                height: '40px',
                overflowX: 'auto',
                display: 'flex',
                alignItems: 'center',
                paddingBottom: '4px',
            }} className="terminal-macros-scroll">
                <style>{`
                    .terminal-macros-scroll::-webkit-scrollbar {
                        height: 4px;
                    }
                    .terminal-macros-scroll::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .terminal-macros-scroll::-webkit-scrollbar-thumb {
                        background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
                        border-radius: 4px;
                    }
                    .terminal-macros-scroll::-webkit-scrollbar-thumb:hover {
                        background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
                    }
                `}</style>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
                    {quickCommands.map((cmd) => (
                        <div
                            key={cmd.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: isDark ? '#252525' : '#f0f0f0',
                                borderRadius: '4px',
                                padding: '2px 4px 2px 8px',
                                fontSize: '0.7rem',
                                color: isDark ? '#bbb' : '#444',
                                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                whiteSpace: 'nowrap',
                                height: '24px'
                            }}
                        >
                            <span
                                onClick={() => onRunCommand(cmd.command, cmd.autoExecute)}
                                title={`${cmd.autoExecute ? 'Executar' : 'Preencher'}: ${cmd.command}`}
                                style={{ cursor: 'pointer', fontWeight: 600, marginRight: '4px' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#4fc3f7' : '#0070f3'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                            >
                                {cmd.label}
                            </span>
                            <button
                                onClick={() => removeQuickCommand(cmd.id)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isDark ? '#555' : '#ccc',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#555' : '#ccc'}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={onAddClick}
                        style={{
                            background: 'transparent',
                            border: `1px dashed ${isDark ? '#444' : '#ccc'}`,
                            borderRadius: '4px',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#444' : '#ccc',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = isDark ? '#666' : '#999';
                            e.currentTarget.style.color = isDark ? '#666' : '#999';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isDark ? '#444' : '#ccc';
                            e.currentTarget.style.color = isDark ? '#444' : '#ccc';
                        }}
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
