/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { describe, it, expect, vi } from 'vitest';
import * as t from '@babel/types';
import { VariableHandler } from './VariableHandler';
import type { ParserContext } from '../types';

describe('VariableHandler', () => {
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

    it('should handle simple variable declaration', () => {
        const ctx = createMockContext();
        const node = t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier('x'), t.numericLiteral(42))
        ]);

        const resultId = VariableHandler.handle(node, ctx);

        expect(ctx.nodes).toHaveLength(1);
        const varNode = ctx.nodes[0];
        expect(varNode.type).toBe('variableNode');
        expect(varNode.data.label).toBe('x');
        expect(varNode.data.value).toBe('42');
        expect(ctx.variableNodes.x).toBe(varNode.id);
        expect(resultId).toBe(varNode.id);
    });

    it('should handle multiple declarations in one statement', () => {
        const ctx = createMockContext();
        const node = t.variableDeclaration('let', [
            t.variableDeclarator(t.identifier('a'), t.stringLiteral('foo')),
            t.variableDeclarator(t.identifier('b'), t.booleanLiteral(true))
        ]);

        VariableHandler.handle(node, ctx);

        expect(ctx.nodes).toHaveLength(2);
        expect(ctx.nodes[0].data.label).toBe('a');
        expect(ctx.nodes[0].data.value).toBe("'foo'");
        expect(ctx.nodes[1].data.label).toBe('b');
        expect(ctx.nodes[1].data.value).toBe('true');
    });

    it('should handle type annotations', () => {
        const ctx = createMockContext();
        const id = t.identifier('age');
        id.typeAnnotation = t.tsTypeAnnotation(t.tsNumberKeyword());

        const node = t.variableDeclaration('const', [
            t.variableDeclarator(id, t.numericLiteral(30))
        ]);

        VariableHandler.handle(node, ctx);

        expect(ctx.nodes[0].data.typeAnnotation).toBe('number');
    });

    it('should handle await expressions', () => {
        const ctx = createMockContext();
        const node = t.variableDeclaration('const', [
            t.variableDeclarator(
                t.identifier('data'),
                t.awaitExpression(t.callExpression(t.identifier('fetchData'), []))
            )
        ]);

        VariableHandler.handle(node, ctx);

        expect(ctx.nodes[0].data.isAwait).toBe(true);
        expect(ctx.nodes[0].data.value).toBe('(computed)');
    });

    it('should handle call expressions and create reference edges', () => {
        const ctx = createMockContext();
        // Add a "source" variable to the context
        ctx.variableNodes.sourceVar = 'source-node-id';

        const node = t.variableDeclaration('const', [
            t.variableDeclarator(
                t.identifier('result'),
                t.callExpression(t.identifier('myFunc'), [t.identifier('sourceVar')])
            )
        ]);

        VariableHandler.handle(node, ctx);

        expect(ctx.nodes).toHaveLength(1);
        const resultNodeId = ctx.nodes[0].id;

        // Edge from sourceVar to result nested-arg-0
        const edge = ctx.edges.find(e => e.target === resultNodeId && e.targetHandle === 'nested-arg-0');
        expect(edge).toBeDefined();
        expect(edge?.source).toBe('source-node-id');
    });

    it('should create edge to Native API node for console.log or similar', () => {
        const ctx = createMockContext();
        const node = t.variableDeclaration('const', [
            t.variableDeclarator(
                t.identifier('res'),
                t.callExpression(
                    t.memberExpression(t.identifier('console'), t.identifier('log')),
                    []
                )
            )
        ]);

        VariableHandler.handle(node, ctx);

        const edge = ctx.edges.find(e => e.source === 'native-api-id');
        expect(edge).toBeDefined();
        expect(edge?.target).toBe(ctx.nodes[0].id);
    });

    it('should handle simple object destructuring', () => {
        const ctx = createMockContext();
        const node = t.variableDeclaration('const', [
            t.variableDeclarator(
                t.objectPattern([
                    t.objectProperty(t.identifier('u'), t.identifier('u')),
                    t.objectProperty(t.identifier('v'), t.identifier('v'))
                ]),
                t.identifier('point')
            )
        ]);
        ctx.variableNodes.point = 'point-node-id';

        VariableHandler.handle(node, ctx);

        // Should create: 1 destructuring node + 2 variable nodes
        const destrNode = ctx.nodes.find(n => n.type === 'destructuringNode');
        expect(destrNode).toBeDefined();
        expect(destrNode?.data.destructuringKeys).toEqual(['u', 'v']);

        const uNode = ctx.nodes.find(n => n.type === 'variableNode' && n.data.label === 'u');
        const vNode = ctx.nodes.find(n => n.type === 'variableNode' && n.data.label === 'v');
        expect(uNode).toBeDefined();
        expect(vNode).toBeDefined();

        // Edge from point to destr input
        expect(ctx.edges.some(e => e.source === 'point-node-id' && e.target === destrNode?.id)).toBe(true);
        // Edges from destr keys to variable nodes
        expect(ctx.edges.some(e => e.source === destrNode?.id && e.sourceHandle === 'u' && e.target === uNode?.id)).toBe(true);
        expect(ctx.edges.some(e => e.source === destrNode?.id && e.sourceHandle === 'v' && e.target === vNode?.id)).toBe(true);
    });

    it('should handle nested object destructuring', () => {
        const ctx = createMockContext();
        // const { a: { b } } = obj;
        const node = t.variableDeclaration('const', [
            t.variableDeclarator(
                t.objectPattern([
                    t.objectProperty(
                        t.identifier('a'),
                        t.objectPattern([
                            t.objectProperty(t.identifier('b'), t.identifier('b'))
                        ])
                    )
                ]),
                t.identifier('obj')
            )
        ]);
        ctx.variableNodes.obj = 'obj-id';

        VariableHandler.handle(node, ctx);

        // Should have 2 destructuring nodes
        const destrNodes = ctx.nodes.filter(n => n.type === 'destructuringNode');
        expect(destrNodes).toHaveLength(2);

        const bNode = ctx.nodes.find(n => n.type === 'variableNode' && n.data.label === 'b');
        expect(bNode).toBeDefined();

        // Check the chain: obj -> destr1(a) -> destr2(b) -> bVar
        const destr1 = destrNodes.find(n => n.data.destructuringKeys.includes('a'));
        const destr2 = destrNodes.find(n => n.data.destructuringKeys.includes('b'));

        expect(ctx.edges.some(e => e.source === 'obj-id' && e.target === destr1?.id)).toBe(true);
        expect(ctx.edges.some(e => e.source === destr1?.id && e.sourceHandle === 'a' && e.target === destr2?.id)).toBe(true);
        expect(ctx.edges.some(e => e.source === destr2?.id && e.sourceHandle === 'b' && e.target === bNode?.id)).toBe(true);
    });

    it('should connect flow if parentId and handleName are provided', () => {
        const ctx = createMockContext();
        const node = t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier('z'), t.numericLiteral(0))
        ]);

        VariableHandler.handle(node, ctx, 'parent-id', 'output-handle');

        const flowEdge = ctx.edges.find(e => e.id.startsWith('flow-'));
        expect(flowEdge).toBeDefined();
        expect(flowEdge?.source).toBe('parent-id');
        expect(flowEdge?.sourceHandle).toBe('output-handle');
        expect(flowEdge?.target).toBe(ctx.nodes[0].id);
    });
});
