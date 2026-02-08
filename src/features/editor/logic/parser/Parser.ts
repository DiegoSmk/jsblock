import { parse } from '@babel/parser';
import type { Edge } from '@xyflow/react';
import { initializeContext, parseStatement } from './Dispatcher';
import type { Statement } from '@babel/types';
import type { AppNode } from '../../types';


export const parseCodeToFlow = (code: string): { nodes: AppNode[], edges: Edge[] } => {
    let ast;
    try {
        ast = parse(code, {
            sourceType: 'module',
            plugins: [
                'typescript',
                'topLevelAwait',
                'numericSeparator',
                'classProperties',
                'objectRestSpread',
                'dynamicImport'
            ]
        });
    } catch (e) {
        console.error("Parse Error", e);
        return { nodes: [], edges: [] };
    }

    const indexCounter = { value: 0 };
    const ctx = initializeContext(ast.program.body, indexCounter);

    // One-pass recursive parsing via Dispatcher
    let prevId: string | undefined = undefined;

    ast.program.body.forEach((stmt: Statement, index: number) => {
        const nodeId = parseStatement(stmt, ctx, prevId, 'flow-next', index);
        if (nodeId) {
            prevId = nodeId;
        }
    });

    return { nodes: ctx.nodes, edges: ctx.edges };
};
