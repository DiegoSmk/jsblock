import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { LogicHandler } from './LogicHandler';
import type { Node as BabelNode, IfStatement } from '@babel/types';

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
            const sourceId = ctx.variableNodes[test.name] || ctx.variableNodes[`import:${test.name}`];
            if (sourceId) {
                const isImport = !!ctx.variableNodes[`import:${test.name}`];
                ctx.edges.push({
                    id: `e-${sourceId}-to-${nodeId}-cond`,
                    source: sourceId,
                    sourceHandle: isImport ? test.name : 'output',
                    target: nodeId,
                    targetHandle: 'condition',
                    animated: true,
                    style: { strokeWidth: 2, stroke: isImport ? '#38bdf8' : '#b1b1b7' }
                });

                // Macro Dependency
                if (isImport && ctx.scopeOwnerId && ctx.scopeOwnerId !== sourceId) {
                    ctx.edges.push({
                        id: `macro-ref-${sourceId}-${test.name}-to-${ctx.scopeOwnerId}-${nodeId}`,
                        source: sourceId,
                        sourceHandle: test.name,
                        target: ctx.scopeOwnerId,
                        targetHandle: 'ref-target',
                        animated: false,
                        type: 'step',
                        style: { stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '3,3', opacity: 0.4 }
                    });
                }
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

