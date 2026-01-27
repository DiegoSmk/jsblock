import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { LogicHandler } from './LogicHandler';
import { CallHandler } from './CallHandler';

export const AssignmentHandler: ParserHandler = {
    canHandle: (stmt: any) => {
        const expr = stmt.type === 'ExpressionStatement' ? stmt.expression : stmt;
        return expr.type === 'AssignmentExpression';
    },
    handle: (stmt: any, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const expr = stmt.type === 'ExpressionStatement' ? stmt.expression : stmt;
        const nodeId = idSuffix ? `assignment-${idSuffix}` : generateId('assignment');

        // Left side: variable being assigned to
        const varName = expr.left.type === 'Identifier' ? expr.left.name : 'unknown';

        ctx.nodes.push({
            id: nodeId,
            type: 'functionCallNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: `Set: ${varName}`,
                args: ['Value'],
                isStandalone: true,
                scopeId: ctx.currentScopeId
            }
        } as any);

        if (parentId && handleName) {
            ctx.edges.push(createEdge(parentId, nodeId, handleName, 'flow-in'));
        }

        // Link right side (value)
        const right = expr.right;
        if (right.type === 'Identifier') {
            const sourceId = ctx.variableNodes[right.name];
            if (sourceId) {
                ctx.edges.push(createEdge(sourceId, nodeId, 'output', 'arg-0'));
            }
        } else if (right.type === 'NumericLiteral' || right.type === 'StringLiteral' || right.type === 'BooleanLiteral') {
            const litId = generateId('literal');
            const value = String(right.value);
            const type = right.type === 'NumericLiteral' ? 'number' : (right.type === 'BooleanLiteral' ? 'boolean' : 'string');

            ctx.nodes.push({
                id: litId,
                type: 'literalNode',
                position: { x: 0, y: 0 },
                parentId: ctx.currentParentId,
                data: { label: type, value, type, scopeId: ctx.currentScopeId }
            } as any);

            ctx.edges.push(createEdge(litId, nodeId, 'output', 'arg-0'));
        } else if (LogicHandler.canHandle(right)) {
            LogicHandler.handle(right, ctx, nodeId, 'arg-0');
        } else if (CallHandler.canHandle(right)) {
            CallHandler.handle(right, ctx, nodeId, 'arg-0');
        }

        return nodeId;
    }
};
