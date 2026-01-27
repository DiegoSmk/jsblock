import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';
import { LogicHandler } from './LogicHandler';
import { VariableHandler } from './VariableHandler';
import { AssignmentHandler } from './AssignmentHandler';

export const LoopHandler: ParserHandler = {
    canHandle: (stmt: any) => stmt.type === 'WhileStatement' || stmt.type === 'ForStatement',
    handle: (stmt: any, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const isFor = stmt.type === 'ForStatement';
        const prefix = stmt.type === 'WhileStatement' ? 'while' : 'for';
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
        } as any);

        // 2. Connect to incoming flow
        if (parentId && handleName) {
            ctx.edges.push(createEdge(parentId, nodeId, handleName, 'flow-in'));
        }

        // 3. Process FOR specific parts (Init and Update) safely
        if (isFor) {
            // 1. Process Init (e.g., let i = 0)
            if (stmt.init) {
                if (VariableHandler.canHandle(stmt.init)) {
                    VariableHandler.handle(stmt.init, ctx);
                    const firstDecl = stmt.init.declarations?.[0];
                    if (firstDecl?.id?.type === 'Identifier') {
                        const varName = firstDecl.id.name;
                        const varId = ctx.variableNodes[varName];
                        if (varId) {
                            ctx.edges.push(createEdge(varId, nodeId, 'output', 'init'));
                        }
                    }
                } else if (AssignmentHandler.canHandle(stmt.init)) {
                    const assignId = AssignmentHandler.handle(stmt.init, ctx);
                    if (assignId) ctx.edges.push(createEdge(assignId, nodeId, 'result', 'init'));
                }
            }

            // Process Update (e.g., i++)
            if (stmt.update && stmt.update.type === 'UpdateExpression') {
                const updId = generateId('update');
                const argName = (stmt.update.argument as any)?.name || 'i';
                ctx.nodes.push({
                    id: updId,
                    type: 'functionCallNode',
                    position: { x: 0, y: 0 },
                    parentId: ctx.currentParentId,
                    data: {
                        label: `${argName}${stmt.update.operator}`,
                        args: [],
                        isStandalone: true,
                        scopeId: ctx.currentScopeId
                    }
                } as any);
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
                const sourceId = ctx.variableNodes[test.name];
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
