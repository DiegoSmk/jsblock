import type { ParserContext, ParserHandler } from '../types';
import { isNativeApi } from '../utils';
import { LogicHandler } from './LogicHandler';

const getExpressionCode = (node: any): string => {
    if (!node) return '';
    if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
        return `${getExpressionCode(node.left)} ${node.operator} ${getExpressionCode(node.right)}`;
    }
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'NumericLiteral' || node.type === 'StringLiteral' || node.type === 'BooleanLiteral') return String(node.value);
    if (node.type === 'CallExpression') {
        const name = node.callee.type === 'Identifier' ? node.callee.name : 'function';
        return `${name}(...)`;
    }
    return '...';
};

export const VariableHandler: ParserHandler = {
    canHandle: (stmt: any) => stmt.type === 'VariableDeclaration',
    handle: (stmt: any, ctx: ParserContext, _parentId?: string, _handleName?: string, idSuffix?: string) => {
        stmt.declarations.forEach((decl: any) => {
            if (decl.id.type === 'Identifier') {
                const varName = decl.id.name;
                const nodeId = idSuffix ? `var-${varName}-${idSuffix}` : `var-${varName}`;

                let value = '';
                let nestedCall: any = undefined;

                if (decl.init) {
                    if (decl.init.type === 'NumericLiteral' || decl.init.type === 'StringLiteral' || decl.init.type === 'BooleanLiteral') {
                        value = String(decl.init.value);
                        if (decl.init.type === 'StringLiteral') value = `'${value}'`;
                    } else if (decl.init.type === 'CallExpression') {
                        value = '(computed)';
                        const callee = decl.init.callee;
                        let callName = 'function';

                        if (callee.type === 'Identifier') {
                            callName = callee.name;
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
                            callName = `${callee.object.name}.${callee.property.name}`;
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

                        const argNames = decl.init.arguments.map((arg: any) => {
                            if (arg.type === 'Identifier') return arg.name;
                            if (arg.type === 'NumericLiteral' || arg.type === 'StringLiteral') return String(arg.value);
                            return 'arg';
                        });

                        nestedCall = {
                            name: callName,
                            args: argNames
                        };

                        decl.init.arguments.forEach((arg: any, i: number) => {
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
                    } else if (decl.init.type === 'BinaryExpression' || decl.init.type === 'LogicalExpression') {
                        value = getExpressionCode(decl.init);
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
                        nestedCall,
                        scopeId: ctx.currentScopeId
                    }
                } as any);

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
