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

            // Handle ESM/CJS interop for traverse
            let traverseFn: any = traverse;
            if (typeof traverse === 'object' && (traverse as any).default) {
                traverseFn = (traverse as any).default;
            }
            if (typeof traverseFn !== 'function' && (traverseFn as any).default) {
                traverseFn = (traverseFn as any).default;
            }

            traverseFn(ast, {
                // Visit Variable Declarations: const x = 10 -> const x = __spy(10, line)
                VariableDeclarator(path: any) {
                    if (path.node.init && !path.node.init._instrumented) {
                        // Skip simple literals (e.g. const a = 2) as they are obvious
                        if (
                            t.isNumericLiteral(path.node.init) ||
                            t.isStringLiteral(path.node.init) ||
                            t.isBooleanLiteral(path.node.init) ||
                            t.isNullLiteral(path.node.init) ||
                            t.isRegExpLiteral(path.node.init)
                        ) {
                            return;
                        }

                        const line = path.node.loc?.start.line;
                        if (line) {
                            path.node.init = t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                [path.node.init, t.numericLiteral(line), t.stringLiteral('spy')]
                            );
                            (path.node.init as any)._instrumented = true;
                        }
                    }
                },
                // Visit Assignments: x = 20 -> x = __spy(20, line)
                AssignmentExpression(path: any) {
                    if (!path.node._instrumented) {
                        // Skip simple literals
                        if (
                            t.isNumericLiteral(path.node.right) ||
                            t.isStringLiteral(path.node.right) ||
                            t.isBooleanLiteral(path.node.right) ||
                            t.isNullLiteral(path.node.right) ||
                            t.isRegExpLiteral(path.node.right)
                        ) {
                            return;
                        }

                        const line = path.node.loc?.start.line;
                        if (line) {
                            path.node.right = t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                [path.node.right, t.numericLiteral(line), t.stringLiteral('spy')]
                            );
                            (path.node.right as any)._instrumented = true;
                        }
                    }
                },
                // Visit Console Logs: console.log(x) -> console.log(__spy(x, line))
                CallExpression(path: any) {
                    if (
                        !path.node._instrumented &&
                        t.isMemberExpression(path.node.callee) &&
                        t.isIdentifier(path.node.callee.object, { name: 'console' }) &&
                        (
                            t.isIdentifier(path.node.callee.property, { name: 'log' }) ||
                            t.isIdentifier(path.node.callee.property, { name: 'info' }) ||
                            t.isIdentifier(path.node.callee.property, { name: 'warn' }) ||
                            t.isIdentifier(path.node.callee.property, { name: 'error' })
                        )
                    ) {
                        const line = path.node.loc?.start.line;
                        if (line) {
                            path.node.arguments = path.node.arguments.map((arg: any) => {
                                const spy = t.callExpression(
                                    t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                    [arg, t.numericLiteral(line), t.stringLiteral('log')]
                                );
                                (spy as any)._instrumented = true;
                                return spy;
                            });
                        }
                    }
                },
                // Visit Expression Statements: 2 + 2 -> __spy(2 + 2, line)
                ExpressionStatement(path: any) {
                    if (path.node._instrumented) return;
                    const line = path.node.loc?.start.line;
                    if (line && path.node.expression) {
                        // Skip if it's already a console.log, assignment or __coverage (handled elsewhere)
                        if (
                            t.isAssignmentExpression(path.node.expression) ||
                            (t.isCallExpression(path.node.expression) &&
                                t.isMemberExpression(path.node.expression.callee) &&
                                t.isIdentifier(path.node.expression.callee.object, { name: 'console' })) ||
                            (t.isCallExpression(path.node.expression) &&
                                t.isMemberExpression(path.node.expression.callee) &&
                                t.isIdentifier(path.node.expression.callee.property, { name: '__coverage' }))
                        ) {
                            return;
                        }

                        // Also skip 'use strict' directives
                        if (t.isStringLiteral(path.node.expression) && path.node.expression.value === 'use strict') {
                            return;
                        }

                        path.node.expression = t.callExpression(
                            t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                            [path.node.expression, t.numericLiteral(line), t.stringLiteral('spy')]
                        );
                        (path.node.expression as any)._instrumented = true;
                    }
                },
                // Coverage Instrumentation: Use Statement visitor but avoid recursion
                Statement(path: any) {
                    if (path.node._instrumented || t.isBlockStatement(path.node) || t.isProgram(path.node)) return;

                    const line = path.node.loc?.start.line;
                    if (line) {
                        const coverageNode = t.expressionStatement(
                            t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__coverage')),
                                [t.numericLiteral(line)]
                            )
                        );
                        (coverageNode as any)._instrumented = true;
                        path.insertBefore(coverageNode);
                    }
                },
                // Visit Return Statements: return x -> return __spy(x, line)
                ReturnStatement(path: any) {
                    if (path.node.argument && !path.node.argument._instrumented) {
                        const line = path.node.loc?.start.line;
                        if (line) {
                            path.node.argument = t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                [path.node.argument, t.numericLiteral(line), t.stringLiteral('spy')]
                            );
                            (path.node.argument as any)._instrumented = true;
                        }
                    }
                }
            });

            // Handle ESM/CJS interop for generate
            let generateFn: any = generate;
            if (typeof generate === 'object' && (generate as any).default) {
                generateFn = (generate as any).default;
            }
            if (typeof generateFn !== 'function' && (generateFn as any).default) {
                generateFn = (generateFn as any).default;
            }

            const output = generateFn(ast, {}, code);
            return output.code;
        } catch (err: any) {
            // Squelch syntax errors to avoid terminal spam during live typing
            if (err.code === 'BABEL_PARSER_SYNTAX_ERROR' || err.message?.includes('SyntaxError')) {
                // Just return original code, no noise
                return code;
            }

            // For other errors, log a one-liner
            console.warn(`[Instrumenter] Failed to instrument code: ${err.message}`);
            return code; // Fallback to original code
        }
    }
}
