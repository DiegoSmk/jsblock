/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { describe, it, expect, vi } from 'vitest';
import * as t from '@babel/types';
import { FunctionHandler } from './FunctionHandler';
import type { ParserContext } from '../types';

describe('FunctionHandler', () => {
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

    it('should identify function declarations', () => {
        expect(FunctionHandler.canHandle(t.functionDeclaration(t.identifier('fn'), [], t.blockStatement([])))).toBe(true);
        expect(FunctionHandler.canHandle(t.variableDeclaration('const', []))).toBe(false);
    });

    it('should create a functionCallNode for declaration', () => {
        const ctx = createMockContext();
        const node = t.functionDeclaration(t.identifier('myFunc'), [t.identifier('a')], t.blockStatement([]));

        const nodeId = FunctionHandler.handle(node, ctx);

        expect(ctx.nodes).toHaveLength(1);
        expect(ctx.nodes[0].type).toBe('functionCallNode');
        expect(ctx.nodes[0].data.label).toBe('Definition: myFunc');
        expect(ctx.nodes[0].data.args).toEqual(['a']);
        expect(ctx.variableNodes['decl:myFunc']).toBe(nodeId);
    });

    it('should handle anonymous-style declarations (default export style)', () => {
        const ctx = createMockContext();
        const node = t.functionDeclaration(null, [], t.blockStatement([]));

        const nodeId = FunctionHandler.handle(node, ctx);
        expect(ctx.nodes[0].data.label).toBe('Definition: default');
        expect(nodeId).toBe('func-default');
    });

    it('should correctly mark async functions', () => {
        const ctx = createMockContext();
        const node = t.functionDeclaration(t.identifier('doWork'), [], t.blockStatement([]), false, true);

        FunctionHandler.handle(node, ctx);
        expect(ctx.nodes[0].data.isAsync).toBe(true);
    });

    it('should process function body using processBlock', () => {
        const ctx = createMockContext();
        const body = t.blockStatement([t.expressionStatement(t.identifier('run'))]);
        const node = t.functionDeclaration(t.identifier('fn'), [t.identifier('p1')], body);

        FunctionHandler.handle(node, ctx);

        expect(ctx.processBlock).toHaveBeenCalledWith(
            body,
            expect.stringContaining('func-fn'),
            'body',
            'Body',
            expect.arrayContaining([
                expect.objectContaining({ data: expect.objectContaining({ label: 'p1', isParameter: true }) })
            ])
        );
    });

    it('should handle parameter destructuring', () => {
        const ctx = createMockContext();
        // function fn({ x, y }) {}
        const param = t.objectPattern([
            t.objectProperty(t.identifier('x'), t.identifier('x')),
            t.objectProperty(t.identifier('y'), t.identifier('y'))
        ]);
        const node = t.functionDeclaration(t.identifier('fn'), [param], t.blockStatement([]));

        FunctionHandler.handle(node, ctx);

        // processBlock should be called with paramNodes containing destructuring and variables
        const callArgs = (ctx.processBlock as any).mock.calls[0];
        const paramNodes = callArgs[4];

        expect(paramNodes.some((n: any) => n.type === 'destructuringNode' && n.data.destructuringSource === 'Arguments')).toBe(true);
        expect(paramNodes.some((n: any) => n.type === 'variableNode' && n.data.label === 'x')).toBe(true);
        expect(paramNodes.some((n: any) => n.type === 'variableNode' && n.data.label === 'y')).toBe(true);
    });
});
