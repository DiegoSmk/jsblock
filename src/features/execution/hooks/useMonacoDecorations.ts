import { useEffect, useState } from 'react';
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
        code
    } = useStore(useShallow(state => ({
        executionResults: state.executionResults,
        executionErrors: state.executionErrors,
        livePreviewEnabled: state.livePreviewEnabled,
        selectedFile: state.selectedFile,
        code: state.code
    })));

    const monaco = useMonaco();
    const [cursorLine, setCursorLine] = useState<number>(-1);

    // 1. Quick Fix Logic (Shortcut & Click)
    const applyFix = (line: number, error: ExecutionError) => {
        if (!editorInstance || !error.suggestion) return;
        const model = editorInstance.getModel();
        if (!model) return;

        editorInstance.executeEdits('execution-fix', [
            {
                range: new monaco!.Range(line, 1, line, model.getLineMaxColumn(line)),
                text: error.suggestion.replace
            }
        ]);
        editorInstance.focus();
    };

    useEffect(() => {
        if (!monaco || !editorInstance) return;

        // Command for CTRL+ENTER Fix
        const commandId = editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            const selection = editorInstance.getSelection();
            if (!selection) return;
            const line = selection.startLineNumber;
            const error = executionErrors.get(line);
            if (error && error.suggestion) {
                applyFix(line, error);
            }
        });

        // Click Handler for decorations
        const mouseDownListener = editorInstance.onMouseDown((e) => {
            if (e.target.element?.className.includes('execution-decoration-suggestion')) {
                const line = e.target.range?.startLineNumber;
                if (line) {
                    const error = executionErrors.get(line);
                    if (error && error.suggestion) {
                        applyFix(line, error);
                    }
                }
            }
        });

        // Also keep standard CodeActionProvider as fallback
        const provider = monaco.languages.registerCodeActionProvider(['javascript', 'typescript'], {
            provideCodeActions: (model, range) => {
                const line = range.startLineNumber;
                const error = executionErrors.get(line);
                if (error && error.suggestion) {
                    return {
                        actions: [{
                            title: `✨ ${error.suggestion.text}`,
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
                        dispose: () => { }
                    };
                }
                return { actions: [], dispose: () => { } };
            }
        });

        return () => {
            mouseDownListener.dispose();
            provider.dispose();
        };
    }, [monaco, editorInstance, executionErrors]);

    // 2. Decorations and Cursor Isolation
    useEffect(() => {
        if (!editorInstance || !monaco) return;

        const disposable = editorInstance.onDidChangeCursorPosition((e) => {
            setCursorLine(e.position.lineNumber);
        });

        const model = editorInstance.getModel();
        if (!model) return;

        if (!livePreviewEnabled) {
            (editorInstance as any)._executionDecorations = editorInstance.deltaDecorations((editorInstance as any)._executionDecorations || [], []);
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

        const processEntries = (map: Map<number, ExecutionEntry[] | ExecutionError>, type: 'result' | 'error') => {
            if (!map || map.size === 0) return;

            map.forEach((entry, lineKey) => {
                const line = Number(lineKey);
                if (isNaN(line) || line < 1 || line > model.getLineCount()) return;

                // SPECIAL RULE: Show suggestions EVEN ON THE CURSOR LINE
                const isErrorWithSuggestion = type === 'error' && (entry as ExecutionError).suggestion;

                if (!isErrorWithSuggestion && line === cursorLine) return;

                let text = '';
                let isLog = false;
                let hasSuggestion = false;

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
                    const err = entry as ExecutionError;
                    text = processText(err.message);
                    if (err.suggestion) {
                        text = `✨ SUGGESTION: ${err.suggestion.text} (CTRL + ENTER to apply) | ${text}`;
                        hasSuggestion = true;
                    }
                }

                const className = `deco-${type}-${line}`;
                dynamicCss += `.${className}::after { content: "${text}"; }\n`;

                const maxCol = model.getLineMaxColumn(line);
                let baseClass = 'execution-decoration-base';
                if (type === 'error') baseClass += ' execution-decoration-error';
                else if (isLog) baseClass += ' execution-decoration-log';
                else baseClass += ' execution-decoration-val';

                if (hasSuggestion) baseClass = 'execution-decoration-base execution-decoration-suggestion';

                decorations.push({
                    range: new monaco.Range(line, maxCol, line, maxCol),
                    options: {
                        isWholeLine: false,
                        afterContentClassName: `${baseClass} ${className}`,
                        linesDecorationsClassName: hasSuggestion ? 'execution-suggestion-gutter' : (type === 'error' ? 'execution-error-gutter' : 'execution-coverage-gutter')
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

        (editorInstance as any)._executionDecorations = editorInstance.deltaDecorations((editorInstance as any)._executionDecorations || [], decorations);

        return () => {
            disposable.dispose();
        };

    }, [executionResults, executionErrors, editorInstance, monaco, selectedFile, code, livePreviewEnabled, cursorLine]);
}
