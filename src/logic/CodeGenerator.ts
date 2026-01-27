import { parse, print, types } from 'recast';
import * as parser from '@babel/parser';
import type { Edge, Node } from '@xyflow/react';

const b = types.builders;

function createExpression(op: string, left: any, right: any) {
    const isLogical = op === '&&' || op === '||' || op === '??';
    return isLogical ? b.logicalExpression(op as any, left, right) : b.binaryExpression(op as any, left, right);
}

export const generateCodeFromFlow = (
    currentCode: string,
    nodes: Node[],
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
        const varValueMap: Record<string, any> = {};
        const varLabelToId: Record<string, string> = {}; // Reverse map for lookup
        const callOverrideMap: Record<string, Record<number, string>> = {};

        nodes.forEach(n => {
            if (n.type === 'variableNode') {
                const label = n.data.label as string;
                varNodeMap[n.id] = label;
                varLabelToId[label] = n.id;

                if (n.data.value !== undefined) {
                    varValueMap[n.id] = n.data.value;
                    varValueMap[label] = n.data.value;
                }
            } else if (n.type === 'literalNode') {
                varValueMap[n.id] = n.data.value;
            } else if (n.type === 'functionCallNode') {
                if (n.data.connectedValues) {
                    callOverrideMap[n.id] = n.data.connectedValues as Record<number, string>;
                }
            }
        });

        // 1. Identify standalone calls using the EXACT SAME indexing as CodeParser.ts
        const standaloneCalls: Record<string, any> = {};
        const body = ast.program.body;
        body.forEach((statement: any, index: number) => {
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
            nodes.forEach(n => {
                if (n.type === 'ifNode') {
                    // Find the corresponding AST Node
                    // The ID is if-{index}. But wait, indices shift if we splice!
                    // We need a stable way to link.
                    // The Parser indexed them by initial position.
                    // If we only Move items, the initial objects are still references.

                    // Challenge: Mapping 'if-{index}' to the actual AST object reliably.
                    // Since we haven't mutated yet, the index should match.
                    const index = parseInt(n.id.replace('if-', ''));
                    const ifStmt = body[index];

                    if (ifStmt && ifStmt.type === 'IfStatement') {

                        const moveBlock = (handle: 'flow-true' | 'flow-false', targetBlock: 'consequent' | 'alternate') => {
                            const conn = flowConnections.find(c => c.source === n.id && c.handle === handle);
                            if (conn) {
                                // Who is the target?
                                const targetId = conn.target;

                                // Target is likely a Function Call (call-exec-{index})
                                // or another If (if-{index})

                                let targetIndex = -1;
                                if (targetId.startsWith('call-exec-')) targetIndex = parseInt(targetId.replace('call-exec-', ''));
                                else if (targetId.startsWith('if-')) targetIndex = parseInt(targetId.replace('if-', ''));
                                else if (targetId.startsWith('switch-')) targetIndex = parseInt(targetId.replace('switch-', ''));
                                else if (targetId.startsWith('while-')) targetIndex = parseInt(targetId.replace('while-', ''));
                                else if (targetId.startsWith('for-')) targetIndex = parseInt(targetId.replace('for-', ''));

                                if (targetIndex !== -1) {
                                    const targetStmt = body[targetIndex];
                                    if (targetStmt) {
                                        // MOVE IT!
                                        // 1. Remove from body (later, to avoid index mess during loop?) 
                                        //    Actually, we can't look up by index if we mutate.
                                        //    But we are looking up by Initial Index provided by Parser?
                                        //    Yes, 'body' array changes, but 'standaloneCalls' map? 
                                        //    No, we are operating on the AST 'body' array directly.

                                        // SAFE APPROACH: Clone the node to the new location, mark original for deletion.
                                        // Since we might chain multiple items, this simple version only supports ONE item per branch.
                                        // (Chaining is Phase 4).

                                        if (targetBlock === 'consequent') {
                                            ifStmt.consequent = b.blockStatement([targetStmt]);
                                        } else {
                                            ifStmt.alternate = b.blockStatement([targetStmt]);
                                        }

                                        // Mark for global pruning (so it doesn't appear at root)
                                        // We use the ID string we know
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
            nodes.forEach(n => {
                if (n.type === 'switchNode') {
                    const index = parseInt(n.id.replace('switch-', ''));
                    const switchStmt = body[index];

                    if (switchStmt && switchStmt.type === 'SwitchStatement') {
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
                                        // Move statement to case consequent and add break
                                        switchStmt.cases[i].consequent = [targetStmt, b.breakStatement()];
                                        nodesToPrune.add(targetId);
                                    }
                                }
                            }
                        });
                    }
                }
            });


            // Handle While Nodes
            nodes.forEach(n => {
                if (n.type === 'whileNode') {
                    const index = parseInt(n.id.replace('while-', ''));
                    const whileStmt = body[index];

                    if (whileStmt && whileStmt.type === 'WhileStatement') {
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
                                    whileStmt.body = b.blockStatement([targetStmt]);
                                    nodesToPrune.add(targetId);
                                }
                            }
                        }
                    }
                }
            });


            // Handle For Nodes
            nodes.forEach(n => {
                if (n.type === 'forNode') {
                    const index = parseInt(n.id.replace('for-', ''));
                    const forStmt = body[index];

                    if (forStmt && forStmt.type === 'ForStatement') {
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
                                    forStmt.body = b.blockStatement([targetStmt]);
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

        ast.program.body = ast.program.body.filter((_: any, i: number) => {
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
                // Find index of this statement in the program body if possible
                // Note: This is simpler for root-level statements. Nested ones need better ID tracking.
                const index = body.indexOf(path.node);
                let ifNodeId = `if-${index}`;

                // If not found in root body, we might need a fallback or skip for MVP
                // But wait! We need to handle root-level IFs first.

                const node = nodes.find(n => n.id === ifNodeId);
                if (node) {
                    // Check 'condition' handle
                    const conditionSourceId = connections[ifNodeId]?.['condition'];
                    if (conditionSourceId) {
                        if (varNodeMap[conditionSourceId]) {
                            path.node.test = b.identifier(varNodeMap[conditionSourceId]);
                        } else if (conditionSourceId.startsWith('logic-')) {
                            // It's coming from a Logic Node!
                            // We need to find the Logic Expression corresponding to that node.
                            // THIS IS TRICKY: The Logic Expression might be a standalone statement we pruned,
                            // OR it might calculate inline.

                            // STRATEGY: 
                            // If a Logic Node feeds into an IF, we should move its expression INTO the if test.
                            // We need to find where that logic expression is currently living in the AST.
                            // If it was a standalone statement, 'statement.expression' is what we want.

                            // Let's rely on 'nodesToPrune' logic. If we use a logic node here, we should prune its original statement.
                            // But we need to Find it first.

                            // Hacky MVP: We find the logic node data and Re-Construct the expression here.
                            // This avoids moving AST nodes around which is complex.
                            const logicNode = nodes.find(n => n.id === conditionSourceId);
                            if (logicNode) {
                                // We need to reconstruct the binary expression
                                // Recursively resolve inputs A and B?
                                // For now, let's assume simple 1-level depth or just take what we can get.
                                // Better: We rely on the fact that we updated the Logic Node expression in the 'visitExpressionStatement' pass?
                                // No, that pass happens in the same traversal.

                                // Let's reconstruct!
                                const op = logicNode.data.op as any;
                                let left: any = b.identifier('undefined');
                                let right: any = b.identifier('undefined');

                                const leftSource = connections[logicNode.id]?.['input-a'];
                                const rightSource = connections[logicNode.id]?.['input-b'];

                                if (leftSource && varNodeMap[leftSource]) left = b.identifier(varNodeMap[leftSource]);
                                if (leftSource && varValueMap[leftSource] !== undefined) left = createLiteral(varValueMap[leftSource]);

                                if (rightSource && varNodeMap[rightSource]) right = b.identifier(varNodeMap[rightSource]);
                                if (rightSource && varValueMap[rightSource] !== undefined) right = createLiteral(varValueMap[rightSource]);

                                path.node.test = createExpression(op, left, right);

                                // IMPORTANT: If this logic node corresponded to a standalone statement, we must prune it to avoid duplication!
                                // The LogicNode ID is 'logic-{index}'. We can derive the standalone call ID?
                                // Yes, if it was logic-5, it was statement 5.
                                const match = conditionSourceId.match(/logic-(\d+)/);
                                if (match) {
                                    // We can't prune purely by index here safely during traversal... 
                                    // actually we can add to nodesToPrune if we haven't visited it yet? 
                                    // Or just let it be for now? 
                                    // Let's add it to a prune set that we check in ExpressionStatement visitor.
                                    nodesToPrune.add(conditionSourceId);
                                }
                            }
                        }
                    }
                }

                this.traverse(path);
                return false;
            },

            visitSwitchStatement(path: any) {
                const index = body.indexOf(path.node);
                const nodeId = `switch-${index}`;
                const node = nodes.find(n => n.id === nodeId);

                if (node) {
                    const discSourceId = connections[nodeId]?.['discriminant'];
                    if (discSourceId) {
                        if (varNodeMap[discSourceId]) {
                            path.node.discriminant = b.identifier(varNodeMap[discSourceId]);
                        } else if (varValueMap[discSourceId] !== undefined) {
                            path.node.discriminant = createLiteral(varValueMap[discSourceId]);
                        }
                    }
                }
                this.traverse(path);
                return false;
            },

            visitWhileStatement(path: any) {
                const index = body.indexOf(path.node);
                const nodeId = `while-${index}`;
                const node = nodes.find(n => n.id === nodeId);

                if (node) {
                    const conditionSourceId = connections[nodeId]?.['condition'];
                    if (conditionSourceId) {
                        if (varNodeMap[conditionSourceId]) {
                            path.node.test = b.identifier(varNodeMap[conditionSourceId]);
                        } else if (conditionSourceId.startsWith('logic-')) {
                            const logicNode = nodes.find(n => n.id === conditionSourceId);
                            if (logicNode) {
                                const op = logicNode.data.op as any;
                                let left: any = b.identifier('undefined');
                                let right: any = b.identifier('undefined');

                                const leftSource = connections[logicNode.id]?.['input-a'];
                                const rightSource = connections[logicNode.id]?.['input-b'];

                                if (leftSource && varNodeMap[leftSource]) left = b.identifier(varNodeMap[leftSource]);
                                if (leftSource && varValueMap[leftSource] !== undefined) left = createLiteral(varValueMap[leftSource]);

                                if (rightSource && varNodeMap[rightSource]) right = b.identifier(varNodeMap[rightSource]);
                                if (rightSource && varValueMap[rightSource] !== undefined) right = createLiteral(varValueMap[rightSource]);

                                path.node.test = createExpression(op, left, right);

                                const match = conditionSourceId.match(/logic-(\d+)/);
                                if (match) {
                                    nodesToPrune.add(conditionSourceId);
                                }
                            }
                        }
                    }
                }
                this.traverse(path);
                return false;
            },

            visitForStatement(path: any) {
                const index = body.indexOf(path.node);
                const nodeId = `for-${index}`;
                const node = nodes.find(n => n.id === nodeId);

                if (node) {
                    // 1. Init
                    const initSourceId = connections[nodeId]?.['init'];
                    if (initSourceId) {
                        if (varNodeMap[initSourceId]) {
                            const varName = varNodeMap[initSourceId];
                            if (path.node.init && path.node.init.type === 'VariableDeclaration') {
                                path.node.init.declarations[0].id.name = varName;
                                if (varValueMap[initSourceId] !== undefined) {
                                    path.node.init.declarations[0].init = createLiteral(varValueMap[initSourceId]);
                                }
                            }
                        }
                    }

                    // 2. Test
                    const testSourceId = connections[nodeId]?.['test'];
                    if (testSourceId) {
                        if (varNodeMap[testSourceId]) {
                            path.node.test = b.identifier(varNodeMap[testSourceId]);
                        } else if (testSourceId.startsWith('logic-')) {
                            const logicNode = nodes.find(n => n.id === testSourceId);
                            if (logicNode) {
                                const op = logicNode.data.op as any;
                                let left: any = b.identifier('undefined');
                                let right: any = b.identifier('undefined');
                                const leftSource = connections[logicNode.id]?.['input-a'];
                                const rightSource = connections[logicNode.id]?.['input-b'];

                                if (leftSource && varNodeMap[leftSource]) left = b.identifier(varNodeMap[leftSource]);
                                if (leftSource && varValueMap[leftSource] !== undefined) left = createLiteral(varValueMap[leftSource]);

                                if (rightSource && varNodeMap[rightSource]) right = b.identifier(varNodeMap[rightSource]);
                                if (rightSource && varValueMap[rightSource] !== undefined) right = createLiteral(varValueMap[rightSource]);

                                path.node.test = createExpression(op, left, right);

                                const match = testSourceId.match(/logic-(\d+)/);
                                if (match) nodesToPrune.add(testSourceId);
                            }
                        }
                    }
                }
                this.traverse(path);
                return false;
            },

            visitVariableDeclaration(path: any) {
                const decl = path.node.declarations[0];
                if (decl.id.type !== 'Identifier') return false;

                const varName = decl.id.name;
                const nodeId = varLabelToId[varName]; // Lookup correct ID

                if (!nodeId) return false;

                // Check if we have an incoming Logic Node connection driving this variable
                // We typically look for ANY connection targeting the variable if it's acting as a value sink
                const nodeConns = connections[nodeId] || {};
                const logicSourceId = Object.values(nodeConns).find(source => source && source.startsWith('logic-'));

                if (logicSourceId) {
                    const logicNode = nodes.find(n => n.id === logicSourceId);
                    if (logicNode) {
                        const op = logicNode.data.op as any;
                        let left: any = b.identifier('undefined');
                        let right: any = b.identifier('undefined');

                        const leftSource = connections[logicNode.id]?.['input-a'];
                        const rightSource = connections[logicNode.id]?.['input-b'];

                        if (leftSource && varNodeMap[leftSource]) left = b.identifier(varNodeMap[leftSource]);
                        if (leftSource && varValueMap[leftSource] !== undefined) left = createLiteral(varValueMap[leftSource]);

                        if (rightSource && varNodeMap[rightSource]) right = b.identifier(varNodeMap[rightSource]);
                        if (rightSource && varValueMap[rightSource] !== undefined) right = createLiteral(varValueMap[rightSource]);

                        decl.init = createExpression(op, left, right);
                    }
                } else if (decl.init && decl.init.type === 'CallExpression') {
                    updateCallArguments(decl.init, nodeId, connections, varNodeMap, varValueMap, undefined, standaloneCalls);
                } else if (!decl.init || isLiteral(decl.init)) {
                    const newValue = varValueMap[varName] || varValueMap[nodeId];
                    if (newValue !== undefined && newValue !== '(computed)') {
                        decl.init = createLiteral(newValue);
                    }
                }
                return false;
            },

            visitExpressionStatement(path: any) {
                // Find index of this statement in the program body
                const index = body.indexOf(path.node);
                if (path.node.expression.type === 'CallExpression') {
                    const callNodeId = `call-exec-${index}`;
                    // Do not prune here! Filter pass handles root removal.
                    // If we prune here, we delete valid nodes inside blocks.
                    updateCallArguments(path.node.expression, callNodeId, connections, varNodeMap, varValueMap, callOverrideMap[callNodeId], standaloneCalls);
                } else if (path.node.expression.type === 'BinaryExpression' || path.node.expression.type === 'LogicalExpression') {
                    // Logic Node Generation
                    const logicNodeId = `logic-${index}`;
                    const node = nodes.find(n => n.id === logicNodeId);

                    if (node && node.data.op) {
                        const op = node.data.op as string;
                        let left = path.node.expression.left;
                        let right = path.node.expression.right;

                        const updateOperand = (handleId: 'input-a' | 'input-b', current: any) => {
                            const sourceId = connections[logicNodeId]?.[handleId];
                            if (sourceId) {
                                if (varNodeMap[sourceId]) return b.identifier(varNodeMap[sourceId]);
                                if (varValueMap[sourceId] !== undefined) return createLiteral(varValueMap[sourceId]);
                            }
                            return current;
                        };

                        left = updateOperand('input-a', left);
                        right = updateOperand('input-b', right);

                        path.node.expression = createExpression(op, left, right);
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

function createLiteral(val: any) {
    if (!isNaN(Number(val)) && String(val).trim() !== '') {
        return b.numericLiteral(Number(val));
    } else if (val === 'true' || val === 'false') {
        return b.booleanLiteral(val === 'true');
    } else {
        return b.stringLiteral(String(val));
    }
}

function updateCallArguments(
    callExpr: any,
    parentId: string,
    connections: Record<string, Record<string, string>>,
    varMap: Record<string, string>,
    valMap: Record<string, any>,
    overrides?: Record<number, string>,
    standaloneCalls?: Record<string, any>
) {
    const nodeConns = connections[parentId] || {};

    const connectionIndices = Object.keys(nodeConns)
        .filter(k => k.startsWith('arg-') || k.startsWith('nested-arg-'))
        .map(k => {
            const match = k.match(/arg-(\d+)/) || k.match(/nested-arg-(\d+)/);
            return match ? parseInt(match[1]) : -1;
        });

    // Check for nested-arg-X style
    Object.keys(nodeConns).forEach(k => {
        const match = k.match(/arg-(\d+)-nested/);
        if (match) connectionIndices.push(parseInt(match[1]));
    });

    const maxArgIndex = connectionIndices.length > 0 ? Math.max(...connectionIndices) : -1;
    const currentArgCount = callExpr.arguments.length;
    const targetArgCount = Math.max(currentArgCount, maxArgIndex + 1);

    for (let i = 0; i < targetArgCount; i++) {
        const isVarNode = parentId.startsWith('var-');
        const handleName = isVarNode ? `nested-arg-${i}` : `arg-${i}`;
        const sourceId = nodeConns[handleName];

        let newArgValue: any = null;

        if (sourceId) {
            if (varMap[sourceId]) {
                newArgValue = b.identifier(varMap[sourceId]);
            } else if (valMap[sourceId] !== undefined) {
                newArgValue = createLiteral(valMap[sourceId]);
            } else if (standaloneCalls && standaloneCalls[sourceId]) {
                // If it's a standalone call, we use its expression
                // Note: standaloneCalls now stores the expression directly
                newArgValue = standaloneCalls[sourceId];
            }
        }

        if (!newArgValue && overrides && overrides[i] !== undefined) {
            newArgValue = createLiteral(overrides[i]);
        }

        if (newArgValue) {
            callExpr.arguments[i] = newArgValue;
        } else if (i < currentArgCount && callExpr.arguments[i].type === 'CallExpression') {
            const nestedArg = callExpr.arguments[i];
            nestedArg.arguments.forEach((_: any, j: number) => {
                const nestedHandleId = `arg-${i}-nested-arg-${j}`;
                const nestedSourceId = nodeConns[nestedHandleId];
                if (nestedSourceId && varMap[nestedSourceId]) {
                    nestedArg.arguments[j] = b.identifier(varMap[nestedSourceId]);
                } else if (nestedSourceId && valMap[nestedSourceId] !== undefined) {
                    nestedArg.arguments[j] = createLiteral(valMap[nestedSourceId]);
                }
            });
        } else if (i >= currentArgCount) {
            callExpr.arguments[i] = b.identifier('undefined');
        }
    }
}
