/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { parse, print, types } from 'recast';
import * as parser from '@babel/parser';
import type { Edge } from '@xyflow/react';
import type { AppNode } from '../../../types/store';
import type { Expression, Statement, CallExpression, IfStatement, SwitchStatement, WhileStatement, ForStatement, VariableDeclaration, Pattern } from '@babel/types';

const b = types.builders;

function createExpression(op: string, left: Expression | Pattern, right: Expression): Expression {
    const isLogical = op === '&&' || op === '||' || op === '??';
    if (isLogical) {
        return b.logicalExpression(op as any, left as any, right as any) as Expression;
    }
    return b.binaryExpression(op as any, left as any, right as any) as Expression;
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
        });

        const connections: Record<string, Record<string, string>> = {};
        edges.forEach(edge => {
            if (!connections[edge.target]) {
                connections[edge.target] = {};
            }
            if (edge.targetHandle) {
                connections[edge.target][edge.targetHandle] = edge.source;
            }
        });

        const varNodeMap: Record<string, string> = {};
        const varValueMap: Record<string, unknown> = {};
        const varLabelToId: Record<string, string> = {}; // Reverse map for lookup
        const callOverrideMap: Record<string, Record<number, string>> = {};

        nodes.forEach((n: AppNode) => {
            const data = n.data;
            if (n.type === 'variableNode') {
                const label = data.label!;
                varNodeMap[n.id] = label;
                varLabelToId[label] = n.id;

                if (data.value !== undefined) {
                    varValueMap[n.id] = data.value;
                    varValueMap[label] = data.value;
                }
            } else if (n.type === 'literalNode') {
                varValueMap[n.id] = data.value;
            } else if (n.type === 'functionCallNode') {
                if (data.connectedValues) {
                    callOverrideMap[n.id] = data.connectedValues as Record<number, string>;
                }
            }
        });

        // 1. Identify standalone calls using the EXACT SAME indexing as CodeParser.ts
        const standaloneCalls: Record<string, Expression> = {};
        const body: Statement[] = ast.program.body;
        body.forEach((statement: Statement, index: number) => {
            if (statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression') {
                // This matches CodeParser logic: `call-exec-${index}`
                standaloneCalls[`call-exec-${index}`] = statement.expression;
            }
        });

        const nodesToPrune = new Set<string>();

        // 2. Flow Reconstruction (White Arrows)
        // We need to move statements INTO blocks based on flow connections.

        const reorganizeASTBasedOnFlow = () => {
            const flowConnections: { source: string, target: string, handle: string }[] = [];
            edges.forEach(e => {
                if (e.sourceHandle && (e.sourceHandle.startsWith('flow-') || e.sourceHandle.startsWith('case-'))) {
                    flowConnections.push({ source: e.source, target: e.target, handle: e.sourceHandle });
                }
            });

            // We only support IF nodes as sources for now
            nodes.forEach((n: AppNode) => {
                if (n.type === 'ifNode') {
                    const index = parseInt(n.id.replace('if-', ''));
                    const ifStmt = body[index] as IfStatement | undefined;

                    if (ifStmt?.type === 'IfStatement') {

                        const moveBlock = (handle: 'flow-true' | 'flow-false', targetBlock: 'consequent' | 'alternate') => {
                            const conn = flowConnections.find(c => c.source === n.id && c.handle === handle);
                            if (conn) {
                                const targetId = conn.target;
                                let targetIndex = -1;
                                if (targetId.startsWith('call-exec-')) targetIndex = parseInt(targetId.replace('call-exec-', ''));
                                else if (targetId.startsWith('if-')) targetIndex = parseInt(targetId.replace('if-', ''));
                                else if (targetId.startsWith('switch-')) targetIndex = parseInt(targetId.replace('switch-', ''));
                                else if (targetId.startsWith('while-')) targetIndex = parseInt(targetId.replace('while-', ''));
                                else if (targetId.startsWith('for-')) targetIndex = parseInt(targetId.replace('for-', ''));

                                if (targetIndex !== -1) {
                                    const targetStmt = body[targetIndex];
                                    if (targetStmt) {
                                        if (targetBlock === 'consequent') {
                                            ifStmt.consequent = b.blockStatement([targetStmt as any]) as any;
                                        } else {
                                            ifStmt.alternate = b.blockStatement([targetStmt as any]) as any;
                                        }
                                        nodesToPrune.add(targetId);
                                    }
                                }
                            }
                        };

                        moveBlock('flow-true', 'consequent');
                        moveBlock('flow-false', 'alternate');
                    }
                }
            });

            // Handle Switch Nodes
            nodes.forEach((n: AppNode) => {
                if (n.type === 'switchNode') {
                    const index = parseInt(n.id.replace('switch-', ''));
                    const switchStmt = body[index] as SwitchStatement | undefined;

                    if (switchStmt?.type === 'SwitchStatement') {
                        const cases = (n.data.cases as string[]) || [];
                        cases.forEach((_: string, i: number) => {
                            const handle = `case-${i}`;
                            const conn = flowConnections.find(c => c.source === n.id && c.handle === handle);

                            if (conn) {
                                const targetId = conn.target;
                                let targetIndex = -1;

                                if (targetId.startsWith('call-exec-')) targetIndex = parseInt(targetId.replace('call-exec-', ''));
                                else if (targetId.startsWith('if-')) targetIndex = parseInt(targetId.replace('if-', ''));
                                else if (targetId.startsWith('switch-')) targetIndex = parseInt(targetId.replace('switch-', ''));
                                else if (targetId.startsWith('while-')) targetIndex = parseInt(targetId.replace('while-', ''));
                                else if (targetId.startsWith('for-')) targetIndex = parseInt(targetId.replace('for-', ''));

                                if (targetIndex !== -1) {
                                    const targetStmt = body[targetIndex];
                                    if (targetStmt && switchStmt.cases[i]) {
                                        switchStmt.cases[i].consequent = [targetStmt as any, b.breakStatement() as any];
                                        nodesToPrune.add(targetId);
                                    }
                                }
                            }
                        });
                    }
                }
            });


            // Handle While Nodes
            nodes.forEach((n: AppNode) => {
                if (n.type === 'whileNode') {
                    const index = parseInt(n.id.replace('while-', ''));
                    const whileStmt = body[index] as WhileStatement | undefined;

                    if (whileStmt?.type === 'WhileStatement') {
                        const conn = flowConnections.find(c => c.source === n.id && c.handle === 'flow-body');
                        if (conn) {
                            const targetId = conn.target;
                            let targetIndex = -1;

                            if (targetId.startsWith('call-exec-')) targetIndex = parseInt(targetId.replace('call-exec-', ''));
                            else if (targetId.startsWith('if-')) targetIndex = parseInt(targetId.replace('if-', ''));
                            else if (targetId.startsWith('switch-')) targetIndex = parseInt(targetId.replace('switch-', ''));
                            else if (targetId.startsWith('while-')) targetIndex = parseInt(targetId.replace('while-', ''));

                            if (targetIndex !== -1) {
                                const targetStmt = body[targetIndex];
                                if (targetStmt) {
                                    whileStmt.body = b.blockStatement([targetStmt as any]) as any;
                                    nodesToPrune.add(targetId);
                                }
                            }
                        }
                    }
                }
            });


            // Handle For Nodes
            nodes.forEach((n: AppNode) => {
                if (n.type === 'forNode') {
                    const index = parseInt(n.id.replace('for-', ''));
                    const forStmt = body[index] as ForStatement | undefined;

                    if (forStmt?.type === 'ForStatement') {
                        const conn = flowConnections.find(c => c.source === n.id && c.handle === 'flow-body');
                        if (conn) {
                            const targetId = conn.target;
                            let targetIndex = -1;

                            if (targetId.startsWith('call-exec-')) targetIndex = parseInt(targetId.replace('call-exec-', ''));
                            else if (targetId.startsWith('if-')) targetIndex = parseInt(targetId.replace('if-', ''));
                            else if (targetId.startsWith('switch-')) targetIndex = parseInt(targetId.replace('switch-', ''));
                            else if (targetId.startsWith('while-')) targetIndex = parseInt(targetId.replace('while-', ''));
                            else if (targetId.startsWith('for-')) targetIndex = parseInt(targetId.replace('for-', ''));


                            if (targetIndex !== -1) {
                                const targetStmt = body[targetIndex];
                                if (targetStmt) {
                                    forStmt.body = b.blockStatement([targetStmt as any]) as any;
                                    nodesToPrune.add(targetId);
                                }
                            }
                            nodesToPrune.add(targetId);
                        }
                    }
                }

            });
        };

        reorganizeASTBasedOnFlow();

        // 3. Pruning Pass (Remove moved nodes from root)
        // We can't prune during visit easily without messing up indices for other visits?
        // Actually, 'types.visit' handles modifications well usually. 
        // We will just skip visiting them or remove them in a pre-pass?
        // Let's do a filter on body.

        const currentBody = ast.program.body as Statement[];
        ast.program.body = currentBody.filter((_: Statement, i: number) => {
            // Check if this index corresponds to a pruned ID
            // We have 'call-exec-5' in set.
            const callId = `call-exec-${i}`;
            const ifId = `if-${i}`;
            const switchId = `switch-${i}`;
            const whileId = `while-${i}`;
            const forId = `for-${i}`;
            return !nodesToPrune.has(callId) && !nodesToPrune.has(ifId) && !nodesToPrune.has(switchId) && !nodesToPrune.has(whileId) && !nodesToPrune.has(forId);
        });

        // 4. Main Generation Pass (Visitor)
        types.visit(ast, {
            visitIfStatement(path: any) {
                const ifStmt = path.node as IfStatement;
                const index = body.indexOf(ifStmt);
                const ifNodeId = `if-${index}`;

                const node = nodes.find(n => n.id === ifNodeId);
                if (node) {
                    const conditionSourceId = connections[ifNodeId]?.condition;
                    if (conditionSourceId) {
                        if (varNodeMap[conditionSourceId]) {
                            ifStmt.test = b.identifier(varNodeMap[conditionSourceId]) as any;
                        } else if (conditionSourceId.startsWith('logic-')) {
                            const logicNode = nodes.find(n => n.id === conditionSourceId);
                            if (logicNode) {
                                const op = logicNode.data.op as string;
                                let left: Expression = b.identifier('undefined') as any;
                                let right: Expression = b.identifier('undefined') as any;

                                const leftSource = connections[logicNode.id]?.['input-a'];
                                const rightSource = connections[logicNode.id]?.['input-b'];

                                if (leftSource) {
                                    if (varNodeMap[leftSource]) left = b.identifier(varNodeMap[leftSource]) as any;
                                    else if (varValueMap[leftSource] !== undefined) left = createLiteral(varValueMap[leftSource]);
                                }

                                if (rightSource) {
                                    if (varNodeMap[rightSource]) right = b.identifier(varNodeMap[rightSource]) as any;
                                    else if (varValueMap[rightSource] !== undefined) right = createLiteral(varValueMap[rightSource]);
                                }

                                ifStmt.test = createExpression(op, left, right);
                                nodesToPrune.add(conditionSourceId);
                            }
                        }
                    }
                }

                this.traverse(path);
                return false;
            },

            visitSwitchStatement(path: any) {
                const switchStmt = path.node as SwitchStatement;
                const index = body.indexOf(switchStmt);
                const nodeId = `switch-${index}`;
                const node = nodes.find(n => n.id === nodeId);

                if (node) {
                    const discSourceId = connections[nodeId]?.discriminant;
                    if (discSourceId) {
                        if (varNodeMap[discSourceId]) {
                            switchStmt.discriminant = b.identifier(varNodeMap[discSourceId]) as any;
                        } else if (varValueMap[discSourceId] !== undefined) {
                            switchStmt.discriminant = createLiteral(varValueMap[discSourceId]);
                        }
                    }
                }
                this.traverse(path);
                return false;
            },

            visitWhileStatement(path: any) {
                const whileStmt = path.node as WhileStatement;
                const index = body.indexOf(whileStmt);
                const nodeId = `while-${index}`;
                const node = nodes.find(n => n.id === nodeId);

                if (node) {
                    const conditionSourceId = connections[nodeId]?.condition;
                    if (conditionSourceId) {
                        if (varNodeMap[conditionSourceId]) {
                            whileStmt.test = b.identifier(varNodeMap[conditionSourceId]) as any;
                        } else if (conditionSourceId.startsWith('logic-')) {
                            const logicNode = nodes.find(n => n.id === conditionSourceId);
                            if (logicNode) {
                                const op = logicNode.data.op as string;
                                let left: Expression = b.identifier('undefined') as any;
                                let right: Expression = b.identifier('undefined') as any;

                                const leftSource = connections[logicNode.id]?.['input-a'];
                                const rightSource = connections[logicNode.id]?.['input-b'];

                                if (leftSource) {
                                    if (varNodeMap[leftSource]) left = b.identifier(varNodeMap[leftSource]) as any;
                                    else if (varValueMap[leftSource] !== undefined) left = createLiteral(varValueMap[leftSource]);
                                }

                                if (rightSource) {
                                    if (varNodeMap[rightSource]) right = b.identifier(varNodeMap[rightSource]) as any;
                                    else if (varValueMap[rightSource] !== undefined) right = createLiteral(varValueMap[rightSource]);
                                }

                                whileStmt.test = createExpression(op, left, right);
                                nodesToPrune.add(conditionSourceId);
                            }
                        }
                    }
                }
                this.traverse(path);
                return false;
            },

            visitForStatement(path: any) {
                const forStmt = path.node as ForStatement;
                const index = body.indexOf(forStmt);
                const nodeId = `for-${index}`;
                const node = nodes.find(n => n.id === nodeId);

                if (node) {
                    // 1. Init
                    const initSourceId = connections[nodeId]?.init;
                    if (initSourceId) {
                        if (varNodeMap[initSourceId]) {
                            const varName = varNodeMap[initSourceId];
                            if (forStmt.init?.type === 'VariableDeclaration') {
                                const decl = forStmt.init.declarations[0];
                                if (decl.id.type === 'Identifier') {
                                    decl.id.name = varName;
                                    if (varValueMap[initSourceId] !== undefined) {
                                        decl.init = createLiteral(varValueMap[initSourceId]);
                                    }
                                }
                            }
                        }
                    }

                    // 2. Test
                    const testSourceId = connections[nodeId]?.test;
                    if (testSourceId) {
                        if (varNodeMap[testSourceId]) {
                            forStmt.test = b.identifier(varNodeMap[testSourceId]) as any;
                        } else if (testSourceId.startsWith('logic-')) {
                            const logicNode = nodes.find(n => n.id === testSourceId);
                            if (logicNode) {
                                const op = logicNode.data.op as string;
                                let left: Expression = b.identifier('undefined') as any;
                                let right: Expression = b.identifier('undefined') as any;
                                const leftSource = connections[logicNode.id]?.['input-a'];
                                const rightSource = connections[logicNode.id]?.['input-b'];

                                if (leftSource) {
                                    if (varNodeMap[leftSource]) left = b.identifier(varNodeMap[leftSource]) as any;
                                    else if (varValueMap[leftSource] !== undefined) left = createLiteral(varValueMap[leftSource]);
                                }

                                if (rightSource) {
                                    if (varNodeMap[rightSource]) right = b.identifier(varNodeMap[rightSource]) as any;
                                    else if (varValueMap[rightSource] !== undefined) right = createLiteral(varValueMap[rightSource]);
                                }

                                forStmt.test = createExpression(op, left, right);
                                nodesToPrune.add(testSourceId);
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
                if (decl.id.type !== 'Identifier') return false;

                const varName = decl.id.name;
                const nodeId = varLabelToId[varName]; // Lookup correct ID

                if (!nodeId) return false;

                const node = nodes.find(n => n.id === nodeId);
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

                    (decl.id as any).typeAnnotation = b.tsTypeAnnotation(typeNode);
                }

                if (node && node.data.isExported) {
                    // Check if parent is already an export declaration
                    if (path.parentPath.node.type !== 'ExportNamedDeclaration') {
                        // This might be tricky because visitVariableDeclaration visits the Declaration, 
                        // and we want to wrap it.
                        // However, we should only do this if we are at the top level or within a module.
                    }
                }

                const nodeConns = connections[nodeId] ?? {};
                const logicSourceId = Object.values(nodeConns).find(source => source?.startsWith('logic-'));

                if (logicSourceId) {
                    const logicNode = nodes.find(n => n.id === logicSourceId);
                    if (logicNode) {
                        const op = logicNode.data.op as string;
                        let left: Expression = b.identifier('undefined') as any;
                        let right: Expression = b.identifier('undefined') as any;

                        const leftSource = connections[logicNode.id]?.['input-a'];
                        const rightSource = connections[logicNode.id]?.['input-b'];

                        if (leftSource) {
                            if (varNodeMap[leftSource]) left = b.identifier(varNodeMap[leftSource]) as any;
                            else if (varValueMap[leftSource] !== undefined) left = createLiteral(varValueMap[leftSource]);
                        }

                        if (rightSource) {
                            if (varNodeMap[rightSource]) right = b.identifier(varNodeMap[rightSource]) as any;
                            else if (varValueMap[rightSource] !== undefined) right = createLiteral(varValueMap[rightSource]);
                        }

                        decl.init = createExpression(op, left, right);
                    }
                } else if (decl.init?.type === 'CallExpression') {
                    updateCallArguments(decl.init, nodeId, connections, varNodeMap, varValueMap, undefined, standaloneCalls);
                } else if (!decl.init || isLiteral(decl.init)) {
                    const newValue = varValueMap[varName] ?? varValueMap[nodeId];
                    if (newValue !== undefined && newValue !== '(computed)') {
                        decl.init = createLiteral(newValue);
                    }
                }
                return false;
            },

            visitImportDeclaration(path: any) {
                // For now just keep them, but we could sync specifiers from nodes here
                this.traverse(path);
                return false;
            },

            visitExpressionStatement(path: any) {
                const exprStmt = path.node as t.ExpressionStatement;
                const index = body.indexOf(exprStmt);
                if (exprStmt.expression.type === 'CallExpression') {
                    const callNodeId = `call-exec-${index}`;
                    updateCallArguments(exprStmt.expression, callNodeId, connections, varNodeMap, varValueMap, callOverrideMap[callNodeId], standaloneCalls);
                } else if (exprStmt.expression.type === 'BinaryExpression' || exprStmt.expression.type === 'LogicalExpression') {
                    const logicNodeId = `logic-${index}`;
                    const node = nodes.find(n => n.id === logicNodeId);

                    if (node && node.data.op) {
                        const op = node.data.op as string;
                        let left = exprStmt.expression.left;
                        let right = exprStmt.expression.right;

                        const updateOperand = (handleId: 'input-a' | 'input-b', current: Expression) => {
                            const sourceId = connections[logicNodeId]?.[handleId];
                            if (sourceId) {
                                if (varNodeMap[sourceId]) return b.identifier(varNodeMap[sourceId]) as any;
                                if (varValueMap[sourceId] !== undefined) return createLiteral(varValueMap[sourceId]);
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

        return print(ast).code;
    } catch (err) {
        console.error("Generation error:", err);
        return currentCode;
    }
};

function isLiteral(node: any) {
    return node.type === 'NumericLiteral' || node.type === 'StringLiteral' || node.type === 'BooleanLiteral' || node.type === 'Literal';
}

function createLiteral(val: unknown): Expression {
    if (typeof val === 'number') {
        return b.numericLiteral(val) as any;
    } else if (typeof val === 'boolean') {
        return b.booleanLiteral(val) as any;
    } else if (typeof val === 'string') {
        if (!isNaN(Number(val)) && val.trim() !== '') {
            return b.numericLiteral(Number(val)) as any;
        } else if (val === 'true' || val === 'false') {
            return b.booleanLiteral(val === 'true') as any;
        } else {
            return b.stringLiteral(val) as any;
        }
    }
    return b.identifier('undefined') as any;
}

function updateCallArguments(
    callExpr: CallExpression,
    parentId: string,
    connections: Record<string, Record<string, string>>,
    varMap: Record<string, string>,
    valMap: Record<string, unknown>,
    overrides?: Record<number, string>,
    standaloneCalls?: Record<string, Expression>
) {
    const nodeConns = connections[parentId] || {};

    const connectionIndices = Object.keys(nodeConns)
        .filter(k => k.startsWith('arg-') || k.startsWith('nested-arg-'))
        .map(k => {
            const match = (/arg-(\d+)/.exec(k)) ?? (/nested-arg-(\d+)/.exec(k));
            return match ? parseInt(match[1]) : -1;
        });

    // Check for nested-arg-X style
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
            if (varMap[sourceId]) {
                newArgValue = b.identifier(varMap[sourceId]) as any;
            } else if (valMap[sourceId] !== undefined) {
                newArgValue = createLiteral(valMap[sourceId]);
            } else if (standaloneCalls?.[sourceId]) {
                newArgValue = standaloneCalls[sourceId];
            }
        }

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
                if (nestedSourceId && varMap[nestedSourceId]) {
                    (nestedArg.arguments as any)[j] = b.identifier(varMap[nestedSourceId]) as any;
                } else if (nestedSourceId && valMap[nestedSourceId] !== undefined) {
                    (nestedArg.arguments as any)[j] = createLiteral(valMap[nestedSourceId]);
                }
            });
        } else if (i >= currentArgCount) {
            (callExpr.arguments as any)[i] = b.identifier('undefined') as any;
        }
    }
}
