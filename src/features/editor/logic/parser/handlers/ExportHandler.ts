import type { ParserContext, ParserHandler } from '../types';
import type { Node as BabelNode, ExportNamedDeclaration, ExportDefaultDeclaration } from '@babel/types';

export const ExportHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const index = idSuffix && !isNaN(parseInt(idSuffix)) ? parseInt(idSuffix) : undefined;

        if (node.type === 'ExportNamedDeclaration') {
            const stmt = node;
            if (stmt.declaration && ctx.parseStatement) {
                ctx.isExporting = true;
                const result = ctx.parseStatement(stmt.declaration, parentId, handleName, index);
                ctx.isExporting = false;
                return result;
            }
        }

        if (node.type === 'ExportDefaultDeclaration') {
            const stmt = node;
            if (stmt.declaration && ctx.parseStatement) {
                ctx.isExportingDefault = true;
                const result = ctx.parseStatement(stmt.declaration, parentId, handleName, index);
                ctx.isExportingDefault = false;

                if (result) return result;
            }
        }

        const nodeId = idSuffix ? `export-${ctx.nodes.length}-${idSuffix}` : `export-${ctx.nodes.length}`;

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
