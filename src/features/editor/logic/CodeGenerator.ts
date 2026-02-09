import { parse, print, types } from 'recast';
import * as parser from '@babel/parser';
import type { Edge } from '@xyflow/react';
import type { AppNode } from '../types';
import type {
    Expression,
    Statement,
    CallExpression,
    IfStatement,
    SwitchStatement,
    WhileStatement,
    ForStatement,
    VariableDeclaration,
    Pattern,
    File as BabelFile,
    ExpressionStatement
} from '@babel/types';

const b = types.builders;

interface GeneratorContext {
    nodes: AppNode[];
    edges: Edge[];
    connections: Record<string, Record<string, string>>;
    varNodeMap: Record<string, string>;
    varValueMap: Record<string, unknown>;
    varLabelToId: Record<string, string>;
    callOverrideMap: Record<string, Record<number, string>>;
    nodesToPrune: Set<string>;
    ast: BabelFile;
    body: Statement[];
    standaloneCalls: Record<string, Expression>;
}

function isLiteral(node: Expression | Pattern | Statement): boolean {
    return (
        node.type === 'NumericLiteral' ||
        node.type === 'StringLiteral' ||
        node.type === 'BooleanLiteral' ||
        (node.type as string) === 'Literal'
    );
}

function createLiteral(val: unknown): Expression {
    if (typeof val === 'number') {
        return b.numericLiteral(val) as unknown as Expression;
    } else if (typeof val === 'boolean') {
        return b.booleanLiteral(val) as unknown as Expression;
    } else if (typeof val === 'string') {
        if (!isNaN(Number(val)) && val.trim() !== '') {
            return b.numericLiteral(Number(val)) as unknown as Expression;
        } else if (val === 'true' || val === 'false') {
            return b.booleanLiteral(val === 'true') as unknown as Expression;
        } else {
            return b.stringLiteral(val) as unknown as Expression;
        }
    }
    return b.identifier('undefined') as unknown as Expression;
}

function createExpression(op: string, left: Expression | Pattern, right: Expression): Expression {
    const isLogical = op === '&&' || op === '||' || op === '??';
    if (isLogical) {
        return b.logicalExpression(op as any, left as any, right as any) as unknown as Expression;
    }
    return b.binaryExpression(op as any, left as any, right as any) as unknown as Expression;
}

export const generateCodeFromFlow = (
    currentCode: string,
    nodes: AppNode[],
    edges: Edge[]
) => {
    try {
        const ast = parse(currentCode, {
            parser: {
                parse: (source: string) => parser.parse(source, {
                    sourceType: 'module',
                    plugins: ['typescript', 'jsx'],
                    tokens: true
                })
            }
        }) as BabelFile;

        const ctx: GeneratorContext = {
            nodes,
            edges,
            connections: buildConnectionsMap(edges),
            varNodeMap: {},
            varValueMap: {},
            varLabelToId: {},
            callOverrideMap: {},
            nodesToPrune: new Set<string>(),
            ast,
            body: ast.program.body as Statement[],
            standaloneCalls: {}
        };

        initializeDataMaps(ctx);
        ctx.standaloneCalls = getStandaloneCalls(ctx.body);

        reorganizeASTBasedOnFlow(ctx);
        pruneASTBody(ctx);
        visitFlowAST(ctx);

        return print(ast).code;
    } catch (err) {
        console.error("Generation error:", err);
        return currentCode;
    }
};

function buildConnectionsMap(edges: Edge[]): Record<string, Record<string, string>> {
    const connections: Record<string, Record<string, string>> = {};
    edges.forEach(edge => {
        if (!connections[edge.target]) {
            connections[edge.target] = {};
        }
        if (edge.targetHandle) {
            connections[edge.target][edge.targetHandle] = edge.source;
        }
    });
    return connections;
}

function initializeDataMaps(ctx: GeneratorContext) {
    ctx.nodes.forEach((n: AppNode) => {
        const data = n.data;
        if (n.type === 'variableNode') {
            const label = data.label!;
            ctx.varNodeMap[n.id] = label;
            ctx.varLabelToId[label] = n.id;

            if (data.value !== undefined) {
                ctx.varValueMap[n.id] = data.value;
                ctx.varValueMap[label] = data.value;
            }
        } else if (n.type === 'literalNode') {
            ctx.varValueMap[n.id] = data.value;
        } else if (n.type === 'functionCallNode') {
            if (data.connectedValues) {
                ctx.callOverrideMap[n.id] = data.connectedValues as Record<number, string>;
            }
        }
    });
}

function getStandaloneCalls(body: Statement[]): Record<string, Expression> {
    const standaloneCalls: Record<string, Expression> = {};
    body.forEach((statement: Statement, index: number) => {
        if (statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression') {
            standaloneCalls[`call-exec-${index}`] = statement.expression;
        }
    });
    return standaloneCalls;
}

function reorganizeASTBasedOnFlow(ctx: GeneratorContext) {
    const flowConnections: { source: string, target: string, handle: string }[] = [];
    ctx.edges.forEach(e => {
        if (e.sourceHandle && (e.sourceHandle.startsWith('flow-') || e.sourceHandle.startsWith('case-'))) {
            flowConnections.push({ source: e.source, target: e.target, handle: e.sourceHandle });
        }
    });

    const getTargetIndex = (targetId: string): number => {
        const prefixes = ['call-exec-', 'if-', 'switch-', 'while-', 'for-'];
        for (const prefix of prefixes) {
            if (targetId.startsWith(prefix)) return parseInt(targetId.replace(prefix, ''));
        }
        return -1;
    };

    ctx.nodes.forEach((n: AppNode) => {
        if (n.type === 'ifNode') {
            const index = parseInt(n.id.replace('if-', ''));
            const ifStmt = ctx.body[index] as IfStatement | undefined;
            if (ifStmt?.type === 'IfStatement') {
                const moveBlock = (handle: 'flow-true' | 'flow-false', targetBlock: 'consequent' | 'alternate') => {
                    const conn = flowConnections.find(c => c.source === n.id && c.handle === handle);
                    if (conn) {
                        const targetIndex = getTargetIndex(conn.target);
                        if (targetIndex !== -1 && ctx.body[targetIndex]) {
                            const targetStmt = ctx.body[targetIndex];
                            if (targetBlock === 'consequent') {
                                ifStmt.consequent = b.blockStatement([targetStmt as any]) as any;
                            } else {
                                ifStmt.alternate = b.blockStatement([targetStmt as any]) as any;
                            }
                            ctx.nodesToPrune.add(conn.target);
                        }
                    }
                };
                moveBlock('flow-true', 'consequent');
                moveBlock('flow-false', 'alternate');
            }
        } else if (n.type === 'switchNode') {
            const index = parseInt(n.id.replace('switch-', ''));
            const switchStmt = ctx.body[index] as SwitchStatement | undefined;
            if (switchStmt?.type === 'SwitchStatement') {
                const cases = (n.data.cases as string[]) || [];
                cases.forEach((_: string, i: number) => {
                    const conn = flowConnections.find(c => c.source === n.id && c.handle === `case-${i}`);
                    if (conn) {
                        const targetIndex = getTargetIndex(conn.target);
                        if (targetIndex !== -1 && ctx.body[targetIndex] && switchStmt.cases[i]) {
                            switchStmt.cases[i].consequent = [ctx.body[targetIndex] as any, b.breakStatement() as any];
                            ctx.nodesToPrune.add(conn.target);
                        }
                    }
                });
            }
        } else if (n.type === 'whileNode' || n.type === 'forNode') {
            const prefix = n.type === 'whileNode' ? 'while-' : 'for-';
            const index = parseInt(n.id.replace(prefix, ''));
            const stmt = ctx.body[index] as WhileStatement | ForStatement | undefined;
            if (stmt && (stmt.type === 'WhileStatement' || stmt.type === 'ForStatement')) {
                const conn = flowConnections.find(c => c.source === n.id && c.handle === 'flow-body');
                if (conn) {
                    const targetIndex = getTargetIndex(conn.target);
                    if (targetIndex !== -1 && ctx.body[targetIndex]) {
                        stmt.body = b.blockStatement([ctx.body[targetIndex] as any]) as any;
                        ctx.nodesToPrune.add(conn.target);
                    }
                }
            }
        }
    });
}

function pruneASTBody(ctx: GeneratorContext) {
    const prefixes = ['call-exec-', 'if-', 'switch-', 'while-', 'for-'];
    ctx.ast.program.body = (ctx.ast.program.body as Statement[]).filter((_: Statement, i: number) => {
        return !prefixes.some(prefix => ctx.nodesToPrune.has(`${prefix}${i}`));
    });
}

function visitFlowAST(ctx: GeneratorContext) {
    types.visit(ctx.ast, {
        visitFunctionDeclaration(path: any) {
            const funcDecl = path.node;
            if (!funcDecl.id) {
                this.traverse(path);
                return false;
            }
            const funcName = funcDecl.id.name;
            const node = ctx.nodes.find(n => n.type === 'functionCallNode' && n.data.isDecl && n.data.label === `Definition: ${funcName}`);

            if (node && node.data.isAsync !== undefined) {
                funcDecl.async = node.data.isAsync;
            }

            this.traverse(path);
            return false;
        },

        visitIfStatement(path: any) {
            const ifStmt = path.node as IfStatement;
            const index = ctx.body.indexOf(ifStmt);
            const ifNodeId = `if-${index}`;

            const node = ctx.nodes.find(n => n.id === ifNodeId);
            if (node) {
                const conditionSourceId = ctx.connections[ifNodeId]?.condition;
                if (conditionSourceId) {
                    if (ctx.varNodeMap[conditionSourceId]) {
                        ifStmt.test = b.identifier(ctx.varNodeMap[conditionSourceId]) as unknown as Expression;
                    } else if (conditionSourceId.startsWith('logic-')) {
                        const logicNode = ctx.nodes.find(n => n.id === conditionSourceId);
                        if (logicNode) {
                            const op = logicNode.data.op as string;
                            let left: Expression = b.identifier('undefined') as unknown as Expression;
                            let right: Expression = b.identifier('undefined') as unknown as Expression;

                            const leftSource = ctx.connections[logicNode.id]?.['input-a'];
                            const rightSource = ctx.connections[logicNode.id]?.['input-b'];

                            if (leftSource) {
                                if (ctx.varNodeMap[leftSource]) left = b.identifier(ctx.varNodeMap[leftSource]) as unknown as Expression;
                                else if (ctx.varValueMap[leftSource] !== undefined) left = createLiteral(ctx.varValueMap[leftSource]);
                            }

                            if (rightSource) {
                                if (ctx.varNodeMap[rightSource]) right = b.identifier(ctx.varNodeMap[rightSource]) as unknown as Expression;
                                else if (ctx.varValueMap[rightSource] !== undefined) right = createLiteral(ctx.varValueMap[rightSource]);
                            }

                            ifStmt.test = createExpression(op, left, right);
                            ctx.nodesToPrune.add(conditionSourceId);
                        }
                    }
                }
            }

            this.traverse(path);
            return false;
        },

        visitSwitchStatement(path: any) {
            const switchStmt = path.node as SwitchStatement;
            const index = ctx.body.indexOf(switchStmt);
            const nodeId = `switch-${index}`;
            const node = ctx.nodes.find(n => n.id === nodeId);

            if (node) {
                const discSourceId = ctx.connections[nodeId]?.discriminant;
                if (discSourceId) {
                    if (ctx.varNodeMap[discSourceId]) {
                        switchStmt.discriminant = b.identifier(ctx.varNodeMap[discSourceId]) as unknown as Expression;
                    } else if (ctx.varValueMap[discSourceId] !== undefined) {
                        switchStmt.discriminant = createLiteral(ctx.varValueMap[discSourceId]);
                    }
                }
            }
            this.traverse(path);
            return false;
        },

        visitWhileStatement(path: any) {
            const whileStmt = path.node as WhileStatement;
            const index = ctx.body.indexOf(whileStmt);
            const nodeId = `while-${index}`;
            const node = ctx.nodes.find(n => n.id === nodeId);

            if (node) {
                const conditionSourceId = ctx.connections[nodeId]?.condition;
                if (conditionSourceId) {
                    if (ctx.varNodeMap[conditionSourceId]) {
                        whileStmt.test = b.identifier(ctx.varNodeMap[conditionSourceId]) as unknown as Expression;
                    } else if (conditionSourceId.startsWith('logic-')) {
                        const logicNode = ctx.nodes.find(n => n.id === conditionSourceId);
                        if (logicNode) {
                            const op = logicNode.data.op as string;
                            let left: Expression = b.identifier('undefined') as unknown as Expression;
                            let right: Expression = b.identifier('undefined') as unknown as Expression;

                            const leftSource = ctx.connections[logicNode.id]?.['input-a'];
                            const rightSource = ctx.connections[logicNode.id]?.['input-b'];

                            if (leftSource) {
                                if (ctx.varNodeMap[leftSource]) left = b.identifier(ctx.varNodeMap[leftSource]) as unknown as Expression;
                                else if (ctx.varValueMap[leftSource] !== undefined) left = createLiteral(ctx.varValueMap[leftSource]);
                            }

                            if (rightSource) {
                                if (ctx.varNodeMap[rightSource]) right = b.identifier(ctx.varNodeMap[rightSource]) as unknown as Expression;
                                else if (ctx.varValueMap[rightSource] !== undefined) right = createLiteral(ctx.varValueMap[rightSource]);
                            }

                            whileStmt.test = createExpression(op, left, right);
                            ctx.nodesToPrune.add(conditionSourceId);
                        }
                    }
                }
            }
            this.traverse(path);
            return false;
        },

        visitForStatement(path: any) {
            const forStmt = path.node as ForStatement;
            const index = ctx.body.indexOf(forStmt);
            const nodeId = `for-${index}`;
            const node = ctx.nodes.find(n => n.id === nodeId);

            if (node) {
                const initSourceId = ctx.connections[nodeId]?.init;
                if (initSourceId) {
                    if (ctx.varNodeMap[initSourceId]) {
                        const varName = ctx.varNodeMap[initSourceId];
                        if (forStmt.init?.type === 'VariableDeclaration') {
                            const decl = forStmt.init.declarations[0];
                            if (decl.id.type === 'Identifier') {
                                decl.id.name = varName;
                                if (ctx.varValueMap[initSourceId] !== undefined) {
                                    decl.init = createLiteral(ctx.varValueMap[initSourceId]);
                                }
                            }
                        }
                    }
                }

                const testSourceId = ctx.connections[nodeId]?.test;
                if (testSourceId) {
                    if (ctx.varNodeMap[testSourceId]) {
                        forStmt.test = b.identifier(ctx.varNodeMap[testSourceId]) as unknown as Expression;
                    } else if (testSourceId.startsWith('logic-')) {
                        const logicNode = ctx.nodes.find(n => n.id === testSourceId);
                        if (logicNode) {
                            const op = logicNode.data.op as string;
                            let left: Expression = b.identifier('undefined') as unknown as Expression;
                            let right: Expression = b.identifier('undefined') as unknown as Expression;
                            const leftSource = ctx.connections[logicNode.id]?.['input-a'];
                            const rightSource = ctx.connections[logicNode.id]?.['input-b'];

                            if (leftSource) {
                                if (ctx.varNodeMap[leftSource]) left = b.identifier(ctx.varNodeMap[leftSource]) as unknown as Expression;
                                else if (ctx.varValueMap[leftSource] !== undefined) left = createLiteral(ctx.varValueMap[leftSource]);
                            }

                            if (rightSource) {
                                if (ctx.varNodeMap[rightSource]) right = b.identifier(ctx.varNodeMap[rightSource]) as unknown as Expression;
                                else if (ctx.varValueMap[rightSource] !== undefined) right = createLiteral(ctx.varValueMap[rightSource]);
                            }

                            forStmt.test = createExpression(op, left, right);
                            ctx.nodesToPrune.add(testSourceId);
                        }
                    }
                }
            }
            this.traverse(path);
            return false;
        },

        visitVariableDeclaration(path: any) {
            const varDecl = path.node as VariableDeclaration;
            const decl = varDecl.declarations[0];

            if (decl.id.type === 'ObjectPattern' || decl.id.type === 'ArrayPattern') {
                return false;
            }

            if (decl.id.type !== 'Identifier') return false;

            const varName = decl.id.name;
            const nodeId = ctx.varLabelToId[varName];

            if (!nodeId) return false;

            const node = ctx.nodes.find(n => n.id === nodeId);
            if (node && node.data.typeAnnotation) {
                const typeStr = node.data.typeAnnotation;
                let typeNode;
                if (typeStr === 'string') typeNode = b.tsStringKeyword();
                else if (typeStr === 'number') typeNode = b.tsNumberKeyword();
                else if (typeStr === 'boolean') typeNode = b.tsBooleanKeyword();
                else if (typeStr === 'any') typeNode = b.tsAnyKeyword();
                else if (typeStr === 'unknown') typeNode = b.tsUnknownKeyword();
                else if (typeStr === 'void') typeNode = b.tsVoidKeyword();
                else typeNode = b.tsTypeReference(b.identifier(typeStr));

                (decl.id as any).typeAnnotation = b.tsTypeAnnotation(typeNode as any) as any;
            }

            const nodeConns = ctx.connections[nodeId] ?? {};
            const logicSourceId = Object.values(nodeConns).find(source => source?.startsWith('logic-'));
            const destrSourceId = Object.values(nodeConns).find(source => source?.startsWith('param-destr') || source?.includes('destr'));

            if (logicSourceId) {
                const logicNode = ctx.nodes.find(n => n.id === logicSourceId);
                if (logicNode) {
                    const op = logicNode.data.op as string;
                    let left: Expression = b.identifier('undefined') as unknown as Expression;
                    let right: Expression = b.identifier('undefined') as unknown as Expression;

                    const leftSource = ctx.connections[logicNode.id]?.['input-a'];
                    const rightSource = ctx.connections[logicNode.id]?.['input-b'];

                    if (leftSource) {
                        if (ctx.varNodeMap[leftSource]) left = b.identifier(ctx.varNodeMap[leftSource]) as unknown as Expression;
                        else if (ctx.varValueMap[leftSource] !== undefined) left = createLiteral(ctx.varValueMap[leftSource]);
                    }

                    if (rightSource) {
                        if (ctx.varNodeMap[rightSource]) right = b.identifier(ctx.varNodeMap[rightSource]) as unknown as Expression;
                        else if (ctx.varValueMap[rightSource] !== undefined) right = createLiteral(ctx.varValueMap[rightSource]);
                    }

                    decl.init = createExpression(op, left, right);
                }
            } else if (destrSourceId) {
                // Handled elsewhere
            } else if (decl.init?.type === 'CallExpression') {
                updateCallArguments(decl.init, nodeId, ctx);
            } else if (!decl.init || isLiteral(decl.init)) {
                const newValue = ctx.varValueMap[varName] ?? ctx.varValueMap[nodeId];
                if (newValue !== undefined && newValue !== '(computed)') {
                    decl.init = createLiteral(newValue);
                }
            }
            return false;
        },

        visitExpressionStatement(path: any) {
            const exprStmt = path.node as ExpressionStatement;
            const index = ctx.body.indexOf(exprStmt);
            if (exprStmt.expression.type === 'CallExpression') {
                const callNodeId = `call-exec-${index}`;
                updateCallArguments(exprStmt.expression, callNodeId, ctx);

                const node = ctx.nodes.find(n => n.id === callNodeId);
                if (node && node.data.isAwait) {
                    exprStmt.expression = b.awaitExpression(exprStmt.expression as any) as unknown as Expression;
                }
            } else if (exprStmt.expression.type === 'AwaitExpression' && exprStmt.expression.argument.type === 'CallExpression') {
                const callNodeId = `call-exec-${index}`;
                updateCallArguments(exprStmt.expression.argument as CallExpression, callNodeId, ctx);

                const node = ctx.nodes.find(n => n.id === callNodeId);
                if (node && node.data.isAwait === false) {
                    exprStmt.expression = exprStmt.expression.argument as any;
                }
            } else if (exprStmt.expression.type === 'BinaryExpression' || exprStmt.expression.type === 'LogicalExpression') {
                const logicNodeId = `logic-${index}`;
                const node = ctx.nodes.find(n => n.id === logicNodeId);

                if (node && node.data.op) {
                    const op = node.data.op as string;
                    let left = exprStmt.expression.left as Expression;
                    let right = exprStmt.expression.right as Expression;

                    const updateOperand = (handleId: 'input-a' | 'input-b', current: Expression) => {
                        const sourceId = ctx.connections[logicNodeId]?.[handleId];
                        if (sourceId) {
                            if (ctx.varNodeMap[sourceId]) return b.identifier(ctx.varNodeMap[sourceId]) as unknown as Expression;
                            if (ctx.varValueMap[sourceId] !== undefined) return createLiteral(ctx.varValueMap[sourceId]);
                        }
                        return current;
                    };

                    left = updateOperand('input-a', left);
                    right = updateOperand('input-b', right);
                    exprStmt.expression = createExpression(op, left, right);
                }
            }
            return false;
        }
    });
}

function updateCallArguments(
    callExpr: CallExpression,
    parentId: string,
    ctx: GeneratorContext
) {
    const nodeConns = ctx.connections[parentId] || {};

    const connectionIndices = Object.keys(nodeConns)
        .filter(k => k.startsWith('arg-') || k.startsWith('nested-arg-'))
        .map(k => {
            const match = (/arg-(\d+)/.exec(k)) ?? (/nested-arg-(\d+)/.exec(k));
            return match ? parseInt(match[1]) : -1;
        });

    Object.keys(nodeConns).forEach(k => {
        const match = /arg-(\d+)-nested/.exec(k);
        if (match) connectionIndices.push(parseInt(match[1]));
    });

    const maxArgIndex = connectionIndices.length > 0 ? Math.max(...connectionIndices) : -1;
    const currentArgCount = callExpr.arguments.length;
    const targetArgCount = Math.max(currentArgCount, maxArgIndex + 1);

    for (let i = 0; i < targetArgCount; i++) {
        const isVarNode = parentId.startsWith('var-');
        const handleName = isVarNode ? `nested-arg-${i}` : `arg-${i}`;
        const sourceId = nodeConns[handleName];

        let newArgValue: Expression | null = null;

        if (sourceId) {
            if (ctx.varNodeMap[sourceId]) {
                newArgValue = b.identifier(ctx.varNodeMap[sourceId]) as unknown as Expression;
            } else if (ctx.varValueMap[sourceId] !== undefined) {
                newArgValue = createLiteral(ctx.varValueMap[sourceId]);
            } else if (ctx.standaloneCalls?.[sourceId]) {
                newArgValue = ctx.standaloneCalls[sourceId];
            }
        }

        const overrides = ctx.callOverrideMap[parentId];
        if (!newArgValue && overrides?.[i] !== undefined) {
            newArgValue = createLiteral(overrides[i]);
        }

        if (newArgValue) {
            (callExpr.arguments as any)[i] = newArgValue;
        } else if (i < currentArgCount && (callExpr.arguments[i] as any).type === 'CallExpression') {
            const nestedArg = callExpr.arguments[i] as CallExpression;
            nestedArg.arguments.forEach((_: any, j: number) => {
                const nestedHandleId = `arg-${i}-nested-arg-${j}`;
                const nestedSourceId = nodeConns[nestedHandleId];
                if (nestedSourceId && ctx.varNodeMap[nestedSourceId]) {
                    (nestedArg.arguments as any)[j] = b.identifier(ctx.varNodeMap[nestedSourceId]) as unknown as Expression;
                } else if (nestedSourceId && ctx.varValueMap[nestedSourceId] !== undefined) {
                    (nestedArg.arguments as any)[j] = createLiteral(ctx.varValueMap[nestedSourceId]);
                }
            });
        } else if (i >= currentArgCount) {
            (callExpr.arguments as any)[i] = b.identifier('undefined') as unknown as Expression;
        }
    }
}
