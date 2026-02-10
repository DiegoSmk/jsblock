/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { describe, it, expect, vi } from 'vitest';
import * as t from '@babel/types';
import { IfHandler } from './IfHandler';
import { LogicHandler } from './LogicHandler';
import type { ParserContext } from '../types';

vi.mock('./LogicHandler', () => ({
    LogicHandler: {
        handle: vi.fn(() => 'logic-node-id')
    }
}));

describe('IfHandler', () => {
    const createMockContext = (): ParserContext => ({
        nodes: [],
        edges: [],
        variableNodes: {},
        body: [],
        indexCounter: { value: 0 },
        currentParentId: undefined,
        nativeApiNodeId: 'native-api-id',
        currentScopeId: 'global',
        scopeOwnerId: undefined,
        isExporting: false,
        isExportingDefault: false,
        processBlock: vi.fn(),
        parseStatement: vi.fn(),
    });

    it('should identify if statements', () => {
        expect(IfHandler.canHandle(t.ifStatement(t.booleanLiteral(true), t.blockStatement([])))).toBe(true);
        expect(IfHandler.canHandle(t.variableDeclaration('const', []))).toBe(false);
    });

    it('should create an ifNode and connect flow-in', () => {
        const ctx = createMockContext();
        const node = t.ifStatement(t.booleanLiteral(true), t.blockStatement([]));

        const nodeId = IfHandler.handle(node, ctx, 'parent-node', 'parent-output');

        expect(ctx.nodes).toHaveLength(1);
        expect(ctx.nodes[0].type).toBe('ifNode');

        const flowEdge = ctx.edges.find(e => e.target === nodeId && e.targetHandle === 'flow-in');
        expect(flowEdge).toBeDefined();
        expect(flowEdge?.source).toBe('parent-node');
        expect(flowEdge?.sourceHandle).toBe('parent-output');
    });

    it('should delegate complex condition to LogicHandler', () => {
        const ctx = createMockContext();
        const test = t.binaryExpression('==', t.identifier('x'), t.numericLiteral(1));
        const node = t.ifStatement(test, t.blockStatement([]));

        IfHandler.handle(node, ctx);

        expect(LogicHandler.handle).toHaveBeenCalledWith(test, ctx, expect.any(String), 'condition');
    });

    it('should handle identifier condition directly', () => {
        const ctx = createMockContext();
        ctx.variableNodes.isValid = 'is-valid-node';
        const node = t.ifStatement(t.identifier('isValid'), t.blockStatement([]));

        const nodeId = IfHandler.handle(node, ctx);

        const condEdge = ctx.edges.find(e => e.target === nodeId && e.targetHandle === 'condition');
        expect(condEdge).toBeDefined();
        expect(condEdge?.source).toBe('is-valid-node');
    });

    it('should process consequent and alternate blocks', () => {
        const ctx = createMockContext();
        const trueBody = t.blockStatement([]);
        const falseBody = t.blockStatement([]);
        const node = t.ifStatement(t.booleanLiteral(true), trueBody, falseBody);

        const nodeId = IfHandler.handle(node, ctx);

        expect(ctx.processBlock).toHaveBeenCalledWith(trueBody, nodeId, 'flow-true', 'True');
        expect(ctx.processBlock).toHaveBeenCalledWith(falseBody, nodeId, 'flow-false', 'False');
    });
});
