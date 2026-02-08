import type { ParserContext, ParserHandler } from '../types';
import type { Node as BabelNode, ExportNamedDeclaration, ExportDefaultDeclaration } from '@babel/types';
import { VariableHandler } from './VariableHandler';
import { FunctionHandler } from './FunctionHandler';

export const ExportHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const nodeId = idSuffix ? `export-${ctx.nodes.length}-${idSuffix}` : `export-${ctx.nodes.length}`;

        let label = 'export';
        let exportType: 'named' | 'default' = 'named';

        if (node.type === 'ExportDefaultDeclaration') {
            exportType = 'default';
            label = 'export default';

            const stmt = node as ExportDefaultDeclaration;
            if (stmt.declaration) {
                 ctx.isExportingDefault = true;
                 let result: string | undefined = undefined;

                 // Check handlers for declaration
                 if (VariableHandler.canHandle(stmt.declaration as BabelNode)) {
                     result = VariableHandler.handle(stmt.declaration as BabelNode, ctx, parentId, handleName, idSuffix);
                 } else if (FunctionHandler.canHandle(stmt.declaration as BabelNode)) {
                     result = FunctionHandler.handle(stmt.declaration as BabelNode, ctx, parentId, handleName, idSuffix);
                 }
                 // Add other handlers if needed (e.g. ClassHandler)

                 ctx.isExportingDefault = false;
                 if (result) return result;
            }
        } else {
            const stmt = node as ExportNamedDeclaration;
            if (stmt.declaration) {
                // Handle export const x = ...
                ctx.isExporting = true;
                let result: string | undefined = undefined;

                if (VariableHandler.canHandle(stmt.declaration)) {
                    result = VariableHandler.handle(stmt.declaration, ctx, parentId, handleName, idSuffix);
                } else if (FunctionHandler.canHandle(stmt.declaration)) {
                    result = FunctionHandler.handle(stmt.declaration, ctx, parentId, handleName, idSuffix);
                }

                ctx.isExporting = false;
                if (result) return result;

                // If handler didn't return (e.g. unhandled type), fall through?
                // Or maybe just return undefined if it was handled but returned nothing?
                // For now, if result is undefined, we assume it wasn't handled fully or correctly by delegates.
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

        return nodeId; // Return the export node ID if we created one
    }
};
