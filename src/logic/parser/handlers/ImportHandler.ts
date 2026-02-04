import type { ParserContext, ParserHandler } from '../types';
import type { Node as BabelNode, ImportDeclaration } from '@babel/types';
import * as t from '@babel/types';

export const ImportHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ImportDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const stmt = node as ImportDeclaration;
        const source = stmt.source.value;
        const nodeId = idSuffix ? `import-${ctx.nodes.length}-${idSuffix}` : `import-${ctx.nodes.length}`;

        const specifiers = stmt.specifiers.map(s => {
            if (s.type === 'ImportSpecifier') {
                return {
                    local: (s.local as t.Identifier).name,
                    imported: (s.imported as t.Identifier).name,
                    type: 'named'
                };
            } else if (s.type === 'ImportDefaultSpecifier') {
                return {
                    local: (s.local as t.Identifier).name,
                    type: 'default'
                };
            } else if (s.type === 'ImportNamespaceSpecifier') {
                return {
                    local: (s.local as t.Identifier).name,
                    type: 'namespace'
                };
            }
            return null;
        }).filter(Boolean);

        ctx.nodes.push({
            id: nodeId,
            type: 'importNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: `import from '${source}'`,
                source,
                specifiers,
                scopeId: ctx.currentScopeId
            }
        });

        // Register local names in variableNodes to allow connections
        specifiers.forEach(s => {
            if (s && s.local) {
                ctx.variableNodes[s.local] = nodeId;
            }
        });

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
