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
        return `${getExpressionCode(left as BabelNode)} ${operator} ${getExpressionCode(right as BabelNode)}`;
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
    handle: (node: BabelNode, ctx: ParserContext, _parentId?: string, _handleName?: string, idSuffix?: string) => {
        const stmt = node as VariableDeclaration;
        stmt.declarations.forEach((decl: VariableDeclarator) => {
            if (decl.id.type === 'Identifier') {
                const varName = (decl.id).name;
                const nodeId = idSuffix ? `var-${varName}-${idSuffix}` : `var-${varName}`;

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
            }
        });
        return undefined;
    }
};

