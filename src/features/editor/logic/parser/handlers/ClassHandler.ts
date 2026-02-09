import type { ParserContext, ParserHandler } from '../types';
import { generateId } from '../utils';
import type { Node as BabelNode, ClassDeclaration } from '@babel/types';
import type { AppNode } from '../../../types';

export const ClassHandler: ParserHandler = {
    canHandle: (node: BabelNode) => node.type === 'ClassDeclaration',
    handle: (node: BabelNode, ctx: ParserContext, parentId?: string, handleName?: string, idSuffix?: string) => {
        const stmt = node as ClassDeclaration;
        const className = stmt.id ? stmt.id.name : 'default';
        const classNodeId = idSuffix ? `class-${className}-${idSuffix}` : `class-${className}`;

        let extendsClause: string | undefined = undefined;
        if (stmt.superClass) {
            if (stmt.superClass.type === 'Identifier') {
                extendsClause = stmt.superClass.name;
            } else if (stmt.superClass.type === 'MemberExpression' &&
                stmt.superClass.object.type === 'Identifier' &&
                stmt.superClass.property.type === 'Identifier') {
                extendsClause = `${stmt.superClass.object.name}.${stmt.superClass.property.name}`;
            }
        }

        // Create Class Node
        const classNode: AppNode = {
            id: classNodeId,
            type: 'classNode',
            position: { x: 0, y: 0 },
            parentId: ctx.currentParentId,
            data: {
                label: className,
                extends: extendsClause,
                scopeId: ctx.currentScopeId,
                isDecl: true,
                isExported: !!ctx.isExporting || !!ctx.isExportingDefault
            },
            style: { width: 400, height: 300 }
        };

        ctx.nodes.push(classNode);
        ctx.variableNodes[`decl:${className}`] = classNodeId;

        // Process Class Body
        const body = stmt.body;
        if (body?.type === 'ClassBody') {
            let methodY = 60;
            body.body.forEach((member) => {
                if (member.type === 'ClassMethod') {
                    const method = member;
                    if (method.key.type === 'Identifier') {
                        const methodName = method.key.name;
                        const methodId = generateId(`method-${className}-${methodName}`);

                        const params = method.params.map((p) =>
                            p.type === 'Identifier' ? p.name : 'arg'
                        );

                        const isStatic = method.static;
                        const kind = method.kind; // "constructor" | "method" | "get" | "set"

                        const methodNode: AppNode = {
                            id: methodId,
                            type: 'methodNode',
                            position: { x: 20, y: methodY },
                            parentId: classNodeId,
                            data: {
                                label: methodName,
                                args: params,
                                isStatic,
                                kind,
                                scopeId: ctx.currentScopeId
                            }
                        };

                        methodY += 120; // Increment Y for next method

                        ctx.nodes.push(methodNode);

                        // Process method parameters
                        const paramNodes: AppNode[] = method.params.map((p) => {
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
                                        isParameter: true
                                    }
                                } as AppNode;
                            }
                            return null;
                        }).filter((n): n is AppNode => n !== null);

                        // Process method body
                        if (method.body) {
                            ctx.processBlock(method.body, methodId, 'body', `Method: ${methodName}`, paramNodes);
                        }
                    }
                }
            });
            // Update class height based on methods
            classNode.style = { width: 400, height: Math.max(300, methodY + 50) };
        }

        return classNodeId;
    }
};
