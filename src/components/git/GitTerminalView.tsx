import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export const GitTerminalView: React.FC = () => {
    const { theme, openedFolder } = useStore();
    const isDark = theme === 'dark';
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Cleanup previous terminal if any (though dispose should handle it)
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

        // Initial fit
        setTimeout(() => fitAddon.fit(), 100);

        xtermRef.current = term;

        // Create terminal on backend
        if ((window as any).electronAPI) {
            (window as any).electronAPI.terminalCreate({ cwd: openedFolder });

            // Listen for data from backend
            const unsubscribe = (window as any).electronAPI.terminalOnData((data: string) => {
                term.write(data);
            });

            // Send input to backend
            term.onData((data) => {
                (window as any).electronAPI.terminalSendInput(data);
            });

            // Handle resize using ResizeObserver
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

    return (
        <div style={{
            flex: 1,
            height: '100%',
            background: isDark ? '#1a1a1a' : '#fff',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div ref={terminalRef} style={{ flex: 1, padding: '12px' }} />
        </div>
    );
};
