import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { CallHandler } from './CallHandler';
import type { Node as BabelNode, BinaryExpression, LogicalExpression } from '@babel/types';
import * as t from '@babel/types';

export const LogicHandler: ParserHandler = {
    canHandle: (node: BabelNode) => {
        // Handle standalone expressions or nested ones
        const expr = node.type === 'ExpressionStatement' ? node.expression : node;
        return expr.type === 'BinaryExpression' || expr.type === 'LogicalExpression';
    },
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const expr = (t.isExpressionStatement(node) ? node.expression : node) as BinaryExpression | LogicalExpression;
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
        });

        if (parentId && handleName) {
            // Logic node provides the value (source) to the parent consumer (target)
            ctx.edges.push(createEdge(nodeId, parentId, 'result', handleName));
        }

        const processOperand = (operand: BabelNode, targetHandle: string) => {
            if (t.isIdentifier(operand)) {
                const sourceId = ctx.variableNodes[operand.name] || ctx.variableNodes[`import:${operand.name}`];
                if (sourceId) {
                    const isImport = !!ctx.variableNodes[`import:${operand.name}`];
                    ctx.edges.push({
                        id: `e-${sourceId}-to-${nodeId}-${targetHandle}`,
                        source: sourceId,
                        sourceHandle: isImport ? operand.name : 'output',
                        target: nodeId,
                        targetHandle: targetHandle,
                        animated: true,
                        style: { strokeWidth: 2, stroke: isImport ? '#38bdf8' : '#b1b1b7' }
                    });

                    // Macro Dependency
                    if (isImport && ctx.scopeOwnerId && ctx.scopeOwnerId !== sourceId) {
                        ctx.edges.push({
                            id: `macro-ref-${sourceId}-${operand.name}-to-${ctx.scopeOwnerId}-${nodeId}`,
                            source: sourceId,
                            sourceHandle: operand.name,
                            target: ctx.scopeOwnerId,
                            targetHandle: 'ref-target',
                            animated: false,
                            type: 'step',
                            style: { stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '3,3', opacity: 0.4 }
                        });
                    }
                }
            } else if (t.isNumericLiteral(operand) || t.isStringLiteral(operand) || t.isBooleanLiteral(operand)) {
                const litId = generateId('literal');
                const value = String(operand.value);
                const type = t.isNumericLiteral(operand) ? 'number' : (t.isBooleanLiteral(operand) ? 'boolean' : 'string');

                ctx.nodes.push({
                    id: litId,
                    type: 'literalNode',
                    position: { x: 0, y: 0 },
                    parentId: ctx.currentParentId,
                    data: { label: type, value, type, scopeId: ctx.currentScopeId }
                });

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

