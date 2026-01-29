import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import {
    Terminal as TerminalIcon,
    ExternalLink,
    Plus,
    X,
    Zap
} from 'lucide-react';
import 'xterm/css/xterm.css';

export const GitTerminalView: React.FC = () => {
    const {
        theme,
        openedFolder,
        quickCommands,
        addQuickCommand,
        removeQuickCommand
    } = useStore();

    const isDark = theme === 'dark';
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const [showAddCommand, setShowAddCommand] = useState(false);
    const [newCmdLabel, setNewCmdLabel] = useState('');
    const [newCmdValue, setNewCmdValue] = useState('');

    useEffect(() => {
        if (!terminalRef.current) return;

        if (xtermRef.current) {
            xtermRef.current.dispose();
        }

        const term = new XTerm({
            theme: isDark ? {
                background: '#1a1a1a',
                foreground: '#e0e0e0',
                cursor: '#4fc3f7',
                selectionBackground: 'rgba(79, 195, 247, 0.3)',
                black: '#1a1a1a',
                red: '#f87171',
                green: '#4ade80',
                yellow: '#fbbf24',
                blue: '#60a5fa',
                magenta: '#c084fc',
                cyan: '#22d3ee',
                white: '#e5e7eb',
                brightBlack: '#4b5563',
                brightRed: '#ef4444',
                brightGreen: '#22c55e',
                brightYellow: '#f59e0b',
                brightBlue: '#3b82f6',
                brightMagenta: '#a855f7',
                brightCyan: '#06b6d4',
                brightWhite: '#f9fafb'
            } : {
                background: '#ffffff',
                foreground: '#333333',
                cursor: '#0070f3',
                selectionBackground: 'rgba(0, 112, 243, 0.15)',
                black: '#000000',
                red: '#dc2626',
                green: '#16a34a',
                yellow: '#d97706',
                blue: '#2563eb',
                magenta: '#9333ea',
                cyan: '#0891b2',
                white: '#4b5563',
                brightBlack: '#6b7280',
                brightRed: '#ef4444',
                brightGreen: '#22c55e',
                brightYellow: '#f59e0b',
                brightBlue: '#3b82f6',
                brightMagenta: '#a855f7',
                brightCyan: '#06b6d4',
                brightWhite: '#111827'
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 13,
            lineHeight: 1.2,
            cursorBlink: true,
            allowProposedApi: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);

        setTimeout(() => fitAddon.fit(), 100);

        xtermRef.current = term;

        if ((window as any).electronAPI) {
            (window as any).electronAPI.terminalCreate({ cwd: openedFolder });

            const unsubscribe = (window as any).electronAPI.terminalOnData((data: string) => {
                term.write(data);
            });

            term.onData((data) => {
                (window as any).electronAPI.terminalSendInput(data);
            });

            const resizeObserver = new ResizeObserver(() => {
                if (terminalRef.current) {
                    fitAddon.fit();
                    (window as any).electronAPI.terminalResize(term.cols, term.rows);
                }
            });
            resizeObserver.observe(terminalRef.current);

            return () => {
                resizeObserver.disconnect();
                unsubscribe();
                term.dispose();
                (window as any).electronAPI.terminalKill();
            };
        }
    }, [isDark, openedFolder]);

    const handleRunQuickCommand = (cmd: string) => {
        if ((window as any).electronAPI) {
            // Send command + enter
            (window as any).electronAPI.terminalSendInput(cmd + '\r');
        }
    };

    const handleAddQuickCommand = () => {
        if (!newCmdLabel.trim() || !newCmdValue.trim()) return;
        addQuickCommand({ label: newCmdLabel.trim(), command: newCmdValue.trim() });
        setNewCmdLabel('');
        setNewCmdValue('');
        setShowAddCommand(false);
    };

    const handleOpenExternal = () => {
        if ((window as any).electronAPI?.openSystemTerminal && openedFolder) {
            (window as any).electronAPI.openSystemTerminal(openedFolder);
        }
    };

    return (
        <div style={{
            flex: 1,
            height: '100%',
            background: isDark ? '#1a1a1a' : '#fff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Terminal Header */}
            <div style={{
                height: '40px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                background: isDark ? '#1f1f1f' : '#f8f9fa'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TerminalIcon size={14} color={isDark ? '#4fc3f7' : '#0070f3'} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', color: isDark ? '#ccc' : '#444' }}>
                        TERMINAL INTEGRADO
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={handleOpenExternal}
                        title="Abrir no Terminal do Sistema"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: isDark ? '#888' : '#666',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.7rem',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <ExternalLink size={14} />
                        <span>Externo</span>
                    </button>
                </div>
            </div>

            {/* Quick Commands Bar */}
            <div style={{
                padding: '8px 16px',
                borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                background: isDark ? '#1a1a1a' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minHeight: '40px'
            }}>
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
                }} className="terminal-quick-commands-scroll">
                    <style>{`
                        .terminal-quick-commands-scroll::-webkit-scrollbar {
                            height: 4px;
                        }
                        .terminal-quick-commands-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .terminal-quick-commands-scroll::-webkit-scrollbar-thumb {
                            background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
                            border-radius: 4px;
                        }
                        .terminal-quick-commands-scroll::-webkit-scrollbar-thumb:hover {
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
                                    onClick={() => handleRunQuickCommand(cmd.command)}
                                    title={`Executar: ${cmd.command}`}
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

                        {!showAddCommand ? (
                            <button
                                onClick={() => setShowAddCommand(true)}
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
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    autoFocus
                                    placeholder="Nome"
                                    value={newCmdLabel}
                                    onChange={(e) => setNewCmdLabel(e.target.value)}
                                    style={{
                                        background: isDark ? '#252525' : '#fff',
                                        border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        padding: '2px 6px',
                                        color: isDark ? '#fff' : '#000',
                                        width: '80px'
                                    }}
                                />
                                <input
                                    placeholder="Comando"
                                    value={newCmdValue}
                                    onChange={(e) => setNewCmdValue(e.target.value)}
                                    style={{
                                        background: isDark ? '#252525' : '#fff',
                                        border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        padding: '2px 6px',
                                        color: isDark ? '#fff' : '#000',
                                        width: '120px'
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuickCommand()}
                                />
                                <button
                                    onClick={handleAddQuickCommand}
                                    style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                                >
                                    <Zap size={12} />
                                </button>
                                <button
                                    onClick={() => setShowAddCommand(false)}
                                    style={{ background: 'transparent', border: 'none', color: isDark ? '#888' : '#666', cursor: 'pointer' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Terminal Viewport */}
            <div style={{
                flex: 1,
                position: 'relative',
                background: isDark ? '#1a1a1a' : '#fff',
                padding: '4px'
            }} className="terminal-viewport-container">
                <style>{`
                    .xterm-viewport::-webkit-scrollbar {
                        width: 8px;
                    }
                    .xterm-viewport::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .xterm-viewport::-webkit-scrollbar-thumb {
                        background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
                        border-radius: 4px;
                        border: 2px solid transparent;
                        background-clip: content-box;
                    }
                    .xterm-viewport::-webkit-scrollbar-thumb:hover {
                        background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
                        background-clip: content-box;
                    }
                `}</style>
                <div
                    ref={terminalRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: '8px'
                    }}
                />
            </div>
        </div>
    );
};
