import { useEffect, useRef } from 'react';
import { useMonaco } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useStore } from '../../../store/useStore';
import { useShallow } from 'zustand/react/shallow';

export function useMonacoBenchmarks(editorInstance: Monaco.editor.IStandaloneCodeEditor | null) {
    const { runBenchmark, livePreviewEnabled } = useStore(useShallow(state => ({
        runBenchmark: state.runBenchmark,
        livePreviewEnabled: state.livePreviewEnabled
    })));

    const monaco = useMonaco();
    const decorationIdsRef = useRef<string[]>([]);

    useEffect(() => {
        if (!editorInstance || !monaco) return;

        const model = editorInstance.getModel();
        if (!model) return;

        // 1. Detect benchmark tags and add gutter decorations
        const handleDecorations = () => {
            if (!livePreviewEnabled) {
                decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, []);
                return;
            }
            // Support // @benchmark, //@bench, // @performance with optional spaces
            const regex = /\/\/\s*@(benchmark|bench|performance)/g;
            const matches = model.findMatches(regex.source, true, true, false, null, true);

            const newDecorations: Monaco.editor.IModelDeltaDecoration[] = matches.map(match => ({
                range: match.range,
                options: {
                    isWholeLine: true,
                    glyphMarginClassName: 'benchmark-gutter-icon',
                    glyphMarginHoverMessage: { value: 'Click to Run Multi-Runtime Benchmark' },
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                }
            }));

            decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, newDecorations);
        };

        handleDecorations();

        const disposable = model.onDidChangeContent(() => handleDecorations());

        // 2. Handle Click on Gutter Icon
        const mouseListener = editorInstance.onMouseDown((e) => {
            if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                const isBenchmark = e.target.element?.className.includes('benchmark-gutter-icon');
                if (isBenchmark) {
                    const line = e.target.position?.lineNumber;
                    if (line) {
                        void runBenchmark(model.getValue(), line);
                    }
                }
            }
        });

        return () => {
            disposable.dispose();
            mouseListener.dispose();
            decorationIdsRef.current = editorInstance.deltaDecorations(decorationIdsRef.current, []);
        };
    }, [editorInstance, monaco, runBenchmark, livePreviewEnabled]);
}
