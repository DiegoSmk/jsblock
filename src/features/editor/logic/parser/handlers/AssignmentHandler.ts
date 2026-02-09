import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { LogicHandler } from './LogicHandler';
import { CallHandler } from './CallHandler';
import type { Node as BabelNode, AssignmentExpression } from '@babel/types';
import * as t from '@babel/types';

export const AssignmentHandler: ParserHandler = {
    canHandle: (node: BabelNode) => {
        const expr = node.type === 'ExpressionStatement' ? node.expression : node;
        return expr.type === 'AssignmentExpression';
    },
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const expr = (t.isExpressionStatement(node) ? node.expression : node) as AssignmentExpression;
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
        });

        if (parentId && handleName) {
            ctx.edges.push(createEdge(parentId, nodeId, handleName, 'flow-in'));
        }

        // Link right side (value)
        const right = expr.right;
        if (t.isIdentifier(right)) {
            const sourceId = ctx.variableNodes[right.name] || ctx.variableNodes[`import:${right.name}`];
            if (sourceId) {
                const isImport = !!ctx.variableNodes[`import:${right.name}`];
                ctx.edges.push({
                    id: `e-${sourceId}-to-${nodeId}-val`,
                    source: sourceId,
                    sourceHandle: isImport ? right.name : 'output',
                    target: nodeId,
                    targetHandle: 'arg-0',
                    animated: true,
                    style: { strokeWidth: 2, stroke: isImport ? '#38bdf8' : '#b1b1b7' }
                });

                // Macro Dependency
                if (isImport && ctx.scopeOwnerId && ctx.scopeOwnerId !== sourceId) {
                    ctx.edges.push({
                        id: `macro-ref-${sourceId}-${right.name}-to-${ctx.scopeOwnerId}`,
                        source: sourceId,
                        sourceHandle: right.name,
                        target: ctx.scopeOwnerId,
                        targetHandle: 'ref-target',
                        animated: false,
                        type: 'step',
                        style: { stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '3,3', opacity: 0.4 }
                    });
                }
            }
        } else if (t.isNumericLiteral(right) || t.isStringLiteral(right) || t.isBooleanLiteral(right)) {
            const litId = generateId('literal');
            const value = String(right.value);
            const type = t.isNumericLiteral(right) ? 'number' : (t.isBooleanLiteral(right) ? 'boolean' : 'string');

            ctx.nodes.push({
                id: litId,
                type: 'literalNode',
                position: { x: 0, y: 0 },
                parentId: ctx.currentParentId,
                data: { label: type, value, type, scopeId: ctx.currentScopeId }
            });

            ctx.edges.push(createEdge(litId, nodeId, 'output', 'arg-0'));
        } else if (LogicHandler.canHandle(right)) {
            LogicHandler.handle(right, ctx, nodeId, 'arg-0');
        } else if (CallHandler.canHandle(right)) {
            CallHandler.handle(right, ctx, nodeId, 'arg-0');
        }

        return nodeId;
    }
};

