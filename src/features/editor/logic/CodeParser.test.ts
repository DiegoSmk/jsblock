import { describe, it, expect } from 'vitest';
import { parseCodeToFlow } from './CodeParser';
import type { AppNode } from '../types';

describe('CodeParser', () => {
    it('should parse variable destructuring', () => {
        const code = `
            const obj = { x: 1, y: 2 };
            const { x, y } = obj;
        `;
        const { nodes, edges } = parseCodeToFlow(code);

        // Should have:
        // 1. VariableNode 'obj'
        // 2. DestructuringNode for { x, y }
        // 3. VariableNode 'x'
        // 4. VariableNode 'y'

        const destrNode = nodes.find(n => n.type === 'destructuringNode');
        expect(destrNode).toBeDefined();
        expect(destrNode?.data.destructuringKeys).toEqual(['x', 'y']);
        expect(destrNode?.data.destructuringSource).toBe('obj');

        const xNode = nodes.find(n => n.type === 'variableNode' && n.data.label === 'x');
        const yNode = nodes.find(n => n.type === 'variableNode' && n.data.label === 'y');
        expect(xNode).toBeDefined();
        expect(yNode).toBeDefined();

        // Check edges
        // obj -> destr input
        const objNode = nodes.find(n => n.type === 'variableNode' && n.data.label === 'obj');
        const edgeToDestr = edges.find(e => e.source === objNode?.id && e.target === destrNode?.id);
        expect(edgeToDestr).toBeDefined();
        expect(edgeToDestr?.targetHandle).toBe('input');

        // destr x -> variable x
        const edgeToX = edges.find(e => e.source === destrNode?.id && e.target === xNode?.id);
        expect(edgeToX).toBeDefined();
        expect(edgeToX?.sourceHandle).toBe('x');
        expect(edgeToX?.targetHandle).toBe('ref-target');

        // destr y -> variable y
        const edgeToY = edges.find(e => e.source === destrNode?.id && e.target === yNode?.id);
        expect(edgeToY).toBeDefined();
        expect(edgeToY?.sourceHandle).toBe('y');
    });

    it('should parse function parameter destructuring', () => {
        const code = `
            function myFunc({ a, b }) {
                console.log(a);
            }
        `;
        const { nodes, edges } = parseCodeToFlow(code);

        const funcNode = nodes.find(n => n.type === 'functionCallNode' && n.data.label?.includes('myFunc'));
        expect(funcNode).toBeDefined();

        // Should find DestructuringNode inside the function body scope?
        // Or at least connected to params.
        const destrNode = nodes.find(n => n.type === 'destructuringNode');
        expect(destrNode).toBeDefined();
        expect(destrNode?.data.destructuringKeys).toEqual(['a', 'b']);
        expect(destrNode?.data.destructuringSource).toBe('Arguments');

        const aNode = nodes.find(n => n.type === 'variableNode' && n.data.label === 'a');
        expect(aNode).toBeDefined();
        expect(aNode?.data.isParameter).toBe(true);

        // Check edge from destr to a
        const edgeToA = edges.find(e => e.source === destrNode?.id && e.target === aNode?.id);
        expect(edgeToA).toBeDefined();
        expect(edgeToA?.sourceHandle).toBe('a');
    });
});
