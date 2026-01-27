
import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';

import { CallHandler } from './CallHandler';

export const LogicHandler: ParserHandler = {
    canHandle: (stmt: any) => {
        // Handle standalone expressions or nested ones
        const expr = stmt.type === 'ExpressionStatement' ? stmt.expression : stmt;
        return expr.type === 'BinaryExpression' || expr.type === 'LogicalExpression';
    },
    handle: (stmt: any, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const expr = stmt.type === 'ExpressionStatement' ? stmt.expression : stmt;
        const nodeId = idSuffix ? `logic-${idSuffix}` : generateId('logic');
        const op = expr.operator;

        ctx.nodes.push({
            id: nodeId,
            type: 'logicNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                op,
                scopeId: ctx.currentScopeId
            }
        } as any);

        if (parentId && handleName) {
            // Logic node provides the value (source) to the parent consumer (target)
            ctx.edges.push(createEdge(nodeId, parentId, 'result', handleName));
        }

        const processOperand = (operand: any, targetHandle: string) => {
            if (operand.type === 'Identifier') {
                const sourceId = ctx.variableNodes[operand.name];
                if (sourceId) {
                    ctx.edges.push(createEdge(sourceId, nodeId, 'output', targetHandle));
                }
            } else if (operand.type === 'NumericLiteral' || operand.type === 'StringLiteral' || operand.type === 'BooleanLiteral') {
                const litId = generateId('literal');
                const value = String(operand.value);
                const type = operand.type === 'NumericLiteral' ? 'number' : (operand.type === 'BooleanLiteral' ? 'boolean' : 'string');

                ctx.nodes.push({
                    id: litId,
                    type: 'literalNode',
                    position: { x: 0, y: 0 },
                    parentId: ctx.currentParentId,
                    data: { label: type, value, type, scopeId: ctx.currentScopeId }
                } as any);

                ctx.edges.push(createEdge(litId, nodeId, 'output', targetHandle));
            } else if (operand.type === 'BinaryExpression' || operand.type === 'LogicalExpression' || operand.type === 'CallExpression') {
                if (LogicHandler.canHandle(operand)) {
                    LogicHandler.handle(operand, ctx, nodeId, targetHandle);
                } else if (CallHandler.canHandle(operand)) {
                    CallHandler.handle(operand, ctx, nodeId, targetHandle);
                }
            }
        };

        processOperand(expr.left, 'input-a');
        processOperand(expr.right, 'input-b');

        return nodeId; // Return ID for nested usage
    }
};
