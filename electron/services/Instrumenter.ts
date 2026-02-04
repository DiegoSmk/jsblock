import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export class Instrumenter {
    static instrumentCode(code: string): string {
        try {
            const ast = parse(code, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx'] // Enable TS parsing
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (traverse as any).default(ast, {
                // Visit Variable Declarations: const x = 10 -> const x = __spy(10, line)
                VariableDeclarator(path: any) {
                    if (path.node.init) {
                        const line = path.node.loc?.start.line;
                        if (line) {
                            path.node.init = t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                [path.node.init, t.numericLiteral(line)]
                            );
                        }
                    }
                },
                // Visit Assignments: x = 20 -> x = __spy(20, line)
                AssignmentExpression(path: any) {
                    const line = path.node.loc?.start.line;
                    if (line) {
                        path.node.right = t.callExpression(
                            t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                            [path.node.right, t.numericLiteral(line)]
                        );
                    }
                },
                // Visit Console Logs: console.log(x) -> console.log(__spy(x, line))
                CallExpression(path: any) {
                     if (
                        t.isMemberExpression(path.node.callee) &&
                        t.isIdentifier(path.node.callee.object, { name: 'console' }) &&
                        (
                            t.isIdentifier(path.node.callee.property, { name: 'log' }) ||
                            t.isIdentifier(path.node.callee.property, { name: 'warn' }) ||
                            t.isIdentifier(path.node.callee.property, { name: 'error' })
                        )
                    ) {
                         const line = path.node.loc?.start.line;
                         if (line) {
                             path.node.arguments = path.node.arguments.map((arg: any) => {
                                 return t.callExpression(
                                     t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                     [arg, t.numericLiteral(line)]
                                 );
                             });
                         }
                    }
                },
                // Visit Expression Statements: 2 + 2 -> __spy(2 + 2, line)
                ExpressionStatement(path: any) {
                    const line = path.node.loc?.start.line;
                    if (line && path.node.expression) {
                        // Skip if it's already a console.log or assignment (handled elsewhere to avoid double wrapping)
                        if (
                            t.isAssignmentExpression(path.node.expression) ||
                            (t.isCallExpression(path.node.expression) &&
                             t.isMemberExpression(path.node.expression.callee) &&
                             t.isIdentifier(path.node.expression.callee.object, { name: 'console' }))
                        ) {
                            return;
                        }

                        // Also skip 'use strict' directives
                        if (t.isStringLiteral(path.node.expression) && path.node.expression.value === 'use strict') {
                            return;
                        }

                        path.node.expression = t.callExpression(
                            t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                            [path.node.expression, t.numericLiteral(line)]
                        );
                    }
                },
                // Visit Return Statements: return x -> return __spy(x, line)
                ReturnStatement(path: any) {
                    if (path.node.argument) {
                        const line = path.node.loc?.start.line;
                        if (line) {
                            path.node.argument = t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                [path.node.argument, t.numericLiteral(line)]
                            );
                        }
                    }
                }
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const output = (generate as any).default(ast, {}, code);
            return output.code;
        } catch (err) {
            console.error('Instrumentation failed:', err);
            return code; // Fallback to original code
        }
    }
}
