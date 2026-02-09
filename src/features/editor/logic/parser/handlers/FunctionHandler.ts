import type { ParserContext, ParserHandler } from '../types';
import { generateId } from '../utils';
import type { Node as BabelNode, FunctionDeclaration } from '@babel/types';
import * as t from '@babel/types';
import type { AppNode } from '../../../types';

export const FunctionHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'FunctionDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const stmt = node as FunctionDeclaration;
        const funcName = stmt.id ? stmt.id.name : 'default';
        const nodeId = idSuffix ? `func-${funcName}-${idSuffix}` : `func-${funcName}`;

        const params = stmt.params.map((p) => {
            if (p.type === 'Identifier') return p.name;
            if (p.type === 'ObjectPattern') {
                const keys = p.properties.map(prop => {
                    if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') return prop.key.name;
                    return '?';
                });
                return `{ ${keys.join(', ')} }`;
            }
            return 'arg';
        });

        ctx.nodes.push({
            id: nodeId,
            type: 'functionCallNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: `Definition: ${funcName}`,
                args: params,
                isDecl: true,
                isAsync: !!stmt.async,
                isExported: !!ctx.isExporting || !!ctx.isExportingDefault,
                usageCount: 0,
                scopeId: ctx.currentScopeId
            }
        });

        ctx.variableNodes[`decl:${funcName}`] = nodeId;

        // Process function parameters as nodes available inside the body scope
        const paramNodes: AppNode[] = [];

        stmt.params.forEach((p) => {
            if (p.type === 'Identifier') {
                const varName = p.name;
                const pNodeId = generateId('param-' + varName);
                paramNodes.push({
                    id: pNodeId,
                    type: 'variableNode',
                    position: { x: 0, y: 0 },
                    data: {
                        label: varName,
                        value: '(parameter)',
                        isParameter: true // Visual hint
                    }
                } as AppNode);
            } else if (p.type === 'ObjectPattern') {
                const processParamPattern = (
                    pattern: t.ObjectPattern,
                    sourceLabel: string,
                    sourceConnect?: (targetId: string, targetHandle: string) => void
                ): string => {
                    const destrId = generateId('param-destr');
                    const destructuringKeys: string[] = [];

                    pattern.properties.forEach((prop) => {
                        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                            destructuringKeys.push(prop.key.name);
                        }
                    });

                    paramNodes.push({
                        id: destrId,
                        type: 'destructuringNode',
                        position: { x: 0, y: 0 },
                        data: {
                            label: 'Parameters',
                            destructuringKeys,
                            destructuringSource: sourceLabel,
                            scopeId: undefined // Will be set by processBlock? No, paramNodes are initialNodes. 
                            // Usually processBlock expects nodes with undefined scopeId to assign them? 
                            // Or rather, we should let processBlock handle it? 
                            // Let's check logic/parser/Logic.ts processBlock. 
                            // It iterates initialNodes and pushes them to ctx.nodes. 
                            // It sets scopeId if missing? 
                            // Actually, I should leave it undefined or set to body scope? 
                            // The body scope is created by processBlock. 
                            // Let's assume processBlock is smart enough or we set it later.
                            // For now, undefined is fine as they are "floating" until attached.
                        }
                    } as AppNode);

                    if (sourceConnect) {
                        sourceConnect(destrId, 'input');
                    }

                    // Process props
                    pattern.properties.forEach((prop) => {
                        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                            const key = prop.key.name;

                            if (prop.value.type === 'Identifier') {
                                // Variable
                                const targetVarName = prop.value.name;
                                const pNodeId = generateId('param-' + targetVarName);

                                paramNodes.push({
                                    id: pNodeId,
                                    type: 'variableNode',
                                    position: { x: 0, y: 0 },
                                    data: {
                                        label: targetVarName,
                                        value: '(destructured)',
                                        isParameter: true
                                    }
                                } as AppNode);

                                // Connect Destr -> Var
                                // Edges must be pushed to ctx.edges directly?
                                // Yes, processBlock handles nodes, but edges might need manual handling if not "flow".
                                // paramNodes are internal to the block. Edges between them should be in ctx.edges?
                                // Or should we return edges?
                                // processBlock doesn't take edges array.
                                // We must push to ctx.edges.
                                ctx.edges.push({
                                    id: `e-${destrId}-${key}-to-${pNodeId}`,
                                    source: destrId,
                                    sourceHandle: key,
                                    target: pNodeId,
                                    targetHandle: 'ref-target',
                                    animated: true,
                                    style: { strokeWidth: 2, stroke: '#a855f7' }
                                });
                            } else if (prop.value.type === 'ObjectPattern') {
                                // Recurse
                                processParamPattern(
                                    prop.value,
                                    key,
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
                                    }
                                );
                            }
                        }
                    });

                    return destrId;
                };

                processParamPattern(p, 'Arguments');
            }
        });

        // Process function body into a separate scope for drill-down
        if (stmt.body) {
            ctx.processBlock(stmt.body, nodeId, 'body', 'Body', paramNodes);
        }

        if (parentId && handleName) {
            ctx.edges.push({
                id: `flow-${parentId}-${nodeId}`,
                source: parentId,
                sourceHandle: handleName,
                target: nodeId,
                targetHandle: 'flow-in',
                animated: false,
                type: 'step',
                style: { stroke: '#555', strokeWidth: 2, strokeDasharray: '4,4' }
            });
        }

        return nodeId;
    }
};
