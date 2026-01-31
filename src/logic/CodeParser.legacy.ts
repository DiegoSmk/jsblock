import { parse } from '@babel/parser';
import type { Node, Edge } from '@xyflow/react';

const EDGE_STYLE_DEFAULT = { strokeWidth: 3 };
const EDGE_STYLE_REF_BASE = { stroke: '#4caf50', strokeWidth: 2, strokeDasharray: '5,5', opacity: 0.8 };

export const parseCodeToFlow = (code: string) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    try {
        const ast = parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx']
        });

        const variableNodes: Record<string, string> = {};
        const functionInfo: Record<string, string[]> = {};
        const declNodes: Record<string, string> = {};
        const usageCount: Record<string, number> = {};

        const trackUsage = (name: string) => {
            usageCount[name] = (usageCount[name] || 0) + 1;
        };

        ast.program.body.forEach(statement => {
            if (statement.type === 'FunctionDeclaration' && statement.id) {
                const funcName = statement.id.name;
                const nodeId = `func-decl-${funcName}`;
                declNodes[funcName] = nodeId;
                functionInfo[funcName] = statement.params.map(p =>
                    p.type === 'Identifier' ? p.name : 'arg'
                );
            }
        });

        const processCall = (expr: any, id: string, parentId?: string) => {
            let callLabel = 'function';
            let argNames: string[] = [];
            const connectedValues: Record<string, string> = {};
            const nestedArgsCall: Record<number, { name: string, args: string[], expression?: string }> = {};

            // Capture the raw expression for runtime evaluation
            const rawExpression = code.slice(expr.start, expr.end);

            if (expr.callee.type === 'Identifier') {
                callLabel = expr.callee.name;
                argNames = functionInfo[callLabel] || expr.arguments.map((_: any, i: number) => `arg${i}`);

                if (declNodes[callLabel]) {
                    trackUsage(callLabel);
                    edges.push({
                        id: `ref-${declNodes[callLabel]}-${id}`,
                        source: declNodes[callLabel],
                        sourceHandle: 'ref-source',
                        target: id,
                        targetHandle: 'ref-target',
                        type: 'step',
                        style: EDGE_STYLE_REF_BASE,
                        animated: false
                    });
                }
            } else if (expr.callee.type === 'MemberExpression') {
                const obj = expr.callee.object.type === 'Identifier' ? expr.callee.object.name : 'obj';
                const prop = expr.callee.property.type === 'Identifier' ? expr.callee.property.name : 'prop';
                callLabel = `${obj}.${prop}`;
                argNames = expr.arguments.map((_: any, i: number) => `arg${i}`);
            }

            expr.arguments.forEach((arg: any, i: number) => {
                if (arg.type === 'Identifier') {
                    connectedValues[i] = arg.name;
                    if (variableNodes[arg.name]) {
                        edges.push({
                            id: `e-${variableNodes[arg.name]}-to-${id}-a${i}`,
                            source: variableNodes[arg.name],
                            sourceHandle: 'output',
                            target: id,
                            targetHandle: `arg-${i}`,
                            animated: true,
                            style: EDGE_STYLE_DEFAULT,
                        });
                    }
                } else if (arg.type === 'NumericLiteral' || arg.type === 'StringLiteral' || arg.type === 'BooleanLiteral') {
                    const literalValue = String(arg.value);
                    const literalType = arg.type === 'NumericLiteral' ? 'number' : (arg.type === 'BooleanLiteral' ? 'boolean' : 'string');
                    const literalNodeId = `literal-${id}-${i}`;

                    nodes.push({
                        id: literalNodeId,
                        type: 'literalNode',
                        data: {
                            label: literalType,
                            value: literalValue,
                            type: literalType
                        },
                        position: { x: 0, y: 0 } // Layout will fix this
                    });

                    edges.push({
                        id: `e-${literalNodeId}-to-${id}-a${i}`,
                        source: literalNodeId,
                        sourceHandle: 'output',
                        target: id,
                        targetHandle: `arg-${i}`,
                        animated: true,
                        style: EDGE_STYLE_DEFAULT,
                    });

                    connectedValues[i] = literalValue;
                } else if (arg.type === 'CallExpression') {
                    // NESTED CALL LOGIC: 
                    // Instead of a separate node, we nest it if it's an argument
                    let innerName = 'func';
                    if (arg.callee.type === 'Identifier') innerName = arg.callee.name;
                    else if (arg.callee.type === 'MemberExpression') {
                        const innerObj = arg.callee.object.type === 'Identifier' ? arg.callee.object.name : 'obj';
                        const innerProp = arg.callee.property.type === 'Identifier' ? arg.callee.property.name : 'prop';
                        innerName = `${innerObj}.${innerProp}`;
                    }

                    const innerArgs = arg.arguments.map((a: any) => {
                        if (a.type === 'Identifier') return a.name;
                        if (a.type === 'NumericLiteral' || a.type === 'StringLiteral') return String(a.value);
                        return '...';
                    });

                    nestedArgsCall[i] = {
                        name: innerName,
                        args: innerArgs,
                        expression: code.slice(arg.start, arg.end)
                    };

                    // Add reference edge for the nested call if definition exists
                    if (declNodes[innerName]) {
                        trackUsage(innerName);
                        edges.push({
                            id: `ref-${declNodes[innerName]}-${id}-arg-${i}`,
                            source: declNodes[innerName],
                            sourceHandle: 'ref-source',
                            target: id,
                            targetHandle: `arg-${i}-ref-target`,
                            type: 'step',
                            style: EDGE_STYLE_REF_BASE,
                            animated: false
                        });
                    }

                    // Create edges for arguments of the nested call
                    arg.arguments.forEach((innerArg: any, j: number) => {
                        if (innerArg.type === 'Identifier' && variableNodes[innerArg.name]) {
                            edges.push({
                                id: `e-${variableNodes[innerArg.name]}-to-${id}-a${i}-n${j}`,
                                source: variableNodes[innerArg.name],
                                sourceHandle: 'output',
                                target: id,
                                targetHandle: `arg-${i}-nested-arg-${j}`,
                                animated: true,
                                style: EDGE_STYLE_DEFAULT,
                            });
                        } else if (innerArg.type === 'NumericLiteral' || innerArg.type === 'StringLiteral' || innerArg.type === 'BooleanLiteral') {
                            const literalValue = String(innerArg.value);
                            const literalType = innerArg.type === 'NumericLiteral' ? 'number' : (innerArg.type === 'BooleanLiteral' ? 'boolean' : 'string');
                            const literalNodeId = `literal-${id}-arg-${i}-nested-${j}`;

                            nodes.push({
                                id: literalNodeId,
                                type: 'literalNode',
                                data: {
                                    label: literalType,
                                    value: literalValue,
                                    type: literalType
                                },
                                position: { x: 0, y: 0 }
                            });

                            edges.push({
                                id: `e-${literalNodeId}-to-${id}-a${i}-n${j}`,
                                source: literalNodeId,
                                sourceHandle: 'output',
                                target: id,
                                targetHandle: `arg-${i}-nested-arg-${j}`,
                                animated: true,
                                style: EDGE_STYLE_DEFAULT,
                            });
                        }
                    });
                }
            });

            nodes.push({
                id,
                type: 'functionCallNode',
                position: { x: 0, y: 0 },
                data: {
                    label: callLabel,
                    args: argNames,
                    connectedValues,
                    nestedArgsCall, // NEW: support for nested calls in arguments
                    hasReturn: true,
                    isStandalone: !parentId,
                    expression: rawExpression // Store for evaluation
                },
            });
        };

        ast.program.body.forEach((statement, index) => {
            // Function Definitions
            if (statement.type === 'FunctionDeclaration' && statement.id) {
                const name = statement.id.name;
                nodes.push({
                    id: declNodes[name],
                    type: 'functionCallNode',
                    position: { x: 0, y: 0 },
                    data: {
                        label: `Definition: ${name}`,
                        args: functionInfo[name],
                        isDecl: true,
                        usageCount: 0
                    },
                });
            }

            // Variable Declarations
            if (statement.type === 'VariableDeclaration') {
                statement.declarations.forEach((decl) => {
                    if (decl.id.type === 'Identifier') {
                        const varName = decl.id.name;
                        const nodeId = `var-${varName}`;
                        variableNodes[varName] = nodeId;

                        if (decl.init?.type === 'CallExpression') {
                            // Extract call details for nested visualization
                            // We do NOT create a separate functionCallNode here
                            // Instead we populate the nestedCall data AND create edges for arguments directly to this node

                            let callLabel = 'function';
                            let argNames: string[] = [];

                            // Determine function name
                            if (decl.init.callee.type === 'Identifier') {
                                callLabel = decl.init.callee.name;
                                // Add reference edge
                                if (declNodes[callLabel]) {
                                    trackUsage(callLabel);
                                    edges.push({
                                        id: `ref-${declNodes[callLabel]}-${nodeId}`,
                                        source: declNodes[callLabel],
                                        sourceHandle: 'ref-source',
                                        target: nodeId,
                                        targetHandle: 'ref-target',
                                        type: 'step',
                                        style: EDGE_STYLE_REF_BASE,
                                        animated: false
                                    });
                                }
                            }

                            // Process arguments to create edges
                            decl.init.arguments.forEach((arg: any, i: number) => {
                                if (arg.type === 'Identifier') {
                                    if (variableNodes[arg.name]) {
                                        edges.push({
                                            id: `e-${variableNodes[arg.name]}-to-${nodeId}-nested-a${i}`,
                                            source: variableNodes[arg.name],
                                            sourceHandle: 'output',
                                            target: nodeId,
                                            targetHandle: `nested-arg-${i}`, // Matches VariableNode handle ID
                                            animated: true,
                                            style: EDGE_STYLE_DEFAULT,
                                        });
                                    }
                                } else if (arg.type === 'CallExpression') {
                                    // Complex nested call inside a nested call? 
                                    // For now, let's treat it as a separate node to avoid infinite recursion complexity in UI
                                    const innerCallId = `${nodeId}-inner-${i}`;
                                    processCall(arg, innerCallId, nodeId);
                                    edges.push({
                                        id: `e-inner-${innerCallId}-to-${nodeId}-nested-a${i}`,
                                        source: innerCallId,
                                        sourceHandle: 'return',
                                        target: nodeId,
                                        targetHandle: `nested-arg-${i}`,
                                        animated: true,
                                        style: EDGE_STYLE_DEFAULT
                                    });
                                }
                            });

                            // Capture arg names for display
                            argNames = decl.init.arguments.map((arg: any) => {
                                if (arg.type === 'Identifier') return arg.name;
                                if (arg.type === 'NumericLiteral' || arg.type === 'StringLiteral') return String(arg.value);
                                return '...';
                            });

                            nodes.push({
                                id: nodeId,
                                type: 'variableNode',
                                position: { x: 0, y: 0 },
                                data: {
                                    label: varName,
                                    value: '(computed)',
                                    nestedCall: {
                                        name: callLabel,
                                        args: argNames
                                    }
                                },
                            });
                        } else {
                            nodes.push({
                                id: nodeId,
                                type: 'variableNode',
                                position: { x: 0, y: 0 },
                                data: { label: varName, value: decl.init ? code.slice(decl.init.start!, decl.init.end!) : '' },
                            });
                        }
                    }
                });
            }

            // Standalone Calls
            if (statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression') {
                processCall(statement.expression, `call-exec-${index}`);
            }

            // Logic Expressions (Standalone)
            if (statement.type === 'ExpressionStatement' &&
                (statement.expression.type === 'BinaryExpression' || statement.expression.type === 'LogicalExpression')) {
                const expr = statement.expression;
                const nodeId = `logic-${index}`;
                const op = expr.operator;

                nodes.push({
                    id: nodeId,
                    type: 'logicNode',
                    position: { x: 0, y: 0 },
                    data: { op }
                });

                // Helper to process operands (A or B)
                const processOperand = (operand: any, handleId: 'input-a' | 'input-b') => {
                    if (operand.type === 'Identifier') {
                        if (variableNodes[operand.name]) {
                            edges.push({
                                id: `e-${variableNodes[operand.name]}-to-${nodeId}-${handleId}`,
                                source: variableNodes[operand.name],
                                sourceHandle: 'output',
                                target: nodeId,
                                targetHandle: handleId,
                                animated: true,
                                style: EDGE_STYLE_DEFAULT
                            });
                        }
                    } else if (operand.type === 'NumericLiteral' || operand.type === 'StringLiteral' || operand.type === 'BooleanLiteral') {
                        const literalValue = String(operand.value);
                        const literalType = operand.type === 'NumericLiteral' ? 'number' : (operand.type === 'BooleanLiteral' ? 'boolean' : 'string');
                        const literalNodeId = `literal-${nodeId}-${handleId}`;

                        nodes.push({
                            id: literalNodeId,
                            type: 'literalNode',
                            data: {
                                label: literalType,
                                value: literalValue,
                                type: literalType
                            },
                            position: { x: 0, y: 0 }
                        });

                        edges.push({
                            id: `e-${literalNodeId}-to-${nodeId}-${handleId}`,
                            source: literalNodeId,
                            sourceHandle: 'output',
                            target: nodeId,
                            targetHandle: handleId,
                            animated: true,
                            style: EDGE_STYLE_DEFAULT
                        });
                    }
                };

                processOperand(expr.left, 'input-a');
                processOperand(expr.right, 'input-b');
                processOperand(expr.left, 'input-a');
                processOperand(expr.right, 'input-b');
            }

            // If Statements
            if (statement.type === 'IfStatement') {
                const nodeId = `if-${index}`;
                nodes.push({
                    id: nodeId,
                    type: 'ifNode',
                    position: { x: 0, y: 0 },
                    data: { label: 'If' }
                });

                // Connect Condition
                // The condition might be a BinaryExpression (LogicNode) or a Variable
                const processCondition = (cond: any) => {
                    // Logic Node connection (reverse lookup would be needed if we don't know the ID)
                    // For MVP simplicity, we check if the condition is a logic expression we just parsed earlier?
                    // Actually, the parser runs linearly. If the condition is an expression, it's nesting.

                    if (cond.type === 'Identifier' && variableNodes[cond.name]) {
                        edges.push({
                            id: `e-${variableNodes[cond.name]}-to-${nodeId}-cond`,
                            source: variableNodes[cond.name],
                            sourceHandle: 'output',
                            target: nodeId,
                            targetHandle: 'condition',
                            animated: true,
                            style: EDGE_STYLE_DEFAULT
                        });
                    } else if (cond.type === 'BinaryExpression' || cond.type === 'LogicalExpression') {
                        // Ideally this would be its own LogicNode, but since it's nested in the IfStatement in AST,
                        // we need to extract it to a LogicNode or render it inline?
                        // Consistent approach: Extract it as a logic node "attached" to this IF
                        const logicNodeId = `logic-nested-${nodeId}`;
                        nodes.push({
                            id: logicNodeId,
                            type: 'logicNode',
                            position: { x: 0, y: 0 },
                            data: { op: cond.operator }
                        });

                        // Create edge from Logic -> If
                        edges.push({
                            id: `e-${logicNodeId}-to-${nodeId}`,
                            source: logicNodeId,
                            sourceHandle: 'result',
                            target: nodeId,
                            targetHandle: 'condition',
                            animated: true,
                            style: EDGE_STYLE_DEFAULT
                        });
                    }
                };

                processCondition(statement.test);

                // --- NEW BLOCK PROCESSING ---
                // Helper to connect children inside blocks to this IF Node
                const processBlock = (block: any, handle: string) => {
                    if (block?.type === 'BlockStatement') {
                        block.body.forEach((childStmt: any) => {
                            // We are looking for statements that became nodes
                            // BUT 'index' based IDs are fragile here because 'body.indexOf' refers to root body.
                            // Child statements are NOT in the root body list.

                            // CRITICAL: Our current architecture relies on a flat list of nodes derived from a flat list of statements.
                            // Nested statements are NOT being converted to Nodes by the main loop.

                            // FIX: Check if child is a CallExpression (common case) and handle it manually here?
                            // OR should the main parser be recursive? recursion is better.

                            // For this immediate fixes request (Console Log not showing):
                            if (childStmt.type === 'ExpressionStatement' && childStmt.expression.type === 'CallExpression') {
                                // Generate a unique ID for this nested call
                                const nestedId = `call-nested-${Math.random().toString(36).substr(2, 6)}`;

                                // Create the Node
                                processCall(childStmt.expression, nestedId);

                                // Connect it to the IF Block flow
                                edges.push({
                                    id: `e-${nodeId}-${handle}-${nestedId}`,
                                    source: nodeId,
                                    sourceHandle: handle, // flow-true or flow-false
                                    target: nestedId,
                                    targetHandle: 'flow-in',
                                    style: EDGE_STYLE_DEFAULT,
                                    animated: true
                                });
                            }
                        });
                    }
                };

                processBlock(statement.consequent, 'flow-true');
                processBlock(statement.alternate, 'flow-false');
                // -----------------------------
            }

            // Switch Statements
            if (statement.type === 'SwitchStatement') {
                const nodeId = `switch-${index}`;
                const cases = statement.cases.map((c: any) => {
                    // Get case label (value)
                    if (c.test) {
                        if (c.test.type === 'NumericLiteral' || c.test.type === 'StringLiteral') {
                            return String(c.test.value);
                        }
                        return 'case';
                    }
                    return 'default';
                });

                nodes.push({
                    id: nodeId,
                    type: 'switchNode',
                    position: { x: 0, y: 0 },
                    data: { label: 'Switch', cases }
                });

                // Connect Discriminant
                const disc = statement.discriminant;
                if (disc.type === 'Identifier' && variableNodes[disc.name]) {
                    edges.push({
                        id: `e-${variableNodes[disc.name]}-to-${nodeId}-disc`,
                        source: variableNodes[disc.name],
                        sourceHandle: 'output',
                        target: nodeId,
                        targetHandle: 'discriminant',
                        animated: true,
                        style: EDGE_STYLE_DEFAULT
                    });
                }

                // --- NEW BLOCK PROCESSING REUSE (Switch Cases) ---
                const processBlock = (stmtList: any[], handle: string) => {
                    stmtList.forEach((childStmt: any) => {
                        if (childStmt.type === 'ExpressionStatement' && childStmt.expression.type === 'CallExpression') {
                            const nestedId = `call-nested-${Math.random().toString(36).substr(2, 6)}`;
                            processCall(childStmt.expression, nestedId);
                            edges.push({
                                id: `e-${nodeId}-${handle}-${nestedId}`,
                                source: nodeId,
                                sourceHandle: handle,
                                target: nestedId,
                                targetHandle: 'flow-in',
                                style: EDGE_STYLE_DEFAULT,
                                animated: true
                            });
                        }
                    });
                };

                statement.cases.forEach((c: any, i: number) => {
                    // 'consequent' in SwitchCase is an array of statements, not a BlockStatement
                    const caseHandle = c.test ? `case-${i}` : 'default';
                    // Wait, our Switch Node creates handles based on index in 'cases' array.
                    // If c.test is null, it's default.

                    // We need to match the handle ID created in SwitchNode?
                    // SwitchNode uses `case-${i}` for all entries in 'cases' array.
                    const handleId = `case-${i}`;

                    if (c.consequent && c.consequent.length > 0) {
                        processBlock(c.consequent, handleId);
                    }
                });
                // -----------------------------
            }

            // While Statements
            if (statement.type === 'WhileStatement') {
                const nodeId = `while-${index}`;
                nodes.push({
                    id: nodeId,
                    type: 'whileNode',
                    position: { x: 0, y: 0 },
                    data: { label: 'While' }
                });

                const processCondition = (cond: any) => {
                    if (cond.type === 'Identifier' && variableNodes[cond.name]) {
                        edges.push({
                            id: `e-${variableNodes[cond.name]}-to-${nodeId}-cond`,
                            source: variableNodes[cond.name],
                            sourceHandle: 'output',
                            target: nodeId,
                            targetHandle: 'condition',
                            animated: true,
                            style: EDGE_STYLE_DEFAULT
                        });
                    } else if (cond.type === 'BinaryExpression' || cond.type === 'LogicalExpression') {
                        const logicNodeId = `logic-nested-${nodeId}`;
                        nodes.push({
                            id: logicNodeId,
                            type: 'logicNode',
                            position: { x: 0, y: 0 },
                            data: { op: cond.operator }
                        });

                        // 3. Connect Left/Right Operands (Similar to For Loop)
                        const processOperand = (operand: any, handle: 'input-a' | 'input-b') => {
                            if (operand.type === 'Identifier' && variableNodes[operand.name]) {
                                edges.push({
                                    id: `e-${variableNodes[operand.name]}-to-${logicNodeId}-${handle}`,
                                    source: variableNodes[operand.name],
                                    sourceHandle: 'output',
                                    target: logicNodeId,
                                    targetHandle: handle,
                                    style: EDGE_STYLE_DEFAULT
                                });
                            } else if (operand.type === 'NumericLiteral' || operand.type === 'StringLiteral' || operand.type === 'BooleanLiteral') {
                                const litId = `lit-${logicNodeId}-${handle}`;
                                nodes.push({
                                    id: litId,
                                    type: 'literalNode',
                                    position: { x: 0, y: 0 },
                                    data: { label: typeof operand.value, value: String(operand.value) }
                                });
                                edges.push({
                                    id: `e-${litId}-to-${logicNodeId}-${handle}`,
                                    source: litId,
                                    sourceHandle: 'output',
                                    target: logicNodeId,
                                    targetHandle: handle,
                                    style: EDGE_STYLE_DEFAULT
                                });
                            }
                        };

                        processOperand(cond.left, 'input-a');
                        processOperand(cond.right, 'input-b');

                        edges.push({
                            id: `e-${logicNodeId}-to-${nodeId}`,
                            source: logicNodeId,
                            sourceHandle: 'result',
                            target: nodeId,
                            targetHandle: 'condition',
                            animated: true,
                            style: EDGE_STYLE_DEFAULT
                        });
                    }
                };
                processCondition(statement.test);

                // --- NEW BLOCK PROCESSING REUSE ---
                // Helper to connect children inside blocks (Reused concept)
                const processBlock = (block: any, handle: string) => {
                    if (block?.type === 'BlockStatement') {
                        block.body.forEach((childStmt: any) => {
                            if (childStmt.type === 'ExpressionStatement' && childStmt.expression.type === 'CallExpression') {
                                const nestedId = `call-nested-${Math.random().toString(36).substr(2, 6)}`;
                                processCall(childStmt.expression, nestedId);
                                edges.push({
                                    id: `e-${nodeId}-${handle}-${nestedId}`,
                                    source: nodeId,
                                    sourceHandle: handle,
                                    target: nestedId,
                                    targetHandle: 'flow-in',
                                    style: EDGE_STYLE_DEFAULT,
                                    animated: true
                                });
                            }
                        });
                    }
                };

                processBlock(statement.body, 'flow-body');
                // -----------------------------
            }

            // For Statements
            // For Statements
            if (statement.type === 'ForStatement') {
                const nodeId = `for-${index}`;
                nodes.push({
                    id: nodeId,
                    type: 'forNode',
                    position: { x: 0, y: 0 },
                    data: { label: 'For' }
                });

                // --- NEW BLOCK PROCESSING REUSE ---
                const processBlock = (block: any, handle: string) => {
                    if (block?.type === 'BlockStatement') {
                        block.body.forEach((childStmt: any) => {
                            if (childStmt.type === 'ExpressionStatement' && childStmt.expression.type === 'CallExpression') {
                                const nestedId = `call-nested-${Math.random().toString(36).substr(2, 6)}`;
                                processCall(childStmt.expression, nestedId);
                                edges.push({
                                    id: `e-${nodeId}-${handle}-${nestedId}`,
                                    source: nodeId,
                                    sourceHandle: handle,
                                    target: nestedId,
                                    targetHandle: 'flow-in',
                                    style: EDGE_STYLE_DEFAULT,
                                    animated: true
                                });
                            }
                        });
                    }
                };

                processBlock(statement.body, 'flow-body');
                // -----------------------------

                // 1. Init (Assignment)
                if (statement.init?.type === 'VariableDeclaration') {
                    // The init is usually a variable declaration (let i = 0)
                    // We need to visualize this connection?
                    // Actually, ForNode has an 'init' handle.
                    // But the variable declaration itself is matched earlier in the loop? 
                    // NO, AST traversal hits ForStatement. The init IS child.
                    // We should process the init.

                    // Challenge: visualizer usually flattens specific nodes.
                    // Simpler approach: If init is `let i=0`, we find `var-i` if it exists (but we haven't processed children yet?)
                    // Actually, we processed top-level body. This is inside.

                    // Helper to extract var name from init
                    const decl = statement.init.declarations[0];
                    if (decl?.id.type === 'Identifier') {
                        // We can create a variable node for 'i' if we want, or just link to it?
                        // Visualizer usually expects independent nodes.
                        // Let's rely on standard var processing? No, it's scoped.

                        // MVP: We assume the user connects a variable or we create one?
                        // Let's create a visual linkage if we see a variable in our known list?
                        // But `i` is new.

                        // Let's just create a Variable Node for the init variable to visualize it!
                        const varName = decl.id.name;
                        const varNodeId = `var-${varName}-${index}`; // Scoped ID

                        nodes.push({
                            id: varNodeId,
                            type: 'variableNode',
                            position: { x: 0, y: 0 },
                            data: { label: varName, value: (decl.init as any)?.value || 0 }
                        });

                        variableNodes[varName] = varNodeId; // Update reference for loop body usage

                        edges.push({
                            id: `e-${varNodeId}-to-${nodeId}-init`,
                            source: varNodeId,
                            sourceHandle: 'output',
                            target: nodeId,
                            targetHandle: 'init',
                            animated: true,
                            style: EDGE_STYLE_DEFAULT
                        });
                    }
                }

                // 2. Test (Condition)
                const processCondition = (cond: any) => {
                    // Reuse logic (copy-paste for now to avoid hoisting complex closures)
                    // Or better: define helper outside
                    if (cond.type === 'BinaryExpression') {
                        const logicNodeId = `logic-nested-${nodeId}`;
                        nodes.push({
                            id: logicNodeId,
                            type: 'logicNode',
                            position: { x: 0, y: 0 },
                            data: { op: cond.operator }
                        });

                        // Link operands??
                        // If left is Identifier 'i', link to our new var node
                        if (cond.left.type === 'Identifier' && variableNodes[cond.left.name]) {
                            edges.push({
                                id: `e-${variableNodes[cond.left.name]}-to-${logicNodeId}-a`,
                                source: variableNodes[cond.left.name],
                                sourceHandle: 'output',
                                target: logicNodeId,
                                targetHandle: 'input-a',
                                style: EDGE_STYLE_DEFAULT
                            });
                        }
                        if (cond.right.type === 'NumericLiteral') {
                            // Create literal
                            const litId = `lit-${logicNodeId}-b`;
                            nodes.push({ id: litId, type: 'literalNode', position: { x: 0, y: 0 }, data: { label: 'number', value: String(cond.right.value) } });
                            edges.push({ source: litId, target: logicNodeId, sourceHandle: 'output', targetHandle: 'input-b', id: `e-${litId}-${logicNodeId}`, style: EDGE_STYLE_DEFAULT });
                        }

                        edges.push({
                            id: `e-${logicNodeId}-to-${nodeId}-test`,
                            source: logicNodeId,
                            sourceHandle: 'result',
                            target: nodeId,
                            targetHandle: 'test', // Handle name in ForNode
                            animated: true,
                            style: EDGE_STYLE_DEFAULT
                        });
                    }
                };
                if (statement.test) processCondition(statement.test);

                // 3. Update (UpdateExpression i++)
                // We can visualize this as a 'logic' or just assume it?
                // ForNode has 'update' input.
                // We typically don't visualize 'i++' as a node yet.
                // Let's leave 'Update' unconnected for now or just generic.
            }
        });

        // Finalize usage counts
        nodes.forEach(n => {
            if ((n.data as any)?.isDecl) {
                const name = (n.data as any).label.replace('Definition: ', '');
                (n.data as any).usageCount = usageCount[name] || 0;
            }
        });

    } catch (err) {
        console.error("Parse error:", err);
    }

    return { nodes, edges };
};
