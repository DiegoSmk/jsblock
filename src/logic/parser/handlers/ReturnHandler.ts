import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { LogicHandler } from './LogicHandler';
import { CallHandler } from './CallHandler';
import type { Node as BabelNode, ReturnStatement } from '@babel/types';

export const ReturnHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ReturnStatement',
    handle: (node: BabelNode, ctx: ParserContext, _parentId?: string, _handleName?: string, idSuffix?: string) => {
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
                isReturn: true // Flag mostly for potential future styling styling
            }
        });

        // Process the return argument
        if (stmt.argument) {
            const argument = stmt.argument;

            // Helper to connect value source to return node
            const connectToReturn = (sourceId: string, _sourceHandle = 'output') => {
                ctx.edges.push(createEdge(sourceId, nodeId, 'output', 'arg-0'));
            };

            if (argument.type === 'Identifier') {
                const varName = (argument).name;
                const sourceId = ctx.variableNodes[varName];
                if (sourceId) {
                    connectToReturn(sourceId);
                }
            } else if (argument.type === 'NumericLiteral' || argument.type === 'StringLiteral' || argument.type === 'BooleanLiteral') {
                const litId = generateId('literal');
                const litArg = argument;
                const value = String((litArg as any).value);
                const type = argument.type === 'NumericLiteral' ? 'number' : (argument.type === 'BooleanLiteral' ? 'boolean' : 'string');

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

