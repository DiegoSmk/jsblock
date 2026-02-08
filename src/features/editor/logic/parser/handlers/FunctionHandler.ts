import type { ParserContext, ParserHandler } from '../types';
import { generateId } from '../utils';
import type { Node as BabelNode, FunctionDeclaration } from '@babel/types';
import type { AppNode } from '../../../types';

export const FunctionHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'FunctionDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const stmt = node as FunctionDeclaration;
        if (!stmt.id) return undefined;

        const funcName = stmt.id.name;
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
                const destrId = generateId('param-destr');
                const destructuringKeys: string[] = [];

                p.properties.forEach((prop) => {
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
                        destructuringSource: 'Arguments',
                        // scopeId will be set by processBlock?
                        // Usually processBlock iterates initialNodes and adds them.
                    }
                } as AppNode);

                p.properties.forEach((prop) => {
                     if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                        const varName = prop.key.name;
                        let targetVarName = varName;
                        if (prop.value.type === 'Identifier') {
                            targetVarName = prop.value.name;
                        }

                        const pNodeId = generateId('param-' + targetVarName);

                        paramNodes.push({
                            id: pNodeId,
                            type: 'variableNode',
                            position: { x: 0, y: 0 },
                            data: {
                                label: targetVarName,
                                value: '(destructured)',
                                nestedCall: { name: 'Destructured', args: [] },
                                isParameter: true
                            }
                        } as AppNode);

                        // Connect DestructuringNode to VariableNode
                        ctx.edges.push({
                            id: `e-${destrId}-${varName}-to-${pNodeId}`,
                            source: destrId,
                            sourceHandle: varName,
                            target: pNodeId,
                            targetHandle: 'ref-target',
                            animated: true,
                            style: { strokeWidth: 2, stroke: '#a855f7' }
                        });
                     }
                });
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
