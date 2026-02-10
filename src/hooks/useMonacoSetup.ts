import { useEffect, useCallback, useState, useRef } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { useMonacoDecorations } from '../features/execution/hooks/useMonacoDecorations';
import { useMonacoBenchmarks } from '../features/execution/hooks/useMonacoBenchmarks';
import { useGitGutter } from '../features/git/hooks/useGitGutter';

import type * as Monaco from 'monaco-editor';

interface UseMonacoSetupOptions {
    projectFiles: Record<string, string>;
    selectedFile: string | null;
    code: string | null;
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
export const useMonacoSetup = ({ projectFiles, selectedFile, code, saveFile }: UseMonacoSetupOptions) => {
    const monaco = useMonaco();
    const [editorInstance, setEditorInstance] = useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const createdModelsRef = useRef<Set<string>>(new Set());

    // Store latest code in ref for use in effects
    const codeRef = useRef<string | null>(null);
    useEffect(() => { codeRef.current = code; }, [code]);

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
                createdModelsRef.current.add(filePath);
            } else if (filePath !== selectedFile) {
                // Only update if content actually differs to avoid canceling internal monaco operations
                if (model.getValue() !== content) {
                    model.setValue(content);
                }
            }
        });

        // Dispose models that were created for project files but are no longer present
        for (const filePath of Array.from(createdModelsRef.current)) {
            if (!(filePath in projectFiles)) {
                const uri = m.Uri.file(filePath);
                const model = m.editor.getModel(uri);
                if (model) {
                    model.dispose();
                }
                createdModelsRef.current.delete(filePath);
            }
        }
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

    }, [monaco, projectFiles, selectedFile]);

    // 3. Sync main editor code with Monaco model when file changes
    useEffect(() => {
        if (!monaco || !selectedFile || !editorInstance || codeRef.current === null) return;

        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
        const m = monaco as any;
        const uri = m.Uri.file(selectedFile);
        let model = m.editor.getModel(uri);

        // If no model exists for this file, create one
        if (!model) {
            model = m.editor.createModel(codeRef.current, 'typescript', uri);
        }

        // Force the editor to use the correct model and value
        editorInstance.setModel(model);
        const currentValue = model.getValue();
        if (currentValue !== codeRef.current) {
            model.setValue(codeRef.current);
        }
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

    }, [monaco, selectedFile, editorInstance]);

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
