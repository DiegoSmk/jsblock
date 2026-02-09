import type { ParserContext, ParserHandler } from '../types';
import type { Node as BabelNode, ImportDeclaration } from '@babel/types';
import * as t from '@babel/types';

export const ImportHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ImportDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, _parentId?: string, _handleName?: string, idSuffix?: string) => {
        const stmt = node as ImportDeclaration;
        const source = stmt.source.value;
        const nodeId = idSuffix ? `import-${ctx.nodes.length}-${idSuffix}` : `import-${ctx.nodes.length}`;

        const specifiers = stmt.specifiers.map(s => {
            if (s.type === 'ImportSpecifier') {
                const importedName = t.isIdentifier(s.imported) ? s.imported.name : (t.isStringLiteral(s.imported) ? s.imported.value : 'unknown');
                return {
                    local: s.local.name,
                    imported: importedName,
                    type: 'named'
                };
            } else if (s.type === 'ImportDefaultSpecifier') {
                return {
                    local: s.local.name,
                    type: 'default'
                };
            } else if (s.type === 'ImportNamespaceSpecifier') {
                return {
                    local: s.local.name,
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

        // Register local names in variableNodes with a prefix to allow targeted connections
        specifiers.forEach(s => {
            if (s?.local) {
                ctx.variableNodes[`import:${s.local}`] = nodeId;
            }
        });



        return nodeId;
    }
};
