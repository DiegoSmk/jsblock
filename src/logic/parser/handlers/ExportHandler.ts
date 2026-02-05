import type { ParserContext, ParserHandler } from '../types';
import type { Node as BabelNode, ExportNamedDeclaration } from '@babel/types';

export const ExportHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, _parentId?: string, _handleName?: string, idSuffix?: string) => {
        const nodeId = idSuffix ? `export-${ctx.nodes.length}-${idSuffix}` : `export-${ctx.nodes.length}`;

        let label = 'export';
        let exportType: 'named' | 'default' = 'named';

        if (node.type === 'ExportDefaultDeclaration') {
            exportType = 'default';
            label = 'export default';
            // We might want to parse the decl here as well if it's a function/class
        } else {
            const stmt = node as ExportNamedDeclaration;
            if (stmt.declaration) {
                // Handle export const x = ...
                // This is tricky because we usually want to show the variable node but marked as exported.
                // For now, let's just parse the inner declaration.

                // We'll mark the context as "exporting" or similar?
                // Actually, let's just return the result of parsing the inner stmt.
                return undefined; // TODO: properly handle this
            }
        }

        ctx.nodes.push({
            id: nodeId,
            type: 'exportNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label,
                exportType,
                scopeId: ctx.currentScopeId
            }
        });

        return undefined;
    }
};
