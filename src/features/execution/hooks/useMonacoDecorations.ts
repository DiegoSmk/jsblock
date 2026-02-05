import { useEffect, useRef, useState } from 'react';
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
    const [cursorLine, setCursorLine] = useState<number>(-1);

    useEffect(() => {
        if (!editorInstance || !monaco) return;

        // CRITICAL: We use State for cursorLine to trigger re-renders 
        // and ensure the "hide on current line" rule is enforced instantly.
        const disposable = editorInstance.onDidChangeCursorPosition((e) => {
            setCursorLine(e.position.lineNumber);
        });

        const model = editorInstance.getModel();
        if (!model) return;

        if (!livePreviewEnabled) {
            decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, []);
            const styleId = 'dynamic-execution-styles';
            const styleEl = document.getElementById(styleId);
            if (styleEl) styleEl.textContent = '';
            return;
        }

        const decorations: Monaco.editor.IModelDeltaDecoration[] = [];
        let dynamicCss = '';

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

                // THE ISOLATION RULE: This is now reactive thanks to setCursorLine
                if (line === cursorLine) return;

                let text = '';
                let isLog = false;

                if (type === 'result') {
                    const entries = entry as ExecutionEntry[];
                    const uniqueValues = new Set();
                    const uniqueEntries = entries.filter(e => {
                        if (uniqueValues.has(e.value)) return false;
                        uniqueValues.add(e.value);
                        return true;
                    });
                    text = uniqueEntries.map(e => processText(e.value)).join(' | ');
                    isLog = entries.some(e => e.type === 'log');
                } else {
                    // Correctly handle string or array error entries
                    const errorText = typeof entry === 'string' ? entry : (entry as unknown as ExecutionEntry[]).map(e => e.value).join(' | ');
                    text = processText(errorText);
                }

                const className = `deco-${type}-${line}`;
                dynamicCss += `.${className}::after { content: "${text}"; }\n`;

                const maxCol = model.getLineMaxColumn(line);
                let baseClass = 'execution-decoration-base';
                if (type === 'error') baseClass += ' execution-decoration-error';
                else if (isLog) baseClass += ' execution-decoration-log';
                else baseClass += ' execution-decoration-val';

                decorations.push({
                    range: new monaco.Range(line, maxCol, line, maxCol),
                    options: {
                        isWholeLine: false,
                        afterContentClassName: `${baseClass} ${className}`,
                        linesDecorationsClassName: type === 'error' ? 'execution-error-gutter' : 'execution-coverage-gutter'
                    }
                });
            });
        };

        processEntries(executionResults as unknown as Map<number, ExecutionEntry[] | string>, 'result');
        processEntries(executionErrors as unknown as Map<number, ExecutionEntry[] | string>, 'error');

        const styleId = 'dynamic-execution-styles';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = dynamicCss;

        decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, decorations);

        return () => {
            disposable.dispose();
        };

    }, [executionResults, executionErrors, executionCoverage, editorInstance, monaco, selectedFile, code, livePreviewEnabled, cursorLine]);
}
