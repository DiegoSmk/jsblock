
import { generateCodeFromFlow } from '../src/logic/CodeGenerator';
import type { Node, Edge } from '@xyflow/react';

console.log("Starting Verification of NESTED Control Flow...");

let allPassed = true;

const assertCode = (testName: string, generated: string, expected: string) => {
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    if (normalize(generated) === normalize(expected)) {
        console.log(`\n✅ ${testName} PASSED`);
    } else {
        console.error(`\n❌ ${testName} FAILED`);
        console.error("EXPECTED:\n" + expected);
        console.error("ACTUAL:\n" + generated);
        allPassed = false;
    }
};

// ==========================================
// TEST CASE 1: IF inside WHILE
// while (true) { if (true) { console.log('nested'); } }
// ==========================================
{
    const inputCode = `
while (true) {}
if (true) {}
console.log("nested");
`;

    const nodes: Node[] = [
        { id: 'while-0', type: 'whileNode', position: { x: 0, y: 0 }, data: { label: 'While' } },
        { id: 'if-1', type: 'ifNode', position: { x: 0, y: 100 }, data: { label: 'If' } },
        { id: 'call-exec-2', type: 'functionCallNode', position: { x: 0, y: 200 }, data: { label: 'log' } }
    ];

    const edges: Edge[] = [
        { id: 'e1', source: 'while-0', sourceHandle: 'flow-body', target: 'if-1', targetHandle: 'flow-in' },
        { id: 'e2', source: 'if-1', sourceHandle: 'flow-true', target: 'call-exec-2', targetHandle: 'flow-in' }
    ];

    const generated = generateCodeFromFlow(inputCode, nodes, edges);
    const expected = `
while (true) {
    if (true) {
        console.log("nested");
    }
}
`;
    assertCode("IF inside WHILE", generated, expected);
}

// ==========================================
// TEST CASE 2: FOR inside IF
// if (true) { for(let i=0; i<10; i++) { break; } }
// ==========================================
{
    const inputCode = `
if (true) {}
for (let i = 0; i < 10; i++) {}
break;
`;

    // Note: 'break' is usually a statement. For simplicity in this AST generator context, 
    // we often treat specific keywords as statements if they exist in source.
    // However, our parser treats expressions. `break` is a Statement.
    // Let's use console.log again or just an empty block if possible, or a break statement if we parsed it.
    // Our CodeParser might not parse standalone 'break' into a specific node type unless handled.
    // Let's use a function call "doSomething()" to be safe.

    // Changing input to use function call
    const inputCodeSafe = `
if (true) {}
for (let i = 0; i < 10; i++) {}
doSomething();
`;

    const nodes: Node[] = [
        { id: 'if-0', type: 'ifNode', position: { x: 0, y: 0 }, data: { label: 'If' } },
        { id: 'for-1', type: 'forNode', position: { x: 0, y: 100 }, data: { label: 'For' } },
        { id: 'call-exec-2', type: 'functionCallNode', position: { x: 0, y: 200 }, data: { label: 'doSomething' } }
    ];

    const edges: Edge[] = [
        { id: 'e1', source: 'if-0', sourceHandle: 'flow-true', target: 'for-1', targetHandle: 'flow-in' },
        { id: 'e2', source: 'for-1', sourceHandle: 'flow-body', target: 'call-exec-2', targetHandle: 'flow-in' }
    ];

    const generated = generateCodeFromFlow(inputCodeSafe, nodes, edges);
    const expected = `
if (true) {
    for (let i = 0; i < 10; i++) {
        doSomething();
    }
}
`;
    assertCode("FOR inside IF", generated, expected);
}

if (!allPassed) process.exit(1);
