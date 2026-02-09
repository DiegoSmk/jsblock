import type { ParserContext, ParserHandler } from '../types';
import type { Node as BabelNode } from '@babel/types';

export const ExportHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const nodeId = idSuffix ? `export-${ctx.nodes.length}-${idSuffix}` : `export-${ctx.nodes.length}`;

        if (node.type === 'ExportNamedDeclaration') {
            const stmt = node;
            if (stmt.declaration) {
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

        let label = 'Export';
        let exportType: 'named' | 'default' = 'named';
        const specifiers: { local: string; exported: string }[] = [];

        if (node.type === 'ExportDefaultDeclaration') {
            exportType = 'default';
            label = 'Export Default';
            const stmt = node;

            // If it's an Identifier, we add a specifier to connect it
            if (stmt.declaration.type === 'Identifier') {
                specifiers.push({ local: stmt.declaration.name, exported: 'default' });
            } else {
                // For expressions like 'export default 123' or 'export default func()',
                // we show '(expression)' as a hint in the ExportNode
                specifiers.push({ local: '(expression)', exported: 'default' });
            }
        } else if (node.type === 'ExportNamedDeclaration') {
            const stmt = node;
            stmt.specifiers.forEach(spec => {
                if (spec.type === 'ExportSpecifier' && spec.local.type === 'Identifier' && spec.exported.type === 'Identifier') {
                    specifiers.push({
                        local: spec.local.name,
                        exported: spec.exported.name
                    });
                }
            });
        }

        ctx.nodes.push({
            id: nodeId,
            type: 'exportNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label,
                exportType,
                specifiers,
                scopeId: ctx.currentScopeId
            }
        });

        // Connect local variables to export node
        specifiers.forEach(spec => {
            const sourceId = ctx.variableNodes[spec.local];
            if (sourceId) {
                // Use a more unique ID for default export handle to avoid confusion
                const targetHandle = spec.exported === 'default' ? 'handle-default-export' : spec.exported;

                ctx.edges.push({
                    id: `e-ref-${sourceId}-to-${nodeId}-spec-${spec.exported}`,
                    source: sourceId,
                    sourceHandle: 'output',
                    target: nodeId,
                    targetHandle: targetHandle,
                    animated: true,
                    style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '5,5' }
                });
            }
        });

        return undefined;
    }
};
