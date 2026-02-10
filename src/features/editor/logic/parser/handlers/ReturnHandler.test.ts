/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { describe, it, expect, vi } from 'vitest';
import * as t from '@babel/types';
import { ReturnHandler } from './ReturnHandler';
import { LogicHandler } from './LogicHandler';
import type { ParserContext } from '../types';

vi.mock('./LogicHandler', () => ({
    LogicHandler: {
        canHandle: vi.fn((node) => node.type === 'BinaryExpression'),
        handle: vi.fn(() => 'logic-node-id')
    }
}));

describe('ReturnHandler', () => {
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

    it('should identify return statements', () => {
        expect(ReturnHandler.canHandle(t.returnStatement())).toBe(true);
        expect(ReturnHandler.canHandle(t.expressionStatement(t.identifier('x')))).toBe(false);
    });

    it('should create a return node (functionCallNode style)', () => {
        const ctx = createMockContext();
        const node = t.returnStatement();

        const nodeId = ReturnHandler.handle(node, ctx, 'parent', 'output');

        expect(ctx.nodes).toHaveLength(1);
        expect(ctx.nodes[0].type).toBe('functionCallNode');
        expect(ctx.nodes[0].data.label).toBe('Return');
        expect(ctx.nodes[0].data.isReturn).toBe(true);

        // Flow in edge
        expect(ctx.edges.some(e => e.source === 'parent' && e.target === nodeId)).toBe(true);
    });

    it('should handle returned literals', () => {
        const ctx = createMockContext();
        const node = t.returnStatement(t.numericLiteral(100));

        const nodeId = ReturnHandler.handle(node, ctx);

        expect(ctx.nodes.some(n => n.type === 'literalNode' && n.data.value === '100')).toBe(true);
        const literalNode = ctx.nodes.find(n => n.type === 'literalNode');
        expect(ctx.edges.some(e => e.source === literalNode?.id && e.target === nodeId && e.targetHandle === 'arg-0')).toBe(true);
    });

    it('should handle returned identifiers', () => {
        const ctx = createMockContext();
        ctx.variableNodes.x = 'var-x-id';
        const node = t.returnStatement(t.identifier('x'));

        const nodeId = ReturnHandler.handle(node, ctx);

        expect(ctx.edges.some(e => e.source === 'var-x-id' && e.target === nodeId && e.targetHandle === 'arg-0')).toBe(true);
    });

    it('should delegate complex returns to LogicHandler', () => {
        const ctx = createMockContext();
        const expr = t.binaryExpression('+', t.identifier('a'), t.identifier('b'));
        const node = t.returnStatement(expr);

        ReturnHandler.handle(node, ctx);

        expect(LogicHandler.handle).toHaveBeenCalledWith(expr, ctx, expect.any(String), 'arg-0');
    });
});
