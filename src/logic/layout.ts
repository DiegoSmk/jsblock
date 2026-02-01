import * as dagre from 'dagre';
import type { Edge } from '@xyflow/react';
import { Position } from '@xyflow/react';
import type { AppNode } from '../types/store';

export const getLayoutedElements = (nodes: AppNode[], edges: Edge[]) => {
    const scopes: Record<string, AppNode[]> = {};
    nodes.forEach(node => {
        const scopeId = node.data.scopeId ?? 'root';
        if (!scopes[scopeId]) scopes[scopeId] = [];
        scopes[scopeId].push(node);
    });

    const processedNodes: AppNode[] = [];
    const PADDING = 60;

    Object.keys(scopes).forEach(scopeId => {
        const allNodes = scopes[scopeId].filter(n => n.type !== 'groupNode' && n.id !== 'node-js-runtime');

        // 1. Separate Definitions from Flow
        const definitions = allNodes.filter(n => n.data.isDecl);
        const flowNodes = allNodes.filter(n => !n.data.isDecl);

        // 2. Position Definitions in a dedicated vertical column on the left
        definitions.forEach((node, i) => {
            processedNodes.push({
                ...node,
                position: { x: -600, y: i * 400 }
            });
        });

        if (flowNodes.length === 0) return;

        // 3. Layout Flow Nodes using Dagre
        const g = new dagre.graphlib.Graph();
        g.setDefaultEdgeLabel(() => ({}));
        g.setGraph({ rankdir: 'LR' /* eslint-disable-line no-restricted-syntax */, nodesep: 60, ranksep: 100, marginx: 50, marginy: 50 });

        flowNodes.forEach(node => {
            let width = 350;
            let height = 150;
            if (node.type === 'logicNode') { width = 50; height = 50; }
            else if (node.type === 'literalNode') { width = 180; height = 60; }
            else if (node.type === 'variableNode') {
                width = 320;
                height = !!node.data.nestedCall || node.data.value === '(computed)' ? 180 : 120;
            }
            else if (node.type === 'functionCallNode') {
                width = 350;
                const argCount = node.data.args?.length ?? 0;
                height = 100 + (argCount * 40);
            }
            else if (node.type === 'ifNode' || node.type === 'forNode' || node.type === 'whileNode') {
                width = 250;
                height = 250;
            }
            g.setNode(node.id, { width, height });
        });

        const flowNodeIds = new Set(flowNodes.map(n => n.id));
        edges.forEach(edge => {
            if (flowNodeIds.has(edge.source) && flowNodeIds.has(edge.target)) {
                g.setEdge(edge.source, edge.target);
            }
        });

        dagre.layout(g);

        flowNodes.forEach(node => {
            const pos = g.node(node.id);
            processedNodes.push({
                ...node,
                targetPosition: Position.Left,
                sourcePosition: Position.Right,
                position: {
                    x: pos.x - pos.width / 2,
                    y: pos.y - pos.height / 2,
                }
            });
        });
    });

    const runtimeNode = nodes.find(n => n.id === 'node-js-runtime');
    if (runtimeNode) processedNodes.push({ ...runtimeNode, position: { x: 500, y: -200 } });

    const nodesWithGroups: AppNode[] = [...processedNodes];
    nodes.filter(n => n.type === 'groupNode').forEach(group => {
        const children = processedNodes.filter(n => n.parentId === group.id);
        if (children.length > 0) {
            const minX = Math.min(...children.map(c => c.position.x));
            const minY = Math.min(...children.map(c => c.position.y));
            const maxX = Math.max(...children.map(c => c.position.x + 300));
            const maxY = Math.max(...children.map(c => c.position.y + 150));

            nodesWithGroups.push({
                ...group,
                position: { x: minX - PADDING, y: minY - PADDING },
                style: { width: (maxX - minX) + PADDING * 2, height: (maxY - minY) + PADDING * 2, zIndex: -1 }
            });
        }
    });

    return {
        nodes: nodesWithGroups.map(node => {
            if (node.parentId) {
                const parent = nodesWithGroups.find(p => p.id === node.parentId);
                if (parent) {
                    return { ...node, position: { x: node.position.x - parent.position.x, y: node.position.y - parent.position.y } };
                }
            }
            return node;
        }),
        edges
    };
};
