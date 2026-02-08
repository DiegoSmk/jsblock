
import { describe, it, expect } from 'vitest';
import { parseCodeToFlow } from './parser/Parser';
import { getLayoutedElements } from './layout';

const generateLargeCode = (lines: number) => {
    let code = '';
    for (let i = 0; i < lines; i++) {
        code += `const var${i} = ${i};\n`;
        code += `if (var${i} > 10) { console.log("large"); }\n`;
        code += `function func${i}() { return var${i} * 2; }\n`;
    }
    return code;
};

describe('Parser Logic Benchmark', () => {
    it('measures core parsing logic time (offloaded to worker in app)', () => {
        const code = generateLargeCode(500); // 1500 lines of code roughly

        const start = performance.now();
        const { nodes, edges } = parseCodeToFlow(code);
        getLayoutedElements(nodes, edges);
        const end = performance.now();

        /* eslint-disable no-console */
        console.log(`Core Parsing + Layout Logic took: ${(end - start).toFixed(2)}ms`);
        console.log('This entire duration is now running in a Web Worker, unblocking the main thread.');
        /* eslint-enable no-console */

        expect(nodes.length).toBeGreaterThan(0);
    });
});
