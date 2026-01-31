import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { LogicHandler } from './LogicHandler';
import { VariableHandler } from './VariableHandler';
import { AssignmentHandler } from './AssignmentHandler';
import type { Node as BabelNode, WhileStatement, ForStatement, Identifier, VariableDeclaration } from '@babel/types';

export const LoopHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'WhileStatement' || node.type === 'ForStatement',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const isFor = node.type === 'ForStatement';
        const stmt = node as WhileStatement | ForStatement;
        const prefix = node.type === 'WhileStatement' ? 'while' : 'for';
        const nodeId = idSuffix ? `${prefix}-${idSuffix}` : generateId(prefix);

        // 1. Create the Main Loop Node
        ctx.nodes.push({
            id: nodeId,
            type: isFor ? 'forNode' : 'whileNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: isFor ? 'For' : 'While',
                scopeId: ctx.currentScopeId
            }
        });

        // 2. Connect to incoming flow
        if (parentId && handleName) {
            ctx.edges.push(createEdge(parentId, nodeId, handleName, 'flow-in'));
        }

        // 3. Process FOR specific parts (Init and Update) safely
        if (isFor) {
            const forStmt = stmt as ForStatement;
            // 1. Process Init (e.g., let i = 0)
            if (forStmt.init) {
                if (VariableHandler.canHandle(forStmt.init)) {
                    VariableHandler.handle(forStmt.init, ctx);
                    const initDecl = forStmt.init as VariableDeclaration;
                    const firstDecl = initDecl.declarations?.[0];
                    if (firstDecl?.id?.type === 'Identifier') {
                        const varName = firstDecl.id.name;
                        const varId = ctx.variableNodes[varName];
                        if (varId) {
                            ctx.edges.push(createEdge(varId, nodeId, 'output', 'init'));
                        }
                    }
                } else if (AssignmentHandler.canHandle(forStmt.init)) {
                    const assignId = AssignmentHandler.handle(forStmt.init, ctx);
                    if (assignId) ctx.edges.push(createEdge(assignId, nodeId, 'result', 'init'));
                }
            }

            // Process Update (e.g., i++)
            if (forStmt.update?.type === 'UpdateExpression') {
                const updExpr = forStmt.update;
                const updId = generateId('update');
                const argName = (updExpr.argument as Identifier)?.name || 'i';
                ctx.nodes.push({
                    id: updId,
                    type: 'functionCallNode',
                    position: { x: 0, y: 0 },
                    parentId: ctx.currentParentId,
                    data: {
                        label: `${argName}${updExpr.operator}`,
                        args: [],
                        isStandalone: true,
                        scopeId: ctx.currentScopeId
                    }
                });
                ctx.edges.push(createEdge(updId, nodeId, 'return', 'update'));
            }
        }

        // 4. Process Condition (Test)
        const test = stmt.test;
        if (test) {
            const targetHandle = isFor ? 'test' : 'condition';
            if (LogicHandler.canHandle(test)) {
                LogicHandler.handle(test, ctx, nodeId, targetHandle);
            } else if (test.type === 'Identifier') {
                const sourceId = ctx.variableNodes[(test).name];
                if (sourceId) {
                    ctx.edges.push(createEdge(sourceId, nodeId, 'output', targetHandle));
                }
            }
        }

        // 5. Process Body (Hierarchical Scope)
        if (stmt.body) {
            ctx.processBlock(stmt.body, nodeId, 'flow-body', 'Body');
        }

        return nodeId;
    }
};

