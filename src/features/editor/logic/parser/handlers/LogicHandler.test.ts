/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { describe, it, expect, vi } from 'vitest';
import * as t from '@babel/types';
import { LogicHandler } from './LogicHandler';
import type { ParserContext } from '../types';

describe('LogicHandler', () => {
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

    it('should identify binary and logical expressions', () => {
        expect(LogicHandler.canHandle(t.binaryExpression('+', t.identifier('a'), t.identifier('b')))).toBe(true);
        expect(LogicHandler.canHandle(t.logicalExpression('&&', t.identifier('a'), t.identifier('b')))).toBe(true);
        expect(LogicHandler.canHandle(t.expressionStatement(t.binaryExpression('==', t.identifier('x'), t.numericLiteral(1))))).toBe(true);
        expect(LogicHandler.canHandle(t.identifier('x'))).toBe(false);
    });

    it('should handle simple binary expression with identifiers', () => {
        const ctx = createMockContext();
        ctx.variableNodes.a = 'node-a';
        ctx.variableNodes.b = 'node-b';

        const node = t.binaryExpression('+', t.identifier('a'), t.identifier('b'));
        const nodeId = LogicHandler.handle(node, ctx);

        expect(ctx.nodes).toHaveLength(1);
        expect(ctx.nodes[0].type).toBe('logicNode');
        expect(ctx.nodes[0].data.op).toBe('+');

        expect(ctx.edges).toHaveLength(2);
        expect(ctx.edges.some(e => e.source === 'node-a' && e.target === nodeId && e.targetHandle === 'input-a')).toBe(true);
        expect(ctx.edges.some(e => e.source === 'node-b' && e.target === nodeId && e.targetHandle === 'input-b')).toBe(true);
    });

    it('should handle literals in expressions', () => {
        const ctx = createMockContext();
        const node = t.binaryExpression('>', t.identifier('x'), t.numericLiteral(10));
        ctx.variableNodes.x = 'node-x';

        LogicHandler.handle(node, ctx);

        // Should have 1 logic node and 1 literal node
        expect(ctx.nodes).toHaveLength(2);
        const logicNode = ctx.nodes.find(n => n.type === 'logicNode');
        const literalNode = ctx.nodes.find(n => n.type === 'literalNode');

        expect(logicNode).toBeDefined();
        expect(literalNode).toBeDefined();
        expect(literalNode?.data.value).toBe('10');

        expect(ctx.edges.some(e => e.source === literalNode?.id && e.target === logicNode?.id && e.targetHandle === 'input-b')).toBe(true);
    });

    it('should handle nested logic expressions', () => {
        const ctx = createMockContext();
        // (a + b) * c
        const node = t.binaryExpression('*',
            t.binaryExpression('+', t.identifier('a'), t.identifier('b')),
            t.identifier('c')
        );
        ctx.variableNodes.a = 'node-a';
        ctx.variableNodes.b = 'node-b';
        ctx.variableNodes.c = 'node-c';

        const rootId = LogicHandler.handle(node, ctx);

        expect(ctx.nodes.filter(n => n.type === 'logicNode')).toHaveLength(2);
        const multNode = ctx.nodes.find(n => n.id === rootId);
        expect(multNode?.data.op).toBe('*');

        // Check connection from nested '+' to '*'
        const addNode = ctx.nodes.find(n => n.id !== rootId && n.type === 'logicNode');
        expect(addNode?.data.op).toBe('+');

        expect(ctx.edges.some(e => e.source === addNode?.id && e.target === multNode?.id && e.targetHandle === 'input-a')).toBe(true);
    });
});
