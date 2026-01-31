import type { ParserContext, ParserHandler } from '../types';
import { isNativeApi } from '../utils';
import { LogicHandler } from './LogicHandler';
import type { Node as BabelNode, VariableDeclaration, VariableDeclarator } from '@babel/types';

const getExpressionCode = (node: BabelNode | null | undefined): string => {
    if (!node) return '';
    if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
        const left = (node as any).left as BabelNode;
        const right = (node as any).right as BabelNode;
        const operator = (node as any).operator as string;
        return `${getExpressionCode(left)} ${operator} ${getExpressionCode(right)}`;
    }
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'NumericLiteral' || node.type === 'StringLiteral' || node.type === 'BooleanLiteral') {
        return String((node as any).value);
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
                let nestedCall: any = undefined;

                if (decl.init) {
                    const init = decl.init;
                    if (init.type === 'NumericLiteral' || init.type === 'StringLiteral' || init.type === 'BooleanLiteral') {
                        value = String((init as any).value);
                        if (init.type === 'StringLiteral') value = `'${value}'`;
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
                            if (arg.type === 'NumericLiteral' || arg.type === 'StringLiteral' || arg.type === 'BooleanLiteral') {
                                return String((arg as any).value);
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
                        nestedCall,
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

