import type { ParserContext, ParserHandler } from '../types';
import { isNativeApi } from '../utils';
import { LogicHandler } from './LogicHandler';
import type { Node as BabelNode, VariableDeclaration, VariableDeclarator } from '@babel/types';
import * as t from '@babel/types';

const getExpressionCode = (node: BabelNode | null | undefined): string => {
    if (!node) return '';
    if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
        const left = node.left;
        const right = node.right;
        const operator = t.isBinaryExpression(node) || t.isLogicalExpression(node) ? node.operator : '';
        return `${getExpressionCode(left)} ${operator} ${getExpressionCode(right)}`;
    }
    if (node.type === 'Identifier') return node.name;
    if (t.isNumericLiteral(node) || t.isStringLiteral(node) || t.isBooleanLiteral(node)) {
        return String(node.value);
    }
    if (node.type === 'CallExpression') {
        const callee = node.callee;
        const name = callee.type === 'Identifier' ? callee.name : 'function';
        return `${name}(...)`;
    }
    return '...';
};


export const VariableHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'VariableDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const stmt = node as VariableDeclaration;
        let flowTargetId: string | undefined;

        stmt.declarations.forEach((decl: VariableDeclarator) => {
            if (decl.id.type === 'Identifier') {
                const varName = decl.id.name;
                const nodeId = idSuffix ? `var-${varName}-${idSuffix}` : `var-${varName}`;
                if (!flowTargetId) flowTargetId = nodeId;

                let typeAnnotation: string | undefined = undefined;
                if (t.isIdentifier(decl.id) && decl.id.typeAnnotation) {
                    const ta = decl.id.typeAnnotation as t.TSTypeAnnotation;
                    if (ta.typeAnnotation.type === 'TSBooleanKeyword') typeAnnotation = 'boolean';
                    else if (ta.typeAnnotation.type === 'TSNumberKeyword') typeAnnotation = 'number';
                    else if (ta.typeAnnotation.type === 'TSStringKeyword') typeAnnotation = 'string';
                    else if (ta.typeAnnotation.type === 'TSAnyKeyword') typeAnnotation = 'any';
                    else if (ta.typeAnnotation.type === 'TSUnknownKeyword') typeAnnotation = 'unknown';
                    else if (ta.typeAnnotation.type === 'TSVoidKeyword') typeAnnotation = 'void';
                    else if (ta.typeAnnotation.type === 'TSTypeReference' && ta.typeAnnotation.typeName.type === 'Identifier') {
                        typeAnnotation = ta.typeAnnotation.typeName.name;
                    }
                }

                let value = '';
                let nestedCall: { name: string, args: string[] } | undefined = undefined;

                if (decl.init) {
                    const init = decl.init;
                    if (t.isNumericLiteral(init) || t.isStringLiteral(init) || t.isBooleanLiteral(init)) {
                        value = String(init.value);
                        if (t.isStringLiteral(init)) value = `'${value}'`;
                    } else if (init.type === 'CallExpression') {
                        const callInit = init;
                        value = '(computed)';
                        const callee = callInit.callee;
                        let callName = 'function';

                        if (callee.type === 'Identifier') {
                            callName = (callee).name;
                            const isNative = isNativeApi(callName);
                            if (isNative && ctx.nativeApiNodeId) {
                                ctx.edges.push({
                                    id: `ref-native-${ctx.nativeApiNodeId}-${nodeId}`,
                                    source: ctx.nativeApiNodeId,
                                    sourceHandle: 'ref-source',
                                    target: nodeId,
                                    targetHandle: 'ref-target',
                                    animated: false,
                                    type: 'step',
                                    style: { stroke: '#f7df1e', strokeWidth: 2, strokeDasharray: '3,3', opacity: 0.8 }
                                });
                            } else {
                                const declId = ctx.variableNodes[`decl:${callName}`];
                                if (declId) {
                                    ctx.edges.push({
                                        id: `ref-${declId}-${nodeId}`,
                                        source: declId,
                                        sourceHandle: 'ref-source',
                                        target: nodeId,
                                        targetHandle: 'ref-target',
                                        animated: false,
                                        type: 'step',
                                        style: { stroke: '#4caf50', strokeWidth: 2, strokeDasharray: '5,5', opacity: 0.8 }
                                    });
                                }
                            }
                        } else if (callee.type === 'MemberExpression') {
                            const memCallee = callee;
                            if (memCallee.object.type === 'Identifier' && memCallee.property.type === 'Identifier') {
                                callName = `${memCallee.object.name}.${memCallee.property.name}`;
                            }
                            const isNative = isNativeApi(callName);
                            if (isNative && ctx.nativeApiNodeId) {
                                ctx.edges.push({
                                    id: `ref-native-${ctx.nativeApiNodeId}-${nodeId}`,
                                    source: ctx.nativeApiNodeId,
                                    sourceHandle: 'ref-source',
                                    target: nodeId,
                                    targetHandle: 'ref-target',
                                    animated: false,
                                    type: 'step',
                                    style: { stroke: '#f7df1e', strokeWidth: 2, strokeDasharray: '3,3', opacity: 0.8 }
                                });
                            }
                        }

                        const argNames = callInit.arguments.map((arg) => {
                            if (arg.type === 'Identifier') return arg.name;
                            if (t.isNumericLiteral(arg) || t.isStringLiteral(arg) || t.isBooleanLiteral(arg)) {
                                return String(arg.value);
                            }
                            return 'arg';
                        });

                        nestedCall = {
                            name: callName,
                            args: argNames
                        };

                        callInit.arguments.forEach((arg, i: number) => {
                            if (arg.type === 'Identifier' && ctx.variableNodes[arg.name]) {
                                ctx.edges.push({
                                    id: `e-${ctx.variableNodes[arg.name]}-to-${nodeId}-nested-arg-${i}`,
                                    source: ctx.variableNodes[arg.name],
                                    sourceHandle: 'output',
                                    target: nodeId,
                                    targetHandle: `nested-arg-${i}`,
                                    animated: true,
                                    style: { strokeWidth: 2, stroke: '#b1b1b7' }
                                });
                            }
                        });
                    } else if (init.type === 'BinaryExpression' || init.type === 'LogicalExpression') {
                        value = getExpressionCode(init);
                    }
                }

                ctx.nodes.push({
                    id: nodeId,
                    type: 'variableNode',
                    position: { x: 0, y: 0 },
                    parentId: ctx.currentParentId,
                    data: {
                        label: varName,
                        value,
                        typeAnnotation,
                        isExported: !!ctx.isExporting || !!ctx.isExportingDefault,
                        expression: value === '(computed)' || value.includes(' ') ? value : undefined,
                        nestedCall: nestedCall as { name: string, args: string[] } | undefined,
                        scopeId: ctx.currentScopeId
                    }
                });

                ctx.variableNodes[varName] = nodeId;

                // Create logic node if needed and connect to variable
                if (decl.init && (decl.init.type === 'BinaryExpression' || decl.init.type === 'LogicalExpression')) {
                    LogicHandler.handle(decl.init, ctx, nodeId, 'ref-target');
                }

            } else if (decl.id.type === 'ObjectPattern') {
                // Handle Object Destructuring: const { a, b } = obj;
                const pattern = decl.id;
                const destructuringKeys: string[] = [];

                pattern.properties.forEach((prop) => {
                    if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                        destructuringKeys.push(prop.key.name);
                    }
                });

                const destrId = idSuffix ? `destr-${Math.random().toString(36).substr(2, 5)}-${idSuffix}` : `destr-${Math.random().toString(36).substr(2, 5)}`;
                if (!flowTargetId) flowTargetId = destrId;

                let sourceLabel = 'Object';
                if (decl.init && decl.init.type === 'Identifier') {
                    sourceLabel = decl.init.name;
                }

                ctx.nodes.push({
                    id: destrId,
                    type: 'destructuringNode',
                    position: { x: 0, y: 0 },
                    parentId: ctx.currentParentId,
                    data: {
                        label: 'Destructuring',
                        destructuringKeys,
                        destructuringSource: sourceLabel,
                        scopeId: ctx.currentScopeId
                    }
                });

                // Connect source object to destructuring node input
                if (decl.init && decl.init.type === 'Identifier' && ctx.variableNodes[decl.init.name]) {
                    ctx.edges.push({
                        id: `e-${ctx.variableNodes[decl.init.name]}-to-${destrId}-input`,
                        source: ctx.variableNodes[decl.init.name],
                        sourceHandle: 'output',
                        target: destrId,
                        targetHandle: 'input',
                        animated: true,
                        style: { strokeWidth: 2, stroke: '#a855f7' }
                    });
                } else if (decl.init && (decl.init.type === 'CallExpression' || decl.init.type === 'BinaryExpression')) {
                     // If init is an expression, we might need a separate LogicHandler or similar.
                     // For now, assuming direct assignment or simple expressions.
                     // But we can try to handle it via LogicHandler if it's complex, but LogicHandler connects to a target.
                     // Here the target is `destrId` input `input`.
                     // LogicHandler usually creates LogicNode.
                     // Let's rely on basic support for now.
                }

                // Create VariableNodes for each key
                pattern.properties.forEach((prop) => {
                    if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                        const varName = prop.key.name;
                        // Support renaming: const { a: b } = obj; (key=a, value=b)
                        // If shorthand (key=value), then value is Identifier with same name.
                        let targetVarName = varName;
                        if (prop.value.type === 'Identifier') {
                            targetVarName = prop.value.name;
                        }

                        const varNodeId = idSuffix ? `var-${targetVarName}-${idSuffix}` : `var-${targetVarName}`;

                        ctx.nodes.push({
                            id: varNodeId,
                            type: 'variableNode',
                            position: { x: 0, y: 0 },
                            parentId: ctx.currentParentId,
                            data: {
                                label: targetVarName,
                                value: '(destructured)', // Triggers nested display
                                nestedCall: { name: 'Destructured', args: [] }, // Using nestedCall to show nicer UI?
                                // Actually, if I set value='(destructured)', VariableNode shows "Calculation" and handle `ref-target`.
                                // If I set nestedCall, it shows `nestedCall.name()`.
                                // Let's try setting value='(destructured)' and rely on ref-target.
                                // Or better, mock a nested call to show "From Destructuring"
                                scopeId: ctx.currentScopeId
                            }
                        });

                        ctx.variableNodes[targetVarName] = varNodeId;

                        // Connect DestructuringNode output (key) to VariableNode input (ref-target)
                        ctx.edges.push({
                            id: `e-${destrId}-${varName}-to-${varNodeId}`,
                            source: destrId,
                            sourceHandle: varName, // The key name is the source handle ID
                            target: varNodeId,
                            targetHandle: 'ref-target',
                            animated: true,
                            style: { strokeWidth: 2, stroke: '#a855f7' }
                        });
                    }
                });
            }
        });

        if (parentId && handleName && flowTargetId) {
            try {
                ctx.edges.push({
                    id: `flow-${parentId}-${flowTargetId}-${ctx.edges.length}`,
                    source: parentId,
                    sourceHandle: handleName,
                    target: flowTargetId,
                    targetHandle: 'flow-in', // DestructuringNode doesn't have flow-in?
                    // Wait, usually flow nodes have flow-in. VariableNode has flow-in implicitly?
                    // VariableNode doesn't have flow-in handle defined in render...
                    // Let's check VariableNode.tsx again.
                    // It does NOT have flow-in handle.
                    // But VariableHandler attempts to connect to it.
                    // "target: ctx.variableNodes[...] ... targetHandle: 'flow-in'"
                    // If the handle doesn't exist, the edge won't show.
                    // But maybe ReactFlow adds it or it's a "step" edge that points to the node center?
                    // "type: 'step'".
                    // If targetHandle is missing, it connects to node center (default).
                    // So providing 'flow-in' might be ignored if not present.
                    // I will check if DestructuringNode needs a flow-in handle or if I can just connect to it.
                    animated: false,
                    type: 'step',
                    style: { stroke: '#555', strokeWidth: 2, strokeDasharray: '4,4' }
                });
            } catch { /* ignore */ }
        }

        return flowTargetId;
    }
};
