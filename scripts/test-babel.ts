import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';

const traverse: any = (traverseModule as any).default || traverseModule;
const generate: any = (generateModule as any).default || generateModule;

const code = `const a = 1;
console.log(a);
2 + 2;`;

try {
    const ast = parse(code, { sourceType: 'module' });
    let count = 0;
    traverse(ast, {
        enter(path: any) {
            count++;
            console.log('Visited:', path.node.type);
        },
        VariableDeclarator(path: any) {
            console.log('Found Var');
        }
    });
    console.log('Total visited:', count);
    const output = generate(ast, {}, code);
    console.log('Output length:', output.code.length);
} catch (e) {
    console.error('Test failed:', e);
}
