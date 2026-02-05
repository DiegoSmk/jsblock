import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../../store/useStore';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { parseProgress, parseSuggestion, parseCommitHash, parseYesNoPrompt } from './gitTerminalUtils';
import 'xterm/css/xterm.css';

export interface TerminalProgressState {
    percent: number;
    label: string;
    visible: boolean;
}

export function useGitTerminal() {
    const { t } = useTranslation();
    const { theme, openedFolder, settings } = useStore();
    const isDark = theme === 'dark';

    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);

    const [terminalProgress, setTerminalProgress] = useState<TerminalProgressState>({
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
                    if (window.electron) {
                        try {
                            window.electron.terminalResize(term.cols, term.rows);
                        } catch (err) {
                            console.warn('Failed to resize terminal:', err);
                        }
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

        if (window.electron) {
            window.electron.terminalCreate({ cwd: openedFolder ?? '' });

            const unsubscribe = window.electron.terminalOnData((data: string) => {
                term.write(data);

                // Progress
                const progress = parseProgress(data, t);
                if (progress) {
                    setTerminalProgress({ ...progress, visible: true });
                    if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);

                    const duration = progress.percent >= 100 ? 3000 : 10000;
                    progressTimeoutRef.current = setTimeout(() => {
                        setTerminalProgress(p => ({ ...p, visible: false }));
                    }, duration);
                }

                // Suggestions
                const suggestion = parseSuggestion(data);
                if (suggestion) {
                    setGitSuggestion(suggestion);
                    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
                    suggestionTimeoutRef.current = setTimeout(() => setGitSuggestion(null), 15000);
                }

                // Commit Hash
                const hash = parseCommitHash(data);
                if (hash) {
                    setLastCommitHash(hash);
                    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
                    commitTimeoutRef.current = setTimeout(() => setLastCommitHash(null), 20000);
                }

                // Yes/No Prompt
                if (parseYesNoPrompt(data)) {
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
                window.electron.terminalSendInput(data);
            });

            const handleContextMenu = (e: MouseEvent) => {
                if (!settings.terminalRightClickPaste) return;
                e.preventDefault();
                void navigator.clipboard.readText().then(text => {
                    window.electron.terminalSendInput(text);
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
                window.electron.terminalKill();
            };
        }
    }, [isDark, openedFolder, settings.terminalCopyOnSelect, settings.terminalRightClickPaste, t]);

    const sendCommand = (cmd: string) => {
        if (window.electron) {
            window.electron.terminalSendInput(cmd);
        }
    };

    return {
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
    };
}
