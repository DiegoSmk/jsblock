import { useEffect } from 'react';
import { useMonaco } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useStore } from '../../../store/useStore';
import { useShallow } from 'zustand/react/shallow';

export function useGitGutter(editorInstance: Monaco.editor.IStandaloneCodeEditor | null) {
    const monaco = useMonaco();
    const { selectedFile, git, openedFolder } = useStore(useShallow(state => ({
        selectedFile: state.selectedFile,
        git: state.git,
        openedFolder: state.openedFolder
    })));

    useEffect(() => {
        if (!editorInstance || !monaco || !selectedFile || !window.electron || !git.isRepo || !openedFolder) {
            return;
        }

        const applyDecorations = async () => {
            try {
                // Find if the current file has changes
                // git.changes stores relative paths. selectedFile is absolute path?
                // Let's check existing code. selectedFile usually is absolute.
                // But git.changes has relative paths.

                // We need to match selectedFile with git.changes
                // selectedFile: /path/to/repo/src/file.ts
                // openedFolder: /path/to/repo
                // relative: src/file.ts

                let relativePath = selectedFile;
                if (selectedFile.startsWith(openedFolder)) {
                    relativePath = selectedFile.substring(openedFolder.length + 1); // +1 for separator
                }

                // Normalization for windows
                relativePath = relativePath.replace(/\\/g, '/');

                const fileStatus = git.changes.find(f => f.path === relativePath);

                if (!fileStatus && !git.changes.some(f => relativePath.endsWith(f.path))) {
                    // No changes for this file, clear decorations
                    const model = editorInstance.getModel();
                    if (model) {
                         const oldDecos = model.getAllDecorations()
                            .filter(d => d.options.linesDecorationsClassName?.includes('git-gutter'))
                            .map(d => d.id);
                        editorInstance.deltaDecorations(oldDecos, []);
                    }
                    return;
                }

                // If not found by exact match, try fuzzy match (handled above)
                if (!fileStatus) {
                     // Fallback or just re-run diff if we think it might be changed?
                     // If it's not in git.changes, it's clean.
                     // But git.changes is only updated on refresh.
                     // If user is typing, we might want to run diff?
                     // For performance, let's rely on git.changes (which updates on save/focus).
                }

                // Run git diff
                // Use relative path for git command
                const result = await window.electron.gitCommand(openedFolder, ['diff', '--unified=0', 'HEAD', '--', relativePath]);
                const diffOutput = result.stdout;
                const decorations: Monaco.editor.IModelDeltaDecoration[] = [];
                const lines = diffOutput.split('\n');

                for (const line of lines) {
                    // @@ -old_start,old_count +new_start,new_count @@
                    const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
                    if (match) {
                        const oldStart = parseInt(match[1], 10);
                        const oldCount = match[2] ? parseInt(match[2], 10) : 1;
                        const newStart = parseInt(match[3], 10);
                        const newCount = match[4] ? parseInt(match[4], 10) : 1;

                        if (oldCount === 0 && newCount > 0) {
                            // Added
                            decorations.push({
                                range: new monaco.Range(newStart, 1, newStart + newCount - 1, 1),
                                options: {
                                    isWholeLine: true,
                                    linesDecorationsClassName: 'git-gutter-added',
                                    overviewRuler: {
                                        color: '#22c55e', // Green
                                        position: monaco.editor.OverviewRulerLane.Left
                                    }
                                }
                            });
                        } else if (oldCount > 0 && newCount === 0) {
                            // Deleted
                            // Mark at the line where deletion happened (newStart is the line after deletion?)
                            // If newCount is 0, newStart is the context line.
                            // We should mark decoration on newStart?
                            decorations.push({
                                range: new monaco.Range(newStart, 1, newStart, 1),
                                options: {
                                    isWholeLine: true,
                                    linesDecorationsClassName: 'git-gutter-deleted',
                                    overviewRuler: {
                                        color: '#ef4444', // Red
                                        position: monaco.editor.OverviewRulerLane.Left
                                    }
                                }
                            });
                        } else {
                            // Modified
                            decorations.push({
                                range: new monaco.Range(newStart, 1, newStart + newCount - 1, 1),
                                options: {
                                    isWholeLine: true,
                                    linesDecorationsClassName: 'git-gutter-modified',
                                    overviewRuler: {
                                        color: '#3b82f6', // Blue
                                        position: monaco.editor.OverviewRulerLane.Left
                                    }
                                }
                            });
                        }
                    }
                }

                const model = editorInstance.getModel();
                if (model) {
                     const oldDecos = model.getAllDecorations()
                        .filter(d => d.options.linesDecorationsClassName?.includes('git-gutter'))
                        .map(d => d.id);
                    editorInstance.deltaDecorations(oldDecos, decorations);
                }

            } catch (err) {
                console.error('Failed to apply git gutter:', err);
            }
        };

        void applyDecorations();

    }, [editorInstance, monaco, selectedFile, git.changes, git.isRepo, openedFolder]);
}
