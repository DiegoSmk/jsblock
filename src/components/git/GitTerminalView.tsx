import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import {
    Terminal as TerminalIcon,
    ExternalLink,
    Plus,
    X,
    Zap,
    Check
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Radio } from '../ui/Radio';
import { Tooltip } from '../Tooltip';
import { TerminalProgressBar } from './TerminalProgressBar';
import 'xterm/css/xterm.css';

export const GitTerminalView: React.FC = () => {
    const {
        theme,
        openedFolder,
        quickCommands,
        addQuickCommand,
        removeQuickCommand,
        settings
    } = useStore();

    const isDark = theme === 'dark';
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const [showAddCommand, setShowAddCommand] = useState(false);
    const [newCmdLabel, setNewCmdLabel] = useState('');
    const [newCmdValue, setNewCmdValue] = useState('');
    const [newCmdAutoExecute, setNewCmdAutoExecute] = useState(true);
    const [terminalProgress, setTerminalProgress] = useState<{ percent: number; label: string; visible: boolean }>({
        percent: 0,
        label: '',
        visible: false
    });
    const [gitSuggestion, setGitSuggestion] = useState<string | null>(null);
    const [lastCommitHash, setLastCommitHash] = useState<string | null>(null);
    const progressTimeoutRef = useRef<any>(null);
    const suggestionTimeoutRef = useRef<any>(null);
    const commitTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Cleanup previous instance
        if (xtermRef.current) {
            xtermRef.current.dispose();
            xtermRef.current = null;
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

        const safeFit = () => {
            if (terminalRef.current && terminalRef.current.offsetWidth > 0 && (term as any)._core?.viewport) {
                try {
                    fitAddon.fit();
                    if ((window as any).electronAPI) {
                        (window as any).electronAPI.terminalResize(term.cols, term.rows);
                    }
                } catch (e) {
                    console.warn('Fit failed:', e);
                }
            }
        };

        // Initial fit and focus
        setTimeout(() => {
            safeFit();
            term.focus();
        }, 150);

        xtermRef.current = term;

        if ((window as any).electronAPI) {
            (window as any).electronAPI.terminalCreate({ cwd: openedFolder });

            const unsubscribe = (window as any).electronAPI.terminalOnData((data: string) => {
                term.write(data);

                // Progress Tracking Logic
                // 1. Search for percentage patterns (e.g. 45%, 10/100, etc)
                const percentMatch = data.match(/(\d+)%/);
                if (percentMatch) {
                    const percent = parseInt(percentMatch[1]);

                    // Filter out small common numbers that aren't real progress
                    if (percent > 0 || (percent === 0 && data.includes('progress'))) {
                        setTerminalProgress({
                            percent,
                            label: data.includes('npm') ? 'NPM Install/Build...' :
                                data.includes('git') ? 'Git Operation...' :
                                    'Processando Tarefa...',
                            visible: true
                        });

                        // reset timeout to hide
                        if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);

                        if (percent >= 100) {
                            progressTimeoutRef.current = setTimeout(() => {
                                setTerminalProgress(p => ({ ...p, visible: false }));
                            }, 3000);
                        } else {
                            // If no progress for 10 seconds, hide it (stale)
                            progressTimeoutRef.current = setTimeout(() => {
                                setTerminalProgress(p => ({ ...p, visible: false }));
                            }, 10000);
                        }
                    }
                }

                // Git Correction Logic
                // Detects patterns like: 'git: 'chekout' is not a git command. Did you mean checkout?'
                if (data.includes('not a git command') || data.includes('The most similar command')) {
                    const suggestionMatch = data.match(/The most similar command(?:s)? is\s+([a-z-]+)/) ||
                        data.match(/Did you mean this\?\s+([a-z-]+)/);
                    if (suggestionMatch && suggestionMatch[1]) {
                        setGitSuggestion(suggestionMatch[1]);
                        if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
                        suggestionTimeoutRef.current = setTimeout(() => setGitSuggestion(null), 15000);
                    }
                }

                // Clear suggestion when a new line starts (user is typing something else)
                if (data.includes('\r') || data.includes('\n')) {
                    // We keep it for a bit after the error, but if a long time passes it clears via timeout
                }

                // Undo Commit Logic
                // Detects: [main 3a4f2b1] commit message
                if (data.includes('] ') && (data.includes('create mode') || data.includes('files changed'))) {
                    const commitMatch = data.match(/\[[a-zA-Z0-9\-_./]+\s+([a-f0-9]+)\]/);
                    if (commitMatch && commitMatch[1]) {
                        setLastCommitHash(commitMatch[1]);
                        if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
                        commitTimeoutRef.current = setTimeout(() => setLastCommitHash(null), 20000);
                    }
                }
            });

            term.onSelectionChange(() => {
                if (settings.terminalCopyOnSelect && term.hasSelection()) {
                    const selection = term.getSelection();
                    if (selection) {
                        navigator.clipboard.writeText(selection);
                    }
                }
            });

            term.onData((data) => {
                (window as any).electronAPI.terminalSendInput(data);
            });

            const handleContextMenu = (e: MouseEvent) => {
                if (!settings.terminalRightClickPaste) return;
                e.preventDefault();
                navigator.clipboard.readText().then(text => {
                    (window as any).electronAPI.terminalSendInput(text);
                });
            };

            const terminalElement = terminalRef.current;
            terminalElement?.addEventListener('contextmenu', handleContextMenu);

            const resizeObserver = new ResizeObserver(() => {
                requestAnimationFrame(() => safeFit());
            });
            resizeObserver.observe(terminalRef.current);

            return () => {
                terminalElement?.removeEventListener('contextmenu', handleContextMenu);
                resizeObserver.disconnect();
                if (xtermRef.current === term) {
                    xtermRef.current = null;
                }
                unsubscribe();
                term.dispose();
                (window as any).electronAPI.terminalKill();
            };
        }
    }, [isDark, openedFolder, settings.terminalCopyOnSelect, settings.terminalRightClickPaste]);

    const handleApplySuggestion = (cmd: string) => {
        if ((window as any).electronAPI) {
            // Write git [suggestion] and enter
            (window as any).electronAPI.terminalSendInput(`git ${cmd}\r`);
            setGitSuggestion(null);
        }
    };

    const handleUndoCommit = () => {
        if ((window as any).electronAPI) {
            // git reset --soft HEAD~1
            (window as any).electronAPI.terminalSendInput(`git reset --soft HEAD~1\r`);
            setLastCommitHash(null);
        }
    };

    const handleRunQuickCommand = (cmd: string, autoExecute: boolean = true) => {
        if ((window as any).electronAPI) {
            // Send command + enter if autoExecute (default), otherwise just send command
            (window as any).electronAPI.terminalSendInput(cmd + (autoExecute !== false ? '\r' : ''));
        }
    };

    const handleAddQuickCommand = () => {
        if (!newCmdLabel.trim() || !newCmdValue.trim()) return;
        addQuickCommand({
            label: newCmdLabel.trim(),
            command: newCmdValue.trim(),
            autoExecute: newCmdAutoExecute
        });
        setNewCmdLabel('');
        setNewCmdValue('');
        setNewCmdAutoExecute(true);
        setShowAddCommand(false);
    };

    const handleOpenExternal = () => {
        if ((window as any).electronAPI?.openSystemTerminal && openedFolder) {
            (window as any).electronAPI.openSystemTerminal(openedFolder);
        }
    };

    const addCommandModalFooter = (
        <>
            <button
                onClick={() => setShowAddCommand(false)}
                style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: isDark ? '#888' : '#666',
                    border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600
                }}
            >
                Cancelar
            </button>
            <button
                onClick={handleAddQuickCommand}
                disabled={!newCmdLabel.trim() || !newCmdValue.trim()}
                style={{
                    padding: '8px 20px',
                    background: (!newCmdLabel.trim() || !newCmdValue.trim()) ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                    color: (!newCmdLabel.trim() || !newCmdValue.trim()) ? (isDark ? '#444' : '#999') : (isDark ? '#4fc3f7' : '#0070f3'),
                    border: `1px solid ${(!newCmdLabel.trim() || !newCmdValue.trim()) ? (isDark ? '#333' : '#eee') : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                }}
            >
                Criar Atalho
            </button>
        </>
    );

    return (
        <div style={{
            flex: 1,
            height: '100%',
            background: isDark ? '#1a1a1a' : '#fff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Quick Command Modal */}
            <Modal
                isOpen={showAddCommand}
                onClose={() => setShowAddCommand(false)}
                title="Configurar Atalho de Execução"
                isDark={isDark}
                headerIcon={<Zap size={16} color={isDark ? '#4fc3f7' : '#0070f3'} />}
                footer={addCommandModalFooter}
                maxWidth="400px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Nome do Atalho</label>
                        <input
                            autoFocus
                            placeholder="Ex: Start Dev"
                            value={newCmdLabel}
                            onChange={(e) => setNewCmdLabel(e.target.value)}
                            style={{
                                width: '100%',
                                background: isDark ? '#252525' : '#fff',
                                border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                padding: '10px 12px',
                                color: isDark ? '#fff' : '#000',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Instrução SQL/Bash</label>
                        <input
                            placeholder="Ex: npm run dev"
                            value={newCmdValue}
                            onChange={(e) => setNewCmdValue(e.target.value)}
                            style={{
                                width: '100%',
                                background: isDark ? '#252525' : '#fff',
                                border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                padding: '10px 12px',
                                color: isDark ? '#fff' : '#000',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddQuickCommand()}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Modo de Interação</label>

                        <div
                            onClick={() => setNewCmdAutoExecute(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '10px',
                                background: newCmdAutoExecute ? (isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(0, 112, 243, 0.04)') : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                                border: `1px solid ${newCmdAutoExecute ? (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)') : (isDark ? '#333' : '#eee')}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Radio
                                checked={newCmdAutoExecute}
                                onChange={() => setNewCmdAutoExecute(true)}
                                activeColor={isDark ? '#4fc3f7' : '#0070f3'}
                                isDark={isDark}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#fff' : '#333', marginBottom: '2px' }}>Execução Automática</div>
                                <div style={{ fontSize: '0.7rem', color: isDark ? '#888' : '#666', lineHeight: '1.4' }}>O comando é enviado e processado imediatamente ao clicar no atalho.</div>
                            </div>
                        </div>

                        <div
                            onClick={() => setNewCmdAutoExecute(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '10px',
                                background: !newCmdAutoExecute ? (isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(0, 112, 243, 0.04)') : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                                border: `1px solid ${!newCmdAutoExecute ? (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)') : (isDark ? '#333' : '#eee')}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Radio
                                checked={!newCmdAutoExecute}
                                onChange={() => setNewCmdAutoExecute(false)}
                                activeColor={isDark ? '#4fc3f7' : '#0070f3'}
                                isDark={isDark}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#fff' : '#333', marginBottom: '2px' }}>Apenas Preencher</div>
                                <div style={{ fontSize: '0.7rem', color: isDark ? '#888' : '#666', lineHeight: '1.4' }}>Insere o código no prompt, permitindo revisão antes da execução manual.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

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
                    <div style={{ height: '12px', width: '1px', background: isDark ? '#333' : '#ddd', margin: '0 4px' }} />
                    <Tooltip content="Atalhos personalizados para execução rápida de comandos" side="bottom">
                        <span style={{ fontSize: '0.65rem', color: isDark ? '#666' : '#999', fontWeight: 600, textTransform: 'uppercase', cursor: 'help' }}>Macros</span>
                    </Tooltip>

                    <div style={{
                        fontSize: '0.65rem',
                        color: isDark ? '#555' : '#aaa',
                        display: 'flex',
                        gap: '12px',
                        marginLeft: '12px',
                        fontWeight: 500
                    }}>
                        {settings.terminalCopyOnSelect && (
                            <Tooltip content="Texto selecionado é copiado automaticamente" side="bottom">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                                    <Check size={10} color="#4ade80" /> Auto-Copy
                                </span>
                            </Tooltip>
                        )}
                        {settings.terminalRightClickPaste && (
                            <Tooltip content="Botão direito cola conteúdo da área de transferência" side="bottom">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                                    <Check size={10} color="#4ade80" /> Click-Paste
                                </span>
                            </Tooltip>
                        )}
                    </div>
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

            {/* Macros Bar */}
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
                                    onClick={() => handleRunQuickCommand(cmd.command, cmd.autoExecute)}
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

                {terminalProgress.visible && (
                    <TerminalProgressBar
                        progress={terminalProgress.percent}
                        label={terminalProgress.label}
                        isDark={isDark}
                    />
                )}

                {gitSuggestion && (
                    <div style={{
                        position: 'absolute',
                        bottom: terminalProgress.visible ? '80px' : '20px',
                        right: '20px',
                        zIndex: 101,
                        background: isDark ? 'rgba(30, 30, 30, 0.95)' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.4)' : 'rgba(0, 112, 243, 0.3)'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <style>{`
                            @keyframes slideInRight {
                                from { transform: translateX(30px); opacity: 0; }
                                to { transform: translateX(0); opacity: 1; }
                            }
                        `}</style>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#4fc3f7' : '#0070f3'
                        }}>
                            <Zap size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: isDark ? '#777' : '#999', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Sugestão do Git</div>
                            <div style={{ fontSize: '0.85rem', color: isDark ? '#eee' : '#333' }}>
                                Quis dizer <span style={{ fontWeight: 800, color: isDark ? '#4fc3f7' : '#0070f3' }}>git {gitSuggestion}</span>?
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                            <button
                                onClick={() => setGitSuggestion(null)}
                                style={{
                                    background: 'transparent',
                                    border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                    color: isDark ? '#888' : '#666',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Ignorar
                            </button>
                            <button
                                onClick={() => handleApplySuggestion(gitSuggestion!)}
                                style={{
                                    background: isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)',
                                    border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)'}`,
                                    color: isDark ? '#4fc3f7' : '#0070f3',
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(79, 195, 247, 0.25)' : 'rgba(0, 112, 243, 0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'}
                            >
                                Corrigir Agora
                            </button>
                        </div>
                    </div>
                )}

                {lastCommitHash && (
                    <div style={{
                        position: 'absolute',
                        bottom: (terminalProgress.visible || gitSuggestion) ? '80px' : '20px',
                        left: '20px',
                        zIndex: 101,
                        background: isDark ? 'rgba(30,30,30,0.95)' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(74, 222, 128, 0.4)' : 'rgba(22, 163, 74, 0.3)'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'slideInLeft 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <style>{`
                            @keyframes slideInLeft {
                                from { transform: translateX(-30px); opacity: 0; }
                                to { transform: translateX(0); opacity: 1; }
                            }
                        `}</style>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(22, 163, 74, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#4ade80' : '#16a34a'
                        }}>
                            <Check size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: isDark ? '#777' : '#999', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Git Commit</div>
                            <div style={{ fontSize: '0.85rem', color: isDark ? '#eee' : '#333' }}>
                                Commit <span style={{ fontWeight: 800, color: isDark ? '#4ade80' : '#16a34a', fontFamily: 'monospace' }}>{lastCommitHash}</span> realizado!
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                            <button
                                onClick={() => handleUndoCommit()}
                                style={{
                                    background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                                    border: `1px solid ${isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(220, 38, 38, 0.2)'}`,
                                    color: isDark ? '#f87171' : '#dc2626',
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(248, 113, 113, 0.25)' : 'rgba(220, 38, 38, 0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 38, 38, 0.1)'}
                            >
                                Desfazer (Undo)
                            </button>
                        </div>
                    </div>
                )}

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
