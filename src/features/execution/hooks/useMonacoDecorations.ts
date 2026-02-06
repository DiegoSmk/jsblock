import { useEffect, useState, useRef, useCallback } from 'react';
import { useMonaco } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useStore } from '../../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import type { ExecutionError } from '../types';

export function useMonacoDecorations(editorInstance: Monaco.editor.IStandaloneCodeEditor | null) {
    const {
        executionResults,
        executionErrors,
        livePreviewEnabled,
        selectedFile,
        code,
        addToast
    } = useStore(useShallow(state => ({
        executionResults: state.executionResults,
        executionErrors: state.executionErrors,
        livePreviewEnabled: state.livePreviewEnabled,
        selectedFile: state.selectedFile,
        code: state.code,
        addToast: state.addToast
    })));

    const monaco = useMonaco();
    const [cursorLine, setCursorLine] = useState<number>(-1);
    const decorationIdsRef = useRef<string[]>([]);

    // 1. Quick Fix Logic (Shortcut & Click)
    const applyFix = useCallback((line: number, error: ExecutionError) => {
        if (!editorInstance || !monaco || !error.suggestion) return;
        const model = editorInstance.getModel();
        if (!model) return;

        editorInstance.executeEdits('execution-fix', [
            {
                range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
                text: error.suggestion.replace
            }
        ]);
        editorInstance.focus();
    }, [editorInstance, monaco]);

    useEffect(() => {
        if (!monaco || !editorInstance) return;

        // Command for CTRL+ENTER Fix
        editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            const selection = editorInstance.getSelection();
            if (!selection) return;
            const line = selection.startLineNumber;
            const error = executionErrors.get(line);
            if (error?.suggestion) {
                applyFix(line, error);
            }
        });

        // Click Handler for decorations
        const mouseDownListener = editorInstance.onMouseDown((e) => {
            const isSuggestion = e.target.element?.className.includes('execution-decoration-suggestion');
            const isTimeoutTip = e.target.element?.className.includes('execution-decoration-timeout-tip');

            if (isSuggestion || isTimeoutTip) {
                const line = e.target.range?.startLineNumber;
                if (line) {
                    const error = executionErrors.get(line);
                    if (error?.suggestion) {
                        applyFix(line, error);
                    } else if (isTimeoutTip && error) {
                        // Fallback for click-to-copy if suggestion is somehow missing
                        const match = error.message.match(/\/\/\s*@timeout\s+\d+/);
                        if (match) {
                            navigator.clipboard.writeText(match[0]);
                            addToast({ type: 'success', message: 'Comando copiado para o clipboard!' });
                        }
                    }
                }
            }
        });

        // Also keep standard CodeActionProvider as fallback
        const provider = monaco.languages.registerCodeActionProvider(['javascript', 'typescript'], {
            provideCodeActions: (model, range) => {
                const line = range.startLineNumber;
                const error = executionErrors.get(line);
                if (error?.suggestion) {
                    return {
                        actions: [{
                            title: error.suggestion.text,
                            kind: 'quickfix',
                            diagnostics: [],
                            edit: {
                                edits: [{
                                    resource: model.uri,
                                    textEdit: {
                                        range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
                                        text: error.suggestion.replace
                                    },
                                    versionId: model.getVersionId()
                                }]
                            },
                            isPreferred: true
                        }],
                        dispose: () => { /* no-op */ }
                    };
                }
                return { actions: [], dispose: () => { /* no-op */ } };
            }
        });

        return () => {
            mouseDownListener.dispose();
            provider.dispose();
        };
    }, [monaco, editorInstance, executionErrors, applyFix, addToast]);

    // 2. Decorations and Cursor Isolation
    useEffect(() => {
        if (!editorInstance || !monaco) return;

        const disposable = editorInstance.onDidChangeCursorPosition((e) => {
            setCursorLine(e.position.lineNumber);
        });

        const model = editorInstance.getModel();
        if (!model) return;

        if (!livePreviewEnabled) {
            decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, []);
            return;
        }

        const decorations: Monaco.editor.IModelDeltaDecoration[] = [];
        let dynamicCss = '';

        const processText = (text: string) => {
            return (text.length > 200 ? text.substring(0, 197) + '...' : text)
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\A ');
        };

        interface ExecutionEntry {
            value: string;
            type: string;
        }

        const processEntries = (map: Map<number, ExecutionEntry[] | ExecutionError>, type: 'result' | 'error') => {
            if (!map || map.size === 0) return;

            map.forEach((entry, lineKey) => {
                const line = Number(lineKey);
                if (isNaN(line) || line < 1 || line > model.getLineCount()) return;

                const isError = type === 'error';
                const err = isError ? entry as ExecutionError : null;
                const isTimeout = isError && err?.errorCode === 'EXEC_TIMEOUT';
                const hasSuggestion = isError && !!err?.suggestion;

                if (!hasSuggestion && line === cursorLine) return;

                const maxCol = model.getLineMaxColumn(line);

                if (isTimeout && err) {
                    // Split timeout into two: Error (Red) | Tip (Yellow)
                    const parts = err.message.split('. Tip: ');
                    const errorText = processText(parts[0]);
                    const tipText = parts[1] ? processText('Tip: ' + parts[1]) : '';

                    const errorClassName = `deco-timeout-err-${line}`;
                    const tipClassName = `deco-timeout-tip-${line}`;

                    dynamicCss += `.${errorClassName}::after { content: "${errorText}"; }\n`;
                    if (tipText) {
                        dynamicCss += `.${tipClassName}::after { content: "${tipText}"; }\n`;
                    }

                    // Error Part (Red)
                    decorations.push({
                        range: new monaco.Range(line, maxCol, line, maxCol),
                        options: {
                            isWholeLine: false,
                            afterContentClassName: `execution-decoration-base execution-decoration-error ${errorClassName}`,
                            linesDecorationsClassName: 'execution-error-gutter'
                        }
                    });

                    // Tip Part (Yellow)
                    if (tipText) {
                        decorations.push({
                            range: new monaco.Range(line, maxCol, line, maxCol),
                            options: {
                                isWholeLine: false,
                                afterContentClassName: `execution-decoration-base execution-decoration-timeout-tip ${tipClassName}`,
                            }
                        });
                    }
                    return;
                }

                // Standard Decoration Logic
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
                } else if (err) {
                    text = processText(err.message);
                    if (err.suggestion) {
                        text = `SUGGESTION: ${err.suggestion.text} (CTRL + ENTER to apply) | ${text}`;
                    }
                }

                const className = `deco-${type}-${line}`;
                dynamicCss += `.${className}::after { content: "${text}"; }\n`;

                let baseClass = 'execution-decoration-base';
                if (isError) baseClass += ' execution-decoration-error';
                else if (isLog) baseClass += ' execution-decoration-log';
                else baseClass += ' execution-decoration-val';

                if (hasSuggestion) {
                    baseClass = 'execution-decoration-base execution-decoration-suggestion';
                }

                decorations.push({
                    range: new monaco.Range(line, maxCol, line, maxCol),
                    options: {
                        isWholeLine: false,
                        afterContentClassName: `${baseClass} ${className}`,
                        linesDecorationsClassName: hasSuggestion ? 'execution-suggestion-gutter' : (isError ? 'execution-error-gutter' : 'execution-coverage-gutter')
                    }
                });
            });
        };

        processEntries(executionResults, 'result');
        processEntries(executionErrors, 'error');

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

    }, [executionResults, executionErrors, editorInstance, monaco, selectedFile, code, livePreviewEnabled, cursorLine]);
}
