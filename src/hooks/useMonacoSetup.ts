import { useEffect, useCallback, useState } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { useMonacoDecorations } from '../features/execution/hooks/useMonacoDecorations';
import { useMonacoBenchmarks } from '../features/execution/hooks/useMonacoBenchmarks';
import { useGitGutter } from '../features/git/hooks/useGitGutter';

import type * as Monaco from 'monaco-editor';

interface UseMonacoSetupOptions {
    projectFiles: Record<string, string>;
    selectedFile: string | null;
    saveFile: () => Promise<void>;
}

/**
 * Monaco editor configuration and lifecycle management extracted from App.tsx.
 * Handles compiler options, project file sync, editor mount, and decoration hooks.
 * 
 * **CRITICAL**: This hook is MANDATORY when using Monaco editor - it configures TypeScript
 * compiler options, syncs project files for IntelliSense, and applies runtime decorations.
 * 
 * Note: Uses `any` for Monaco API due to @monaco-editor/react type limitations.
 * This is necessary to access internal TypeScript language service APIs.
 * 
 * @returns Object containing:
 * - `handleEditorDidMount`: Callback for Monaco's onMount event
 * - `editorInstance`: The current editor instance (null until mounted)
 */
export const useMonacoSetup = ({ projectFiles, selectedFile, saveFile }: UseMonacoSetupOptions) => {
    const monaco = useMonaco();
    const [editorInstance, setEditorInstance] = useState<Monaco.editor.IStandaloneCodeEditor | null>(null);

    // 1. Configure Monaco once when it's ready
    useEffect(() => {
        if (!monaco) return;

        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
        const m = monaco as any;
        m.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: m.languages.typescript.ScriptTarget.ESNext,
            allowNonTsExtensions: true,
            moduleResolution: m.languages.typescript.ModuleResolutionKind.NodeJs,
            module: m.languages.typescript.ModuleKind.ESNext,
            noEmit: true,
            esModuleInterop: true,
            jsx: m.languages.typescript.JsxEmit.React,
            allowJs: true,
        });
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
    }, [monaco]);

    // 2. Sync project files (cross-file support)
    useEffect(() => {
        if (!monaco || Object.keys(projectFiles).length === 0) return;

        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
        const m = monaco as any;

        Object.entries(projectFiles).forEach(([filePath, content]) => {
            const uri = m.Uri.file(filePath);
            const model = m.editor.getModel(uri);
            if (!model) {
                m.editor.createModel(content, 'typescript', uri);
            } else if (filePath !== selectedFile) {
                // Only update if content actually differs to avoid canceling internal monaco operations
                if (model.getValue() !== content) {
                    model.setValue(content);
                }
            }
        });
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

    }, [monaco, projectFiles, selectedFile]);

    const handleEditorDidMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, m: typeof Monaco) => {
        setEditorInstance(editor);
        editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => {
            saveFile().catch(console.error);
        });
    }, [saveFile]);

    // Decoration hooks
    useMonacoDecorations(editorInstance);
    useMonacoBenchmarks(editorInstance);
    useGitGutter(editorInstance);

    return { handleEditorDidMount, editorInstance };
};
