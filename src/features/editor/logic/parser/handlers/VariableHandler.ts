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
                flowTargetId ??= nodeId;

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
                let isAwait = false;

                if (decl.init) {
                    let init = decl.init;
                    if (init.type === 'AwaitExpression') {
                        isAwait = true;
                        init = init.argument;
                    }

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
                                const importId = ctx.variableNodes[`import:${callName}`];

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
                                } else if (importId) {
                                    ctx.edges.push({
                                        id: `ref-import-${importId}-${callName}-${nodeId}`,
                                        source: importId,
                                        sourceHandle: callName,
                                        target: nodeId,
                                        targetHandle: 'ref-target',
                                        animated: false,
                                        type: 'step',
                                        style: { stroke: '#4caf50', strokeWidth: 2, strokeDasharray: '5,5', opacity: 0.8 }
                                    });

                                    // Macro Dependency
                                    if (ctx.scopeOwnerId && ctx.scopeOwnerId !== importId) {
                                        ctx.edges.push({
                                            id: `macro-ref-${importId}-${callName}-to-${ctx.scopeOwnerId}-${nodeId}`,
                                            source: importId,
                                            sourceHandle: callName,
                                            target: ctx.scopeOwnerId,
                                            targetHandle: 'ref-target',
                                            animated: false,
                                            type: 'step',
                                            style: { stroke: '#4caf50', strokeWidth: 1, strokeDasharray: '3,3', opacity: 0.4 }
                                        });
                                    }
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
                            if (arg.type === 'Identifier') {
                                const sourceId = ctx.variableNodes[arg.name] || ctx.variableNodes[`import:${arg.name}`];
                                if (sourceId) {
                                    const isImport = !!ctx.variableNodes[`import:${arg.name}`];
                                    ctx.edges.push({
                                        id: `e-${sourceId}-to-${nodeId}-nested-arg-${i}`,
                                        source: sourceId,
                                        sourceHandle: isImport ? arg.name : 'output',
                                        target: nodeId,
                                        targetHandle: `nested-arg-${i}`,
                                        animated: true,
                                        style: { strokeWidth: 2, stroke: isImport ? '#38bdf8' : '#b1b1b7' }
                                    });

                                    // Macro Dependency for arguments
                                    if (isImport && ctx.scopeOwnerId && ctx.scopeOwnerId !== sourceId) {
                                        ctx.edges.push({
                                            id: `macro-ref-${sourceId}-${arg.name}-to-${ctx.scopeOwnerId}-${nodeId}`,
                                            source: sourceId,
                                            sourceHandle: arg.name,
                                            target: ctx.scopeOwnerId,
                                            targetHandle: 'ref-target',
                                            animated: false,
                                            type: 'step',
                                            style: { stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '3,3', opacity: 0.4 }
                                        });
                                    }
                                }
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
                        isAwait: isAwait,
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
                flowTargetId ??= destrId;

                let sourceLabel = 'Object';
                if (decl.init?.type === 'Identifier') {
                    sourceLabel = decl.init.name;
                }

                // Recursive function to handle object pattern
                const processObjectPattern = (
                    pattern: t.ObjectPattern,
                    sourceConnect: (targetId: string, targetHandle: string) => void,
                    sourceLabel: string,
                    parentId?: string
                ): string => {
                    const destrId = idSuffix ? `destr-${Math.random().toString(36).substr(2, 5)}-${idSuffix}` : `destr-${Math.random().toString(36).substr(2, 5)}`;

                    const destructuringKeys: string[] = [];
                    pattern.properties.forEach((prop) => {
                        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                            destructuringKeys.push(prop.key.name);
                        }
                    });

                    ctx.nodes.push({
                        id: destrId,
                        type: 'destructuringNode',
                        position: { x: 0, y: 0 },
                        parentId: parentId ?? ctx.currentParentId,
                        data: {
                            label: 'Destructuring',
                            destructuringKeys,
                            destructuringSource: sourceLabel,
                            scopeId: ctx.currentScopeId
                        }
                    });

                    // Connect to source
                    sourceConnect(destrId, 'input');

                    // Process properties
                    pattern.properties.forEach((prop) => {
                        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                            const key = prop.key.name;

                            if (prop.value.type === 'Identifier') {
                                // Variable Assignment
                                const targetVarName = prop.value.name;
                                const varNodeId = idSuffix ? `var-${targetVarName}-${idSuffix}` : `var-${targetVarName}`;

                                ctx.nodes.push({
                                    id: varNodeId,
                                    type: 'variableNode',
                                    position: { x: 0, y: 0 },
                                    parentId: parentId ?? ctx.currentParentId,
                                    data: {
                                        label: targetVarName,
                                        value: '(destructured)',
                                        isParameter: false,
                                        scopeId: ctx.currentScopeId
                                    }
                                });

                                ctx.variableNodes[targetVarName] = varNodeId;

                                ctx.edges.push({
                                    id: `e-${destrId}-${key}-to-${varNodeId}`,
                                    source: destrId,
                                    sourceHandle: key,
                                    target: varNodeId,
                                    targetHandle: 'ref-target',
                                    animated: true,
                                    style: { strokeWidth: 2, stroke: '#a855f7' }
                                });
                            } else if (prop.value.type === 'ObjectPattern') {
                                // Nested Destructuring
                                processObjectPattern(
                                    prop.value,
                                    (targetId, targetHandle) => {
                                        ctx.edges.push({
                                            id: `e-${destrId}-${key}-to-${targetId}`,
                                            source: destrId,
                                            sourceHandle: key,
                                            target: targetId,
                                            targetHandle: targetHandle,
                                            animated: true,
                                            style: { strokeWidth: 2, stroke: '#a855f7' }
                                        });
                                    },
                                    key,
                                    parentId
                                );
                            }
                        }
                    });

                    return destrId;
                };

                const rootPattern = decl.id;

                const rootDestrId = processObjectPattern(
                    rootPattern,
                    (targetId, targetHandle) => {
                        if (decl.init?.type === 'Identifier') {
                            const sourceName = decl.init.name;
                            const sourceId = ctx.variableNodes[sourceName] || ctx.variableNodes[`import:${sourceName}`];
                            if (sourceId) {
                                const isImport = !!ctx.variableNodes[`import:${sourceName}`];
                                ctx.edges.push({
                                    id: `e-${sourceId}-to-${targetId}-input`,
                                    source: sourceId,
                                    sourceHandle: isImport ? sourceName : 'output',
                                    target: targetId,
                                    targetHandle: targetHandle,
                                    animated: true,
                                    style: { strokeWidth: 2, stroke: isImport ? '#38bdf8' : '#a855f7' }
                                });

                                // Macro Dependency for destructuring source
                                if (isImport && ctx.scopeOwnerId && ctx.scopeOwnerId !== sourceId) {
                                    ctx.edges.push({
                                        id: `macro-ref-${sourceId}-${sourceName}-to-${ctx.scopeOwnerId}-${flowTargetId}`,
                                        source: sourceId,
                                        sourceHandle: sourceName,
                                        target: ctx.scopeOwnerId,
                                        targetHandle: 'ref-target',
                                        animated: false,
                                        type: 'step',
                                        style: { stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '3,3', opacity: 0.4 }
                                    });
                                }
                            }
                        }
                    },
                    sourceLabel
                );

                flowTargetId ??= rootDestrId;
            }
        });

        if (parentId && handleName && flowTargetId) {
            try {
                ctx.edges.push({
                    id: `flow-${parentId}-${flowTargetId}-${ctx.edges.length}`,
                    source: parentId,
                    sourceHandle: handleName,
                    target: flowTargetId,
                    animated: false,
                    type: 'step',
                    style: { stroke: '#555', strokeWidth: 2, strokeDasharray: '4,4' }
                });
            } catch { /* ignore */ }
        }

        return flowTargetId;
    }
};
