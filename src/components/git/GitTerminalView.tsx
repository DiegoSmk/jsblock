import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import {
    Terminal as TerminalIcon,
    ExternalLink,
    Zap,
    Check
} from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { TerminalProgressBar } from './TerminalProgressBar';
import { QuickCommandModal } from './terminal/QuickCommandModal';
import { GitTerminalToolbar } from './terminal/GitTerminalToolbar';
import 'xterm/css/xterm.css';

export const GitTerminalView: React.FC = () => {
    const {
        theme,
        openedFolder,
        addQuickCommand,
        settings
    } = useStore();
    const { t } = useTranslation();

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
    const [yesNoPrompt, setYesNoPrompt] = useState(false);
    const progressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const promptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

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

        const safeFit = () => {
            if (terminalRef.current && terminalRef.current.offsetWidth > 0 && terminalRef.current.offsetHeight > 0) {
                try {
                    fitAddon.fit();
                    if (window.electronAPI) {
                        window.electronAPI.terminalResize(term.cols, term.rows);
                    }
                    return true;
                } catch {
                    return false;
                }
            }
            return false;
        };

        const initialFitTimer = setTimeout(() => {
            try {
                if (terminalRef.current) {
                    terminalRef.current.innerHTML = '';
                    term.open(terminalRef.current);
                    requestAnimationFrame(() => {
                        safeFit();
                        if (term.element) term.focus();
                    });
                }
            } catch (err) {
                console.error('Failed to open terminal safely:', err);
            }
        }, 300);

        xtermRef.current = term;

        if (window.electronAPI) {
            window.electronAPI.terminalCreate({ cwd: openedFolder ?? '' });

            const unsubscribe = window.electronAPI.terminalOnData((data: string) => {
                term.write(data);

                const percentMatch = /(\d+)%/.exec(data);
                if (percentMatch) {
                    const percent = parseInt(percentMatch[1]);
                    if (percent > 0 || (percent === 0 && data.includes('progress'))) {
                        setTerminalProgress({
                            percent,
                            label: data.includes('npm') ? t('git.terminal.progress.npm') :
                                data.includes('git') ? t('git.terminal.progress.git') :
                                    t('git.terminal.progress.default'),
                            visible: true
                        });

                        if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);

                        if (percent >= 100) {
                            progressTimeoutRef.current = setTimeout(() => {
                                setTerminalProgress(p => ({ ...p, visible: false }));
                            }, 3000);
                        } else {
                            progressTimeoutRef.current = setTimeout(() => {
                                setTerminalProgress(p => ({ ...p, visible: false }));
                            }, 10000);
                        }
                    }
                }

                if (data.includes('not a git command') || data.includes('The most similar command')) {
                    const suggestionMatch = (/The most similar command(?:s)? is\s+([a-z-]+)/.exec(data)) ??
                        (/Did you mean this\?\s+([a-z-]+)/.exec(data));
                    if (suggestionMatch?.[1]) {
                        setGitSuggestion(suggestionMatch[1]);
                        if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
                        suggestionTimeoutRef.current = setTimeout(() => setGitSuggestion(null), 15000);
                    }
                }

                if (data.includes('] ') && (data.includes('create mode') || data.includes('files changed'))) {
                    const commitMatch = /\[[a-zA-Z0-9\-_./]+\s+([a-f0-9]+)\]/.exec(data);
                    if (commitMatch?.[1]) {
                        setLastCommitHash(commitMatch[1]);
                        if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
                        commitTimeoutRef.current = setTimeout(() => setLastCommitHash(null), 20000);
                    }
                }

                if (/(?:\(y\/n\)|\(Y\/n\)|\(y\/N\)|\? \[y\/N\]|\[S\/n\]|\[s\/N\]|Are you sure.*y\/n|want to continue\?|quer continuar\?)/i.exec(data)) {
                    setYesNoPrompt(true);
                    if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current);
                    promptTimeoutRef.current = setTimeout(() => setYesNoPrompt(false), 30000);
                }
            });

            term.onSelectionChange(() => {
                if (settings.terminalCopyOnSelect && term.hasSelection()) {
                    const selection = term.getSelection();
                    if (selection) {
                        void navigator.clipboard.writeText(selection);
                    }
                }
            });

            term.onData((data) => {
                window.electronAPI.terminalSendInput(data);
            });

            const handleContextMenu = (e: MouseEvent) => {
                if (!settings.terminalRightClickPaste) return;
                e.preventDefault();
                void navigator.clipboard.readText().then(text => {
                    window.electronAPI.terminalSendInput(text);
                });
            };

            const terminalElement = terminalRef.current;
            terminalElement?.addEventListener('contextmenu', handleContextMenu);

            const resizeObserver = new ResizeObserver(() => {
                requestAnimationFrame(() => safeFit());
            });
            resizeObserver.observe(terminalRef.current);

            return () => {
                clearTimeout(initialFitTimer);
                terminalElement?.removeEventListener('contextmenu', handleContextMenu);
                resizeObserver.disconnect();
                if (xtermRef.current === term) {
                    xtermRef.current = null;
                }
                unsubscribe();
                term.dispose();
                window.electronAPI.terminalKill();
            };
        }
    }, [isDark, openedFolder, settings.terminalCopyOnSelect, settings.terminalRightClickPaste, t]);

    const handleApplySuggestion = (cmd: string) => {
        if (window.electronAPI) {
            window.electronAPI.terminalSendInput(`git ${cmd}\r`);
            setGitSuggestion(null);
        }
    };

    const handleUndoCommit = () => {
        if (window.electronAPI) {
            window.electronAPI.terminalSendInput(`git reset --soft HEAD~1\r`);
            setLastCommitHash(null);
        }
    };

    const handleRunQuickCommand = (cmd: string, autoExecute = true) => {
        if (window.electronAPI) {
            window.electronAPI.terminalSendInput(cmd + (autoExecute !== false ? '\r' : ''));
        }
    };

    const handleYesNo = (choice: 'y' | 'n') => {
        if (window.electronAPI) {
            window.electronAPI.terminalSendInput(`${choice}\r`);
            setYesNoPrompt(false);
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
        if (window.electronAPI?.openSystemTerminal && openedFolder) {
            void window.electronAPI.openSystemTerminal(openedFolder);
        }
    };

    return (
        <div
            className="animate-entrance"
            style={{
                flex: 1,
                height: '100%',
                background: isDark ? '#1a1a1a' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                opacity: 0
            }}
        >
            <QuickCommandModal
                isOpen={showAddCommand}
                onClose={() => setShowAddCommand(false)}
                isDark={isDark}
                newCmdLabel={newCmdLabel}
                setNewCmdLabel={setNewCmdLabel}
                newCmdValue={newCmdValue}
                setNewCmdValue={setNewCmdValue}
                newCmdAutoExecute={newCmdAutoExecute}
                setNewCmdAutoExecute={setNewCmdAutoExecute}
                onAdd={handleAddQuickCommand}
            />

            <div
                className="animate-entrance"
                style={{
                    height: '40px',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                    background: isDark ? '#1f1f1f' : '#f8f9fa',
                    animationDelay: '0.05s',
                    opacity: 0
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TerminalIcon size={14} color={isDark ? '#4fc3f7' : '#0070f3'} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', color: isDark ? '#ccc' : '#444' }}>
                        {t('git.terminal.title')}
                    </span>
                    <div style={{ height: '12px', width: '1px', background: isDark ? '#333' : '#ddd', margin: '0 4px' }} />
                    <Tooltip content={t('git.terminal.macros_tooltip')} side="bottom">
                        <span style={{ fontSize: '0.65rem', color: isDark ? '#666' : '#999', fontWeight: 600, cursor: 'help' }}>Macros</span>
                    </Tooltip>

                    <div style={{ fontSize: '0.65rem', color: isDark ? '#555' : '#aaa', display: 'flex', gap: '12px', marginLeft: '12px', fontWeight: 500 }}>
                        {settings.terminalCopyOnSelect && (
                            <Tooltip content="Texto selecionado é copiado automaticamente" side="bottom">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                                    <Check size={10} color="#4ade80" /> {t('git.terminal.auto_copy')}
                                </span>
                            </Tooltip>
                        )}
                        {settings.terminalRightClickPaste && (
                            <Tooltip content="Botão direito cola conteúdo da área de transferência" side="bottom">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                                    <Check size={10} color="#4ade80" /> {t('git.terminal.click_paste')}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={handleOpenExternal}
                        title={t('git.terminal.external_tooltip')}
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
                        <span>{t('git.terminal.external')}</span>
                    </button>
                </div>
            </div>

            <GitTerminalToolbar
                isDark={isDark}
                onAddClick={() => setShowAddCommand(true)}
                onRunCommand={handleRunQuickCommand}
            />

            <div
                className="terminal-viewport-container animate-entrance"
                style={{
                    flex: 1,
                    position: 'relative',
                    background: isDark ? '#1a1a1a' : '#fff',
                    padding: '4px',
                    animationDelay: '0.15s',
                    opacity: 0
                }}
            >
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

                {/* Suggestions and Prompts could also be extracted but keeping them here for now as they are tightly coupled with terminal events */}
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
                            <div style={{ fontSize: '0.65rem', color: isDark ? '#777' : '#999', fontWeight: 600, marginBottom: '2px' }}>{t('git.terminal.suggestion.title')}</div>
                            <div style={{ fontSize: '0.85rem', color: isDark ? '#eee' : '#333' }}>
                                {t('git.terminal.suggestion.message')} <span style={{ fontWeight: 800, color: isDark ? '#4fc3f7' : '#0070f3' }}>git {gitSuggestion}</span>?
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
                                {t('git.terminal.suggestion.ignore')}
                            </button>
                            <button
                                onClick={() => handleApplySuggestion(gitSuggestion)}
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
                                {t('git.terminal.suggestion.fix')}
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
                            <div style={{ fontSize: '0.65rem', color: isDark ? '#777' : '#999', fontWeight: 600, marginBottom: '2px' }}>{t('git.terminal.success.title')}</div>
                            <div style={{ fontSize: '0.85rem', color: isDark ? '#eee' : '#333' }}>
                                Commit <span style={{ fontWeight: 800, color: isDark ? '#4ade80' : '#16a34a', fontFamily: 'monospace' }}>{lastCommitHash}</span> {t('git.terminal.success.message')}
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
                                {t('git.terminal.success.undo')}
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
                {yesNoPrompt && (
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 102,
                        background: isDark ? '#1f1f1f' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)'}`,
                        borderRadius: '12px',
                        padding: '16px 20px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}>
                        <style>{`
                            @keyframes slideUp {
                                from { transform: translate(-50%, 30px); opacity: 0; }
                                to { transform: translate(-50%, 0); opacity: 1; }
                            }
                        `}</style>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#fff' : '#111', marginBottom: '2px' }}>
                                    {t('git.terminal.prompt.title')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: isDark ? '#888' : '#666' }}>
                                    {t('git.terminal.prompt.message')}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                            <button
                                onClick={() => handleYesNo('n')}
                                style={{
                                    background: 'transparent',
                                    border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                    color: isDark ? '#aaa' : '#666',
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    flex: 1
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';
                                    e.currentTarget.style.borderColor = isDark ? '#444' : '#ccc';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = isDark ? '#333' : '#ddd';
                                }}
                            >
                                {t('git.terminal.prompt.no')}
                            </button>
                            <button
                                onClick={() => handleYesNo('y')}
                                style={{
                                    background: (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                                    color: (isDark ? '#4fc3f7' : '#0070f3'),
                                    border: `1px solid ${isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)'}`,
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    flex: 1
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = (isDark ? 'rgba(79, 195, 247, 0.25)' : 'rgba(0, 112, 243, 0.15)');
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)');
                                }}
                            >
                                {t('git.terminal.prompt.yes')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
