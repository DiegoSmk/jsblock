
import { generateCodeFromFlow } from '../src/logic/CodeGenerator';
import type { Node, Edge } from '@xyflow/react';

console.warn("Starting Verification of For Loop Code Generation...");

// 1. Setup Input Code
// We simulate the state where the user has a For Loop and a Call, but they are flat in the file.
const inputCode = `
for (let i = 0; i < 10; i++) {}
console.log("inside loop");
`;

// 2. Setup Nodes
// We map them to the indices:
// Index 0: ForStatement
// Index 1: ExpressionStatement (console.log)
const nodes: Node[] = [
    {
        id: 'for-0',
        type: 'forNode',
        position: { x: 0, y: 0 },
        data: { label: 'For Loop' }
    },
    {
        id: 'call-exec-1', // Corresponds to console.log("inside loop")
        type: 'functionCallNode',
        position: { x: 0, y: 100 },
        data: { label: 'console.log' }
    }
];

// 3. Setup Edges
// We connect the For Loop's body to the console.log
const edges: Edge[] = [
    {
        id: 'e1',
        source: 'for-0',
        target: 'call-exec-1',
        sourceHandle: 'flow-body',
        targetHandle: 'flow-in' // Target handle doesn't strictly matter for logic, mostly for graph
    }
];

// 4. Run Generator
const generatedCode = generateCodeFromFlow(inputCode, nodes, edges);

console.warn("\n--- Input Code ---");
console.warn(inputCode.trim());
console.warn("\n--- Generated Code ---");
console.warn(generatedCode.trim());

// 5. Assertions
const expectedCode = `
for (let i = 0; i < 10; i++) {
    console.log("inside loop");
}
`;

// Simple normalization for comparison (strip whitespace/newlines)
const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

if (normalize(generatedCode) === normalize(expectedCode)) {
    console.warn("\n✅ VERIFICATION PASSED: Code generated correctly.");
} else {
    console.error("\n❌ VERIFICATION FAILED: Output does not match expected.");
    console.error("Expected equivalent of:", expectedCode);
}
