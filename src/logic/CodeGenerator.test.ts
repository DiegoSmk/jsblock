
import { describe, it, expect } from 'vitest';
import { generateCodeFromFlow } from './CodeGenerator';
import type { AppNode } from '../types/store';
import type { Edge } from '@xyflow/react';

describe('CodeGenerator', () => {
    it('should generate code from flow correctly', () => {
        const initialCode = `
console.log('Hello');
`;
        // Use initial code that has a statement at index 0

        // Mock nodes
        // We will try to replace the argument 'Hello' with a variable value
        const nodes: AppNode[] = [
            {
                id: 'var-1',
                type: 'variableNode',
                position: { x: 0, y: 0 },
                data: {
                    label: 'myVar',
                    value: 'World'
                }
            },
            {
                id: 'call-exec-0', // Corresponds to the first statement: console.log(...)
                type: 'functionCallNode',
                position: { x: 100, y: 0 },
                data: {}
            }
        ];

        // Mock edges
        const edges: Edge[] = [
            {
                id: 'e1',
                source: 'var-1',
                target: 'call-exec-0',
                sourceHandle: 'value',
                targetHandle: 'arg-0' // Replace first argument
            }
        ];

        const generated = generateCodeFromFlow(initialCode, nodes, edges);

        // Expect 'Hello' to be replaced by 'myVar' (since variableNode maps label to ID)
        // Wait, logic says: if (varMap[sourceId]) newArgValue = b.identifier(varMap[sourceId])
        // varMap maps id 'var-1' to label 'myVar'

        // However, the CodeGenerator also handles VariableDeclaration logic if the variableNode is used there.
        // Here we are just passing it to a call.

        // The generator does not automatically INSERT the variable declaration.
        // It assumes the variable exists or is being used as a value source.

        // Let's check the output.
        expect(generated).toContain("console.log(myVar);");
    });

    it('should handle literal values injection', () => {
         const initialCode = `
console.log('placeholder');
`;
        const nodes: AppNode[] = [
            {
                id: 'lit-1',
                type: 'literalNode',
                position: { x: 0, y: 0 },
                data: {
                    value: 42
                }
            },
            {
                id: 'call-exec-0',
                type: 'functionCallNode',
                position: { x: 100, y: 0 },
                data: {}
            }
        ];

        const edges: Edge[] = [
            {
                id: 'e1',
                source: 'lit-1',
                target: 'call-exec-0',
                sourceHandle: 'value',
                targetHandle: 'arg-0'
            }
        ];

        const generated = generateCodeFromFlow(initialCode, nodes, edges);
        expect(generated).toContain("console.log(42);");
    });
});
