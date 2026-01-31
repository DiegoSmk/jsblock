
import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';

import type { Node as BabelNode, TryStatement } from '@babel/types';

export const TryCatchHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'TryStatement',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const stmt = node as TryStatement;
        const nodeId = idSuffix ? `try-${idSuffix}` : generateId('trycatch');

        ctx.nodes.push({
            id: nodeId,
            type: 'tryCatchNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: 'Try/Catch',
                scopeId: ctx.currentScopeId
            }
        });

        if (parentId && handleName) {
            ctx.edges.push(createEdge(parentId, nodeId, handleName, 'flow-in'));
        }

        // Process Try block
        ctx.processBlock(stmt.block, nodeId, 'flow-try', 'Try');

        // Process Catch block
        if (stmt.handler) {
            ctx.processBlock(stmt.handler.body, nodeId, 'flow-catch', 'Catch');
        }

        // Process Finally block
        if (stmt.finalizer) {
            ctx.processBlock(stmt.finalizer, nodeId, 'flow-finally', 'Finally');
        }

        return nodeId;
    }
};
