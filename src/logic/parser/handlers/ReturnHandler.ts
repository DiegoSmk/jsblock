
import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { LogicHandler } from './LogicHandler';
import { CallHandler } from './CallHandler';

export const ReturnHandler: ParserHandler = {
    canHandle: (stmt: any) => stmt.type === 'ReturnStatement',
    handle: (stmt: any, ctx: ParserContext, _parentId?: string, _handleName?: string, idSuffix?: string) => {
        const nodeId = idSuffix ? `return-${idSuffix}` : generateId('return');

        // Create a visual node for Return using FunctionCallNode style
        ctx.nodes.push({
            id: nodeId,
            type: 'functionCallNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: 'RETURN',
                args: ['value'], // This creates an input handle 'arg-0'
                scopeId: ctx.currentScopeId,
                isReturn: true // Flag mostly for potential future styling styling
            }
        } as any);

        // Process the return argument
        if (stmt.argument) {
            const argument = stmt.argument;

            // Helper to connect value source to return node
            const connectToReturn = (sourceId: string, sourceHandle: string = 'output') => {
                ctx.edges.push(createEdge(sourceId, nodeId, sourceHandle, 'arg-0'));
            };

            if (argument.type === 'Identifier') {
                const varName = argument.name;
                const sourceId = ctx.variableNodes[varName];
                if (sourceId) {
                    connectToReturn(sourceId);
                }
            } else if (argument.type === 'NumericLiteral' || argument.type === 'StringLiteral' || argument.type === 'BooleanLiteral') {
                const litId = generateId('literal');
                const value = String(argument.value);
                const type = argument.type === 'NumericLiteral' ? 'number' : (argument.type === 'BooleanLiteral' ? 'boolean' : 'string');

                ctx.nodes.push({
                    id: litId,
                    type: 'literalNode',
                    position: { x: 0, y: 0 },
                    parentId: ctx.currentParentId,
                    data: { label: type, value, type, scopeId: ctx.currentScopeId }
                } as any);

                connectToReturn(litId);
            } else if (LogicHandler.canHandle(argument)) {
                // Delegate to LogicHandler which returns the ID of the created logic node
                LogicHandler.handle(argument, ctx, nodeId, 'arg-0');
                // The LogicHandler internally connects if parentId/handleName are provided.
                // We passed nodeId and 'arg-0', so logical connection is handled there!
            } else if (CallHandler.canHandle(argument)) {
                CallHandler.handle(argument, ctx, nodeId, 'arg-0');
            }
        }

        return nodeId;
    }
};
