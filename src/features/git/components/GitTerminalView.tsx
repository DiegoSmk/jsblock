import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store/useStore';
import {
    Terminal as TerminalIcon,
    ExternalLink,
    Zap,
    Check
} from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';
import { TerminalProgressBar } from './TerminalProgressBar';
import { QuickCommandModal } from './terminal/QuickCommandModal';
import { GitTerminalToolbar } from './terminal/GitTerminalToolbar';
import { useGitTerminal } from './terminal/useGitTerminal';
import './GitPanel.css';
import './GitStatus.css';

export const GitTerminalView: React.FC = () => {
    const {
        openedFolder,
        addQuickCommand,
        settings
    } = useStore();
    const { t } = useTranslation();

    const {
        terminalRef,
        isDark,
        terminalProgress,
        gitSuggestion,
        setGitSuggestion,
        lastCommitHash,
        setLastCommitHash,
        yesNoPrompt,
        setYesNoPrompt,
        sendCommand
    } = useGitTerminal();

    const [showAddCommand, setShowAddCommand] = useState(false);
    const [newCmdLabel, setNewCmdLabel] = useState('');
    const [newCmdValue, setNewCmdValue] = useState('');
    const [newCmdAutoExecute, setNewCmdAutoExecute] = useState(true);

    const handleApplySuggestion = (cmd: string) => {
        sendCommand(`git ${cmd}\r`);
        setGitSuggestion(null);
    };

    const handleUndoCommit = () => {
        sendCommand(`git reset --soft HEAD~1\r`);
        setLastCommitHash(null);
    };

    const handleRunQuickCommand = (cmd: string, autoExecute = true) => {
        sendCommand(cmd + (autoExecute !== false ? '\r' : ''));
    };

    const handleYesNo = (choice: 'y' | 'n') => {
        sendCommand(`${choice}\r`);
        setYesNoPrompt(false);
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
        if (window.electron?.openSystemTerminal && openedFolder) {
            void window.electron.openSystemTerminal(openedFolder);
        }
    };

    return (
        <div className="git-terminal-container animate-entrance" style={{ flex: 1, height: '100%', opacity: 0 }}>
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

            <div className="git-terminal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TerminalIcon size={14} color={isDark ? '#4fc3f7' : '#0070f3'} />
                    <span className="git-terminal-title">
                        {t('git.terminal.title')}
                    </span>
                    <div className="git-terminal-divider" />
                    <Tooltip content={t('git.terminal.macros_tooltip')} side="bottom">
                        <span className="git-terminal-subtitle">Macros</span>
                    </Tooltip>

                    <div className="git-terminal-status-icons">
                        {settings.terminalCopyOnSelect && (
                            <Tooltip content="Texto selecionado é copiado automaticamente" side="bottom">
                                <span className="git-terminal-status-item">
                                    <Check size={10} color="#4ade80" /> {t('git.terminal.auto_copy')}
                                </span>
                            </Tooltip>
                        )}
                        {settings.terminalRightClickPaste && (
                            <Tooltip content="Botão direito cola conteúdo da área de transferência" side="bottom">
                                <span className="git-terminal-status-item">
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
                        className="git-terminal-external-btn"
                    >
                        <ExternalLink size={14} />
                        <span>Sistema</span>
                    </button>
                </div>
            </div>

            <GitTerminalToolbar
                isDark={isDark}
                onAddClick={() => setShowAddCommand(true)}
                onRunCommand={handleRunQuickCommand}
            />

            <div className="terminal-viewport-container animate-entrance" style={{ animationDelay: '0.15s' }}>
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
                    <div className="git-terminal-popup right-aligned">
                        <div className="git-terminal-popup-icon suggestion">
                            <Zap size={18} />
                        </div>
                        <div>
                            <div className="git-terminal-popup-title">{t('git.terminal.suggestion.title')}</div>
                            <div className="git-terminal-popup-msg">
                                {t('git.terminal.suggestion.message')} <span className="highlight-cmd">git {gitSuggestion}</span>?
                            </div>
                        </div>
                        <div className="git-terminal-popup-actions">
                            <button onClick={() => setGitSuggestion(null)} className="git-popup-btn secondary">
                                {t('git.terminal.suggestion.ignore')}
                            </button>
                            <button onClick={() => handleApplySuggestion(gitSuggestion)} className="git-popup-btn primary">
                                {t('git.terminal.suggestion.fix')}
                            </button>
                        </div>
                    </div>
                )}

                {lastCommitHash && (
                    <div className="git-terminal-popup left-aligned">
                        <div className="git-terminal-popup-icon success">
                            <Check size={18} />
                        </div>
                        <div>
                            <div className="git-terminal-popup-title">{t('git.terminal.success.title')}</div>
                            <div className="git-terminal-popup-msg">
                                Commit <span className="highlight-hash">{lastCommitHash}</span> {t('git.terminal.success.message')}
                            </div>
                        </div>
                        <div className="git-terminal-popup-actions">
                            <button onClick={() => handleUndoCommit()} className="git-popup-btn danger">
                                {t('git.terminal.success.undo')}
                            </button>
                        </div>
                    </div>
                )}

                <div
                    ref={terminalRef}
                    className="terminal-element"
                />

                {yesNoPrompt && (
                    <div className="git-terminal-popup center-aligned">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="git-terminal-popup-icon suggestion">
                                <Zap size={18} />
                            </div>
                            <div>
                                <div className="git-terminal-popup-title">{t('git.terminal.prompt.title')}</div>
                                <div className="git-terminal-popup-msg">
                                    {t('git.terminal.prompt.message')}
                                </div>
                            </div>
                        </div>
                        <div className="git-terminal-popup-actions full-width">
                            <button onClick={() => handleYesNo('n')} className="git-popup-btn secondary flex-1">
                                {t('git.terminal.prompt.no')}
                            </button>
                            <button onClick={() => handleYesNo('y')} className="git-popup-btn primary flex-1">
                                {t('git.terminal.prompt.yes')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
