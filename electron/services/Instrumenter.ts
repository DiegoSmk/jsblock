import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

import type { NodePath, Visitor } from '@babel/traverse';

// Use a custom interface to track instrumentation without using 'any'
interface Instrumented {
    _instrumented?: boolean;
}

export class Instrumenter {
    static instrumentCode(code: string): string {
        try {
            const ast = parse(code, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx'] // Enable TS parsing
            });

            // Handle ESM/CJS interop for traverse
            interface TraverseModule {
                default: typeof traverse;
            }
            const traverseFn = (typeof traverse === 'function' ? traverse : (traverse as unknown as TraverseModule).default);

            const visitor: Visitor = {
                // Visit Variable Declarations: const x = 10 -> const x = __spy(10, line)
                VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
                    const init = path.node.init as (t.Expression & Instrumented) | null;
                    if (init && !init._instrumented) {
                        // Skip simple literals (e.g. const a = 2) as they are obvious
                        if (
                            t.isNumericLiteral(init) ||
                            t.isStringLiteral(init) ||
                            t.isBooleanLiteral(init) ||
                            t.isNullLiteral(init) ||
                            t.isRegExpLiteral(init)
                        ) {
                            return;
                        }

                        const line = path.node.loc?.start.line;
                        if (line) {
                            const spyExpr = t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                [init, t.numericLiteral(line), t.stringLiteral('spy')]
                            );
                            (spyExpr as Instrumented)._instrumented = true;
                            path.node.init = spyExpr;
                        }
                    }
                },
                // Visit Assignments: x = 20 -> x = __spy(20, line)
                AssignmentExpression(path: NodePath<t.AssignmentExpression>) {
                    const node = path.node as t.AssignmentExpression & Instrumented;
                    if (!node._instrumented) {
                        // Skip simple literals
                        if (
                            t.isNumericLiteral(node.right) ||
                            t.isStringLiteral(node.right) ||
                            t.isBooleanLiteral(node.right) ||
                            t.isNullLiteral(node.right) ||
                            t.isRegExpLiteral(node.right)
                        ) {
                            return;
                        }

                        const line = node.loc?.start.line;
                        if (line) {
                            const spyExpr = t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                [node.right, t.numericLiteral(line), t.stringLiteral('spy')]
                            );
                            (spyExpr as Instrumented)._instrumented = true;
                            node.right = spyExpr;
                            node._instrumented = true;
                        }
                    }
                },
                // Visit Console Logs: console.log(x) -> console.log(__spy(x, line))
                CallExpression(path: NodePath<t.CallExpression>) {
                    const node = path.node as t.CallExpression & Instrumented;
                    if (
                        !node._instrumented &&
                        t.isMemberExpression(node.callee) &&
                        t.isIdentifier(node.callee.object, { name: 'console' }) &&
                        (
                            t.isIdentifier(node.callee.property, { name: 'log' }) ||
                            t.isIdentifier(node.callee.property, { name: 'info' }) ||
                            t.isIdentifier(node.callee.property, { name: 'warn' }) ||
                            t.isIdentifier(node.callee.property, { name: 'error' })
                        )
                    ) {
                        const line = node.loc?.start.line;
                        if (line) {
                            node.arguments = node.arguments.map((arg) => {
                                if (t.isExpression(arg) || t.isSpreadElement(arg)) {
                                    const spy = t.callExpression(
                                        t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                        [arg as t.Expression, t.numericLiteral(line), t.stringLiteral('log')]
                                    );
                                    (spy as Instrumented)._instrumented = true;
                                    return spy;
                                }
                                return arg;
                            });
                            node._instrumented = true;
                        }
                    }
                },
                // Visit Expression Statements: 2 + 2 -> __spy(2 + 2, line)
                ExpressionStatement(path: NodePath<t.ExpressionStatement>) {
                    const node = path.node as t.ExpressionStatement & Instrumented;
                    if (node._instrumented) return;
                    const line = node.loc?.start.line;
                    if (line && node.expression) {
                        // Skip if it's already a console.log, assignment or __coverage (handled elsewhere)
                        if (
                            t.isAssignmentExpression(node.expression) ||
                            (t.isCallExpression(node.expression) &&
                                t.isMemberExpression(node.expression.callee) &&
                                t.isIdentifier(node.expression.callee.object, { name: 'console' })) ||
                            (t.isCallExpression(node.expression) &&
                                t.isMemberExpression(node.expression.callee) &&
                                t.isIdentifier(node.expression.callee.property, { name: '__coverage' }))
                        ) {
                            return;
                        }

                        // Also skip 'use strict' directives
                        if (t.isStringLiteral(node.expression) && node.expression.value === 'use strict') {
                            return;
                        }

                        const spyExpr = t.callExpression(
                            t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                            [node.expression, t.numericLiteral(line), t.stringLiteral('spy')]
                        );
                        (spyExpr as Instrumented)._instrumented = true;
                        node.expression = spyExpr;
                        node._instrumented = true;
                    }
                },
                // Coverage Instrumentation: Use Statement visitor but avoid recursion
                Statement(path: NodePath<t.Statement>) {
                    const node = path.node as t.Statement & Instrumented;
                    if (node._instrumented || t.isBlockStatement(node) || t.isProgram(node)) return;

                    const line = node.loc?.start.line;
                    if (line) {
                        const coverageNode = t.expressionStatement(
                            t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__coverage')),
                                [t.numericLiteral(line)]
                            )
                        );
                        (coverageNode as Instrumented)._instrumented = true;
                        path.insertBefore(coverageNode);
                        node._instrumented = true;
                    }
                },
                // Visit Return Statements: return x -> return __spy(x, line)
                ReturnStatement(path: NodePath<t.ReturnStatement>) {
                    const arg = path.node.argument as (t.Expression & Instrumented) | null;
                    if (arg && !arg._instrumented) {
                        const line = path.node.loc?.start.line;
                        if (line) {
                            const spyExpr = t.callExpression(
                                t.memberExpression(t.identifier('global'), t.identifier('__spy')),
                                [arg, t.numericLiteral(line), t.stringLiteral('spy')]
                            );
                            (spyExpr as Instrumented)._instrumented = true;
                            path.node.argument = spyExpr;
                        }
                    }
                }
            };

            traverseFn(ast, visitor);

            // Handle ESM/CJS interop for generate
            interface GenerateModule {
                default: typeof generate;
            }
            const generateFn = (typeof generate === 'function' ? generate : (generate as unknown as GenerateModule).default);

            const output = generateFn(ast, {}, code);
            return output.code;
        } catch (err: unknown) {
            interface BabelError {
                code?: string;
                message?: string;
            }
            const error = err as BabelError;
            // Squelch syntax errors to avoid terminal spam during live typing
            if (error.code === 'BABEL_PARSER_SYNTAX_ERROR' || error.message?.includes('SyntaxError')) {
                // Just return original code, no noise
                return code;
            }

            // For other errors, log a one-liner
            console.warn(`[Instrumenter] Failed to instrument code: ${error.message ?? String(err)}`);
            return code; // Fallback to original code
        }
    }
}
