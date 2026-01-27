
import type { ParserContext, ParserHandler } from '../types';
import { createEdge, generateId } from '../utils';

export const SwitchHandler: ParserHandler = {
    canHandle: (stmt: any) => stmt.type === 'SwitchStatement',
    handle: (stmt: any, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const nodeId = idSuffix ? `switch-${idSuffix}` : generateId('switch');

        // Map Cases for UI
        const cases = stmt.cases.map((c: any) => {
            if (c.test) {
                if (c.test.type === 'NumericLiteral' || c.test.type === 'StringLiteral') return String(c.test.value);
                return 'case';
            }
            return 'default';
        });

        ctx.nodes.push({
            id: nodeId,
            type: 'switchNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: 'Switch',
                cases,
                scopeId: ctx.currentScopeId
            }
        } as any);

        if (parentId && handleName) {
            ctx.edges.push(createEdge(parentId, nodeId, handleName, 'flow-in'));
        }

        // Link Discriminant
        const disc = stmt.discriminant;
        if (disc.type === 'Identifier' && ctx.variableNodes[disc.name]) {
            ctx.edges.push(createEdge(ctx.variableNodes[disc.name], nodeId, 'output', 'discriminant'));
        }

        // Process Nested Cases with Scoping
        stmt.cases.forEach((c: any, i: number) => {
            const handleId = `case-${i}`;
            const caseLabel = c.test ? `Case ${cases[i]}` : 'Default';

            if (c.consequent && c.consequent.length > 0) {
                // Wrap consequent array in a block structure for the processBlock utility
                const dummyBlock = { type: 'BlockStatement', body: c.consequent };
                ctx.processBlock(dummyBlock, nodeId, handleId, caseLabel);
            }
        });

        return nodeId;
    }
};
