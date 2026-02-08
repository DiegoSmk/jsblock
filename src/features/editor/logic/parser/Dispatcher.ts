import type { ParserContext } from './types';
import { CallHandler } from './handlers/CallHandler';
import { IfHandler } from './handlers/IfHandler';
import { LoopHandler } from './handlers/LoopHandler';
import { SwitchHandler } from './handlers/SwitchHandler';
import { TryCatchHandler } from './handlers/TryCatchHandler';
import { VariableHandler } from './handlers/VariableHandler';
import { LogicHandler } from './handlers/LogicHandler';
import { AssignmentHandler } from './handlers/AssignmentHandler';
import { FunctionHandler } from './handlers/FunctionHandler';
import { ReturnHandler } from './handlers/ReturnHandler';
import { ImportHandler } from './handlers/ImportHandler';
import { ClassHandler } from './handlers/ClassHandler';
import { ExportHandler } from './handlers/ExportHandler';
import { generateId } from './utils';
import type { Node as BabelNode, Statement } from '@babel/types';
import type { AppNode } from '../../types';

export const parseStatement = (stmt: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, index?: number, idSuffix?: string): string | undefined => {
    const suffix = idSuffix ?? (index !== undefined ? `${index}` : undefined);

    if (ImportHandler.canHandle(stmt)) {
        ImportHandler.handle(stmt, ctx, undefined, undefined, suffix);
        return undefined;
    }

    if (VariableHandler.canHandle(stmt)) {
        return VariableHandler.handle(stmt, ctx, undefined, undefined, suffix);
    }

    if (FunctionHandler.canHandle(stmt)) {
        return FunctionHandler.handle(stmt, ctx, undefined, undefined, suffix);
    }

    if (ClassHandler.canHandle(stmt)) {
        return ClassHandler.handle(stmt, ctx, undefined, undefined, idSuffix);
    }

    if (AssignmentHandler.canHandle(stmt)) {
        return AssignmentHandler.handle(stmt, ctx, parentId, handleName, suffix);
    }

    if (IfHandler.canHandle(stmt)) {
        return IfHandler.handle(stmt, ctx, parentId, handleName, suffix);
    }

    if (LoopHandler.canHandle(stmt)) {
        return LoopHandler.handle(stmt, ctx, parentId, handleName, suffix);
    }

    if (SwitchHandler.canHandle(stmt)) {
        return SwitchHandler.handle(stmt, ctx, parentId, handleName, suffix);
    }

    if (TryCatchHandler.canHandle(stmt)) {
        return TryCatchHandler.handle(stmt, ctx, parentId, handleName, suffix);
    }

    if (CallHandler.canHandle(stmt)) {
        return CallHandler.handle(stmt, ctx, parentId, handleName, suffix);
    }

    if (LogicHandler.canHandle(stmt)) {
        return LogicHandler.handle(stmt, ctx, parentId, handleName, suffix);
    }

    if (ReturnHandler.canHandle(stmt)) {
        return ReturnHandler.handle(stmt, ctx, parentId, handleName, suffix);
    }

    if (ExportHandler.canHandle(stmt)) {
        return ExportHandler.handle(stmt, ctx, parentId, handleName, suffix);
    }

    return undefined;
};

export const processBlockInScope = (
    bodyNode: BabelNode | BabelNode[],
    ctx: ParserContext,
    entryNodeId: string,
    flowHandle: string,
    label: string,
    preNodes: AppNode[] = []
) => {
    if (!bodyNode) return;

    const newScopeId = generateId('scope');

    const entryNode = ctx.nodes.find(n => n.id === entryNodeId);
    if (entryNode) {
        entryNode.data.scopes ??= {};
        entryNode.data.scopes[flowHandle] = {
            id: newScopeId,
            label: `${entryNode.data.label} > ${label}`
        };
    }


    const oldScopeId = ctx.currentScopeId;
    const oldParentId = ctx.currentParentId;

    ctx.currentScopeId = newScopeId;
    ctx.currentParentId = undefined; // Reset logical parenting inside new scope

    // Add pre-nodes (parameters) to the new scope
    preNodes.forEach((node: AppNode) => {
        node.data = { ...node.data, scopeId: newScopeId };
        ctx.nodes.push(node);
        if (node.type === 'variableNode') {
            const label = node.data.label ?? 'arg';
            ctx.variableNodes[label] = node.id;
        }
    });

    const statements = !Array.isArray(bodyNode) && bodyNode.type === 'BlockStatement' ? (bodyNode).body : (Array.isArray(bodyNode) ? bodyNode : [bodyNode]);


    let prevId: string | undefined = undefined;

    statements.forEach((stmt: BabelNode) => {
        const nodeId = parseStatement(stmt, ctx, prevId, 'flow-next');
        if (nodeId) {
            prevId = nodeId;
        }
    });

    ctx.currentScopeId = oldScopeId;
    ctx.currentParentId = oldParentId;
};

export const initializeContext = (astBody: Statement[], indexCounter: { value: number }): ParserContext => {
    const nativeApiId = 'node-js-runtime';
    const ctx: ParserContext = {
        nodes: [{
            id: nativeApiId,
            type: 'nativeApiNode',
            position: { x: 500, y: -200 }, // Position it away from main flow
            data: { label: 'JS Runtime' }
        }],
        edges: [],
        variableNodes: {},
        body: astBody,
        indexCounter,
        currentScopeId: 'root',
        currentParentId: undefined,
        nativeApiNodeId: nativeApiId,
        processBlock: (bodyNode, entryNodeId, flowHandle, label, preNodes) =>
            processBlockInScope(bodyNode, ctx, entryNodeId, flowHandle, label, preNodes),
        parseStatement: (stmt: BabelNode, parentId?: string, handleName?: string, index?: number, idSuffix?: string) =>
            parseStatement(stmt, ctx, parentId, handleName, index, idSuffix)
    };

    return ctx;
};
