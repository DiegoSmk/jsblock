import { useEffect, useRef } from 'react';
import { useMonaco } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useStore } from '../../../store/useStore';
import { useShallow } from 'zustand/react/shallow';

export function useMonacoDecorations(editorInstance: Monaco.editor.IStandaloneCodeEditor | null) {
    const {
        executionResults,
        executionErrors,
        executionCoverage,
        livePreviewEnabled,
        selectedFile,
        code
    } = useStore(useShallow(state => ({
        executionResults: state.executionResults,
        executionErrors: state.executionErrors,
        executionCoverage: state.executionCoverage,
        livePreviewEnabled: state.livePreviewEnabled,
        selectedFile: state.selectedFile,
        code: state.code
    })));

    const monaco = useMonaco();
    const decorationIdsRef = useRef<string[]>([]);
    const cursorLineRef = useRef<number>(-1);

    useEffect(() => {
        if (!editorInstance || !monaco) return;

        // Track cursor position to hide decorations on current line
        const disposable = editorInstance.onDidChangeCursorPosition((e) => {
            cursorLineRef.current = e.position.lineNumber;
            // Trigger re-render of decorations (this might be expensive, so we might want to debounce or use a different strategy)
            // For now, we rely on the next render cycle or code change.
            // Actually, to make it instant, we need to force update decorations.
            // Let's just update the ref, and let the decoration logic handle it on next cycle.
            // To force refresh, we can toggle a dummy state or just call the decoration logic if we extracted it.
        });

        const model = editorInstance.getModel();
        if (!model) return;

        // Clear decorations if disabled
        if (!livePreviewEnabled) {
            decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, []);
            const styleId = 'dynamic-execution-styles';
            const styleEl = document.getElementById(styleId);
            if (styleEl) styleEl.textContent = '';
            return;
        }

        const decorations: Monaco.editor.IModelDeltaDecoration[] = [];

        // Dynamic CSS Injection Strategy
        let dynamicCss = '';

        // Helper to process text (clean emojis, escape CSS)
        const processText = (text: string) => {
            return (text.length > 50 ? text.substring(0, 47) + '...' : text)
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\A ');
        };

        interface ExecutionEntry {
            value: string;
            type: string;
        }

        const processEntries = (map: Map<number, ExecutionEntry[] | string>, type: 'result' | 'error') => {
            if (!map || map.size === 0) return;

            map.forEach((entry, lineKey) => {
                const line = Number(lineKey);
                if (isNaN(line) || line < 1 || line > model.getLineCount()) return;

                // SKIP DECORATION IF CURSOR IS ON THIS LINE (Requested feature)
                // But mainly for errors, maybe keep values? User said "log only appear when I'm not on the line".
                // Let's apply this rule generally for cleaner typing.
                if (line === cursorLineRef.current) return;

                let text = '';
                let isLog = false;

                if (type === 'result') {
                    // Entry is array of { value, type }
                    const entries = entry as ExecutionEntry[];

                    // Deduplicate values
                    const uniqueValues = new Set();
                    const uniqueEntries = entries.filter(e => {
                        if (uniqueValues.has(e.value)) return false;
                        uniqueValues.add(e.value);
                        return true;
                    });

                    text = uniqueEntries.map(e => processText(e.value)).join(' | ');
                    isLog = entries.some(e => e.type === 'log');
                } else {
                    // Entry is string (error message)
                    text = processText(typeof entry === 'string' ? entry : entry.map(e => e.value).join(' | '));
                }

                const className = `deco-${type}-${line}`;
                dynamicCss += `.${className}::after { content: "${text}"; }\n`;

                const maxCol = model.getLineMaxColumn(line);

                let baseClass = 'execution-decoration-base';
                if (type === 'error') baseClass += ' execution-decoration-error';
                else if (isLog) baseClass += ' execution-decoration-log';
                else baseClass += ' execution-decoration-val';

                decorations.push({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
                    range: new (monaco as any).Range(line, maxCol, line, maxCol),
                    options: {
                        isWholeLine: false,
                        afterContentClassName: `${baseClass} ${className}`,
                        linesDecorationsClassName: type === 'error' ? 'execution-error-gutter' : 'execution-coverage-gutter'
                    }
                });
            });
        };

        // 1. Process Results
        processEntries(executionResults as unknown as Map<number, ExecutionEntry[] | string>, 'result');

        // 2. Process Errors
        processEntries(executionErrors as unknown as Map<number, ExecutionEntry[] | string>, 'error');

        // Inject CSS
        const styleId = 'dynamic-execution-styles';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = dynamicCss;

        // Apply decorations
        decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, decorations);

        return () => {
            disposable.dispose();
        };

    }, [executionResults, executionErrors, executionCoverage, editorInstance, monaco, selectedFile, code, livePreviewEnabled]);
}
