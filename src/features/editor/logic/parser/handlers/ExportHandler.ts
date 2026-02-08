import type { ParserContext, ParserHandler } from '../types';
import type { Node as BabelNode } from '@babel/types';

export const ExportHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const nodeId = idSuffix ? `export-${ctx.nodes.length}-${idSuffix}` : `export-${ctx.nodes.length}`;

        if (node.type === 'ExportNamedDeclaration') {
            const stmt = node;
            if (stmt.declaration) {
                // Handle export const x = ...
                ctx.isExporting = true;
                const result = ctx.parseStatement(stmt.declaration, parentId, handleName, undefined, idSuffix);
                ctx.isExporting = false;
                return result;
            }
        }

        if (node.type === 'ExportDefaultDeclaration') {
            const stmt = node;
            if (stmt.declaration) {
                ctx.isExportingDefault = true;
                const result = ctx.parseStatement(stmt.declaration as BabelNode, parentId, handleName, undefined, idSuffix);
                ctx.isExportingDefault = false;
                if (result) return result;
            }
        }

        let label = 'export';
        let exportType: 'named' | 'default' = 'named';

        if (node.type === 'ExportDefaultDeclaration') {
            exportType = 'default';
            label = 'export default';
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

        return nodeId;
    }
};
