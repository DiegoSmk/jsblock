
import type { ParserContext, ParserHandler } from '../types';
import { generateId } from '../utils';

export const FunctionHandler: ParserHandler = {
    canHandle: (stmt: any) => stmt.type === 'FunctionDeclaration',
    handle: (stmt: any, ctx: ParserContext, _parentId?: string, _handleName?: string, idSuffix?: string) => {
        if (!stmt.id) return undefined;

        const funcName = stmt.id?.name || 'anonymous';
        const nodeId = idSuffix ? `func-${funcName}-${idSuffix}` : `func-${funcName}`;

        const params = stmt.params.map((p: any) =>
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
        } as any);

        ctx.variableNodes[`decl:${funcName}`] = nodeId;

        // Process function parameters as nodes available inside the body scope
        const paramNodes = stmt.params.map((p: any) => {
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
                };
            }
            return null;
        }).filter(Boolean);

        // Process function body into a separate scope for drill-down
        if (stmt.body) {
            ctx.processBlock(stmt.body, nodeId, 'body', 'Body', paramNodes as any[]);
        }

        return undefined;
    }
};
