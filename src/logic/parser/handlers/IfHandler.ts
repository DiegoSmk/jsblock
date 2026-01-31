import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { LogicHandler } from './LogicHandler';
import type { Node as BabelNode, IfStatement, Identifier } from '@babel/types';

export const IfHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'IfStatement',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const stmt = node as IfStatement;
        const nodeId = idSuffix ? `if-${idSuffix}` : generateId('if');

        ctx.nodes.push({
            id: nodeId,
            type: 'ifNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: 'If',
                scopeId: ctx.currentScopeId
            }
        });

        if (parentId && handleName) {
            ctx.edges.push(createEdge(parentId, nodeId, handleName, 'flow-in'));
        }

        // Process Condition (Test)
        const test = stmt.test;
        if (test.type === 'BinaryExpression' || test.type === 'LogicalExpression') {
            LogicHandler.handle(test, ctx, nodeId, 'condition');
        } else if (test.type === 'Identifier') {
            const sourceId = ctx.variableNodes[(test).name];
            if (sourceId) {
                ctx.edges.push(createEdge(sourceId, nodeId, 'output', 'condition'));
            }
        }

        // Process Blocks using hierarchical scopes
        ctx.processBlock(stmt.consequent, nodeId, 'flow-true', 'True');
        if (stmt.alternate) {
            ctx.processBlock(stmt.alternate, nodeId, 'flow-false', 'False');
        }

        return nodeId;
    }
};

