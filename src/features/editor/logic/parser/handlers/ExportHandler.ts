import type { ParserContext, ParserHandler } from '../types';
import type { Node as BabelNode, ExportNamedDeclaration, ExportDefaultDeclaration } from '@babel/types';
import { VariableHandler } from './VariableHandler';
import { FunctionHandler } from './FunctionHandler';

export const ExportHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        if (node.type === 'ExportNamedDeclaration') {
            const stmt = node as ExportNamedDeclaration;
            if (stmt.declaration) {
                ctx.isExporting = true;
                let result: string | undefined;

                if (VariableHandler.canHandle(stmt.declaration)) {
                    result = VariableHandler.handle(stmt.declaration, ctx, parentId, handleName, idSuffix);
                } else if (FunctionHandler.canHandle(stmt.declaration)) {
                    result = FunctionHandler.handle(stmt.declaration, ctx, parentId, handleName, idSuffix);
                }

                ctx.isExporting = false;

                // If we successfully handled the inner declaration, return its result
                if (result) return result;

                // Fallback for unhandled named declarations (e.g. Class)
                return undefined;
            }
        } else if (node.type === 'ExportDefaultDeclaration') {
            const stmt = node as ExportDefaultDeclaration;
            if (stmt.declaration) {
                ctx.isExportingDefault = true;
                let result: string | undefined;

                const decl = stmt.declaration as BabelNode;
                if (VariableHandler.canHandle(decl)) {
                    result = VariableHandler.handle(decl, ctx, parentId, handleName, idSuffix);
                } else if (FunctionHandler.canHandle(decl)) {
                    result = FunctionHandler.handle(decl, ctx, parentId, handleName, idSuffix);
                }

                ctx.isExportingDefault = false;
                if (result) return result;
            }
        }

        // Handle re-exports or default exports of expressions
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
