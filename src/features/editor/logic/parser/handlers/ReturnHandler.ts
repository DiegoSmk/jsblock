import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { LogicHandler } from './LogicHandler';
import { CallHandler } from './CallHandler';
import type { Node as BabelNode, ReturnStatement } from '@babel/types';
import * as t from '@babel/types';

export const ReturnHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ReturnStatement',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const stmt = node as ReturnStatement;
        const nodeId = idSuffix ? `return-${idSuffix}` : generateId('return');

        // Create a visual node for Return using FunctionCallNode style
        ctx.nodes.push({
            id: nodeId,
            type: 'functionCallNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: 'Return',
                args: ['value'], // This creates an input handle 'arg-0'
                scopeId: ctx.currentScopeId,
                isStandalone: true,
                isReturn: true
            }
        });

        if (parentId && handleName) {
            ctx.edges.push(createEdge(parentId, nodeId, handleName, 'flow-in'));
        }

        // Process the return argument
        if (stmt.argument) {
            const argument = stmt.argument;

            // Helper to connect value source to return node
            const connectToReturn = (sourceId: string, _sourceHandle = 'output') => {
                ctx.edges.push(createEdge(sourceId, nodeId, 'output', 'arg-0'));
            };

            if (t.isIdentifier(argument)) {
                const varName = argument.name;
                const sourceId = ctx.variableNodes[varName] || ctx.variableNodes[`import:${varName}`];
                if (sourceId) {
                    const isImport = !!ctx.variableNodes[`import:${varName}`];
                    ctx.edges.push({
                        id: `e-${sourceId}-to-${nodeId}-ret`,
                        source: sourceId,
                        sourceHandle: isImport ? varName : 'output',
                        target: nodeId,
                        targetHandle: 'arg-0',
                        animated: true,
                        style: { strokeWidth: 2, stroke: isImport ? '#38bdf8' : '#b1b1b7' }
                    });

                    // Macro Dependency
                    if (isImport && ctx.scopeOwnerId && ctx.scopeOwnerId !== sourceId) {
                        ctx.edges.push({
                            id: `macro-ref-${sourceId}-${varName}-to-${ctx.scopeOwnerId}`,
                            source: sourceId,
                            sourceHandle: varName,
                            target: ctx.scopeOwnerId,
                            targetHandle: 'ref-target',
                            animated: false,
                            type: 'step',
                            style: { stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '3,3', opacity: 0.4 }
                        });
                    }
                }
            } else if (t.isNumericLiteral(argument) || t.isStringLiteral(argument) || t.isBooleanLiteral(argument)) {
                const litId = generateId('literal');
                const value = String(argument.value);
                const type = t.isNumericLiteral(argument) ? 'number' : (t.isBooleanLiteral(argument) ? 'boolean' : 'string');

                ctx.nodes.push({
                    id: litId,
                    type: 'literalNode',
                    position: { x: 0, y: 0 },
                    parentId: ctx.currentParentId,
                    data: { label: type, value, type, scopeId: ctx.currentScopeId }
                });

                connectToReturn(litId);
            } else if (LogicHandler.canHandle(argument)) {
                LogicHandler.handle(argument, ctx, nodeId, 'arg-0');
            } else if (CallHandler.canHandle(argument)) {
                CallHandler.handle(argument, ctx, nodeId, 'arg-0');
            }
        }

        return nodeId;
    }
};

