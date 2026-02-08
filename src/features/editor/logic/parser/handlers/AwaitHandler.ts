import type { ParserContext, ParserHandler } from '../types';
import type { Node as BabelNode, AwaitExpression } from '@babel/types';
import * as t from '@babel/types';

export const AwaitHandler: ParserHandler = {
    canHandle: (node: BabelNode) => {
        const expr = t.isExpressionStatement(node) ? node.expression : node;
        return expr.type === 'AwaitExpression';
    },
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const expr = (t.isExpressionStatement(node) ? node.expression : node) as AwaitExpression;

        // Parse the awaited argument
        // We pass the parentId and handleName so the inner node (e.g. Call) gets connected to the flow
        const argumentId = ctx.parseStatement(expr.argument, ctx, parentId, handleName, idSuffix);

        if (argumentId) {
            const argNode = ctx.nodes.find(n => n.id === argumentId);
            if (argNode) {
                argNode.data.isAwait = true;
            }
        }

        return argumentId;
    }
};
