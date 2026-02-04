import { useRef, useEffect } from 'react';
import type { editor } from 'monaco-editor';
import { useStore } from '../store/useStore';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

// @ts-ignore
const traverse = _traverse.default || _traverse;

/**
 * Hook to apply "Quokka-like" inline decorations to the Monaco Editor.
 * It maps runtimeValues (from backend execution) to the corresponding lines in the code.
 */
export const useMonacoDecorations = (
    editorInstance: editor.IStandaloneCodeEditor | null,
    monacoInstance: any
) => {
    const runtimeValues = useStore((state) => state.runtimeValues);
    const code = useStore((state) => state.code);
    const decorationsRef = useRef<string[]>([]);

    useEffect(() => {
        if (!editorInstance || !monacoInstance || !code) return;

        // 1. Analyze code to find variable declaration lines
        const variableLines: Record<string, number> = {};

        try {
            const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });

            // @ts-ignore - traverse types issues
            traverse(ast, {
                VariableDeclarator(path: any) {
                    if (path.node.id.type === 'Identifier') {
                        const name = path.node.id.name;
                        // Use end line to show value after the declaration
                        if (path.node.loc) {
                            variableLines[name] = path.node.loc.end.line;
                        }
                    }
                },
                // Also catch assignments to existing variables
                AssignmentExpression(path: any) {
                    if (path.node.left.type === 'Identifier') {
                        const name = path.node.left.name;
                        if (path.node.loc) {
                            variableLines[name] = path.node.loc.end.line;
                        }
                    }
                }
            });
        } catch (e) {
            // Squelch parse errors here, main parser handles them
        }

        // 2. Prepare Decorations
        const newDecorations: editor.IModelDeltaDecoration[] = [];

        Object.entries(runtimeValues).forEach(([key, value]) => {
            const line = variableLines[key];
            if (line) {
                const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                const truncate = (str: string, n: number) => (str.length > n ? str.substr(0, n - 1) + '…' : str);

                newDecorations.push({
                    range: new monacoInstance.Range(line, 1, line, 1),
                    options: {
                        isWholeLine: true,
                        after: {
                            content: `  // ${truncate(valueStr, 50)}`,
                            inlineClassName: 'quokka-inline-value',
                            cursorStops: monacoInstance.editor.InjectedTextCursorStops.None
                        }
                    }
                });
            }
        });

        // 3. Apply Decorations
        decorationsRef.current = editorInstance.deltaDecorations(decorationsRef.current, newDecorations);

    }, [editorInstance, monacoInstance, runtimeValues, code]);
};
