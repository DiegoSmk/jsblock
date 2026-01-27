
import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId, isNativeApi } from '../utils';

export const CallHandler: ParserHandler = {
    canHandle: (stmt: any) => {
        const expr = stmt.type === 'ExpressionStatement' ? stmt.expression : stmt;
        return expr.type === 'CallExpression';
    },
    handle: (stmt: any, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const expr = stmt.type === 'ExpressionStatement' ? stmt.expression : stmt;
        const callee = expr.callee;
        let label = 'function';

        // standalone calls use call-exec while nested calls use call-
        const prefix = stmt.type === 'ExpressionStatement' ? 'call-exec' : 'call';
        const nodeId = idSuffix ? `${prefix}-${idSuffix}` : generateId(prefix);

        if (callee.type === 'MemberExpression') {
            const obj = callee.object;
            const prop = callee.property;
            if (obj.type === 'Identifier' && prop.type === 'Identifier') {
                label = `${obj.name}.${prop.name}`;
            }
        } else if (callee.type === 'Identifier') {
            label = callee.name;
        }


        const isNative = isNativeApi(label);
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
        } else if (callee.type === 'Identifier') {
            const declId = ctx.variableNodes[`decl:${callee.name}`];
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

        const args = expr.arguments.map((arg: any) => {
            if (arg.type === 'StringLiteral') return `'${arg.value}'`;
            if (arg.type === 'NumericLiteral') return String(arg.value);
            if (arg.type === 'Identifier') return arg.name;
            if (arg.type === 'TemplateLiteral') return '`...`';
            return '...';
        });

        // Try to propagate scope from definition to call node for easier navigation
        const scopes: Record<string, any> = {};
        const declId = ctx.variableNodes[`decl:${label}`];
        if (declId) {
            const declNode = ctx.nodes.find(n => n.id === declId);
            if (declNode && (declNode.data as any).scopes?.['body']) {
                scopes['body'] = (declNode.data as any).scopes['body'];
            }
        }

        ctx.nodes.push({
            id: nodeId,
            type: 'functionCallNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label,
                args,
                hasReturn: true,
                isStandalone: !parentId,
                scopeId: ctx.currentScopeId,
                scopes,
                expression: ctx.body ? '' : 'fallback'
            },
        } as any);

        if (parentId && handleName) {
            ctx.edges.push(createEdge(parentId, nodeId, handleName, 'flow-in'));
        }

        expr.arguments.forEach((arg: any, i: number) => {
            if (arg.type === 'Identifier') {
                const sourceId = ctx.variableNodes[arg.name];
                if (sourceId) {
                    ctx.edges.push(createEdge(sourceId, nodeId, 'output', `arg-${i}`));
                }
            } else if (arg.type === 'NumericLiteral' || arg.type === 'StringLiteral' || arg.type === 'BooleanLiteral') {
                const litId = generateId('literal');
                const value = String(arg.value);
                const type = arg.type === 'NumericLiteral' ? 'number' : (arg.type === 'BooleanLiteral' ? 'boolean' : 'string');

                ctx.nodes.push({
                    id: litId,
                    type: 'literalNode',
                    position: { x: 0, y: 0 },
                    parentId: ctx.currentParentId,
                    data: { label: type, value, type, scopeId: ctx.currentScopeId }
                } as any);

                ctx.edges.push(createEdge(litId, nodeId, 'output', `arg-${i}`));
            } else if (arg.type === 'TemplateLiteral') {
                // Connect expressions inside the template literal to the argument handle
                arg.expressions.forEach((expr: any) => {
                    if (expr.type === 'Identifier') {
                        const sourceId = ctx.variableNodes[expr.name];
                        if (sourceId) {
                            ctx.edges.push(createEdge(sourceId, nodeId, 'output', `arg-${i}`));
                        }
                    } else if (expr.type === 'CallExpression') {
                        // Nested calls in template literals?
                        // For now, simpler support: if it's a simple identifier
                    }
                });
            }
        });

        return nodeId;
    }
};
