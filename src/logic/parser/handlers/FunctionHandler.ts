import type { ParserContext, ParserHandler } from '../types';
import { generateId } from '../utils';
import type { Node as BabelNode, FunctionDeclaration } from '@babel/types';
import type { AppNode } from '../../../types/store';

export const FunctionHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'FunctionDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, _parentId?: string, _handleName?: string, idSuffix?: string) => {
        const stmt = node as FunctionDeclaration;
        if (!stmt.id) return undefined;

        const funcName = stmt.id.name;
        const nodeId = idSuffix ? `func-${funcName}-${idSuffix}` : `func-${funcName}`;

        const params = stmt.params.map((p) =>
            p.type === 'Identifier' ? p.name : 'arg'
        );

        ctx.nodes.push({
            id: nodeId,
            type: 'functionCallNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: `Definition: ${funcName}`,
                args: params,
                isDecl: true,
                usageCount: 0,
                scopeId: ctx.currentScopeId
            }
        });

        ctx.variableNodes[`decl:${funcName}`] = nodeId;

        // Process function parameters as nodes available inside the body scope
        const paramNodes: AppNode[] = stmt.params.map((p) => {
            if (p.type === 'Identifier') {
                const varName = p.name;
                const pNodeId = generateId('param-' + varName);
                return {
                    id: pNodeId,
                    type: 'variableNode',
                    position: { x: 0, y: 0 },
                    data: {
                        label: varName,
                        value: '(parameter)',
                        isParameter: true // Visual hint
                    }
                } as AppNode;
            }
            return null;
        }).filter((n): n is AppNode => n !== null);

        // Process function body into a separate scope for drill-down
        if (stmt.body) {
            ctx.processBlock(stmt.body, nodeId, 'body', 'Body', paramNodes);
        }

        return undefined;
    }
};

