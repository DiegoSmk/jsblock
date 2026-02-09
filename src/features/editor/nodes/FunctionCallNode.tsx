import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Hash, Plus, ExternalLink, Activity, Clock } from 'lucide-react';
import type { AppNode, AppNodeData } from '../types';
import type { Edge } from '@xyflow/react';

export const FunctionCallNode = memo(({ id, data }: { id: string, data: AppNodeData }) => {
    const theme = useStore((state) => state.theme);
    const runtimeValues = useStore((state) => state.runtimeValues);
    const edges = useStore(useShallow(useCallback(state =>
        state.edges.filter(edge => edge.target === id),
        [id])));
    const addFunctionCall = useStore((state) => state.addFunctionCall);
    const navigateInto = useStore((state) => state.navigateInto);
    const updateNodeData = useStore((state) => state.updateNodeData);

    const handleEnterScope = () => {
        const scope = data.scopes?.body;
        if (scope) {
            navigateInto(scope.id, scope.label);
        }
    };

    const isDark = theme === 'dark';
    const isConsoleLog = typeof data.label === 'string' && data.label.includes('console.log');
    const isDecl = data.isDecl;
    const isAsync = data.isAsync;
    const isAwait = data.isAwait;

    const BUILTIN_COLORS: Record<string, string> = {
        'console.log': '#4fc3f7',
        'console.warn': '#ffca28',
        'console.error': '#f44336',
        'alert': '#ff9800',
        'prompt': '#9c27b0',
        'confirm': '#3f51b5',
        'parseInt': '#607d8b',
        'parseFloat': '#607d8b',
        'isNaN': '#e91e63',
        'setTimeout': '#795548',
        'setInterval': '#795548',
    };

    const getBuiltinColor = (label: string): string | null => {
        if (BUILTIN_COLORS[label]) return BUILTIN_COLORS[label];
        if (label.startsWith('Math.')) return '#8bc34a';
        if (label.startsWith('JSON.')) return '#00bcd4';
        return null;
    };

    const builtinColor = data.label ? getBuiltinColor(data.label) : null;
    const isBuiltin = !!builtinColor;

    const getHeaderLabel = (): string => {
        if (isDecl) return 'Definition';
        if (isBuiltin) return data.label ?? '';
        return 'Function Call';
    };

    const args = data.args ?? [];
    const isStandalone = data.isStandalone;
    const connectedValues = data.connectedValues ?? {};

    const getArgValue = (argIndex: number): string | null => {
        const targetHandle = `arg-${argIndex}`;
        const edge = edges.find((e: Edge) => e.target === id && e.targetHandle === targetHandle);

        if (edge) {
            const nodes = useStore.getState().nodes;
            const sourceNode = nodes.find((n: AppNode) => n.id === edge.source);
            if (!sourceNode) return null;

            if (sourceNode.type === 'variableNode') {
                const varName = String(sourceNode.data.label);
                const val = runtimeValues[varName] as string | number | boolean | undefined;
                return val !== undefined ? String(val) : varName;
            }

            if (sourceNode.type === 'functionCallNode') {
                const val = runtimeValues[sourceNode.id] as string | number | boolean | undefined;
                return val !== undefined ? String(val) : '...';
            }
        }

        if (connectedValues[argIndex]) {
            return connectedValues[argIndex];
        }

        return null;
    };

    const getReturnValue = (): string | null => {
        const val = runtimeValues[id] as string | number | boolean | undefined;
        return val !== undefined ? String(val) : null;
    };

    const returnValue = getReturnValue();
    const hasError = !isDecl && !isConsoleLog && args.length > 0 && args.some((_, i) => getArgValue(i) === null);

    const identityColor = isDecl ? '#4caf50' : (builtinColor ?? '#f472b6');
    const hasBody = !!data.scopes?.body;

    return (
        <div className="premium-node" style={{
            minWidth: '350px',
            borderStyle: isDecl ? 'dashed' : 'solid',
            borderColor: hasError ? '#f43f5e' : 'var(--border-node)',
        }}>
            {/* Header */}
            <div className="node-header" style={{
                background: isDecl
                    ? (isDark ? 'linear-gradient(to right, #14532d, #166534)' : 'linear-gradient(to right, #f0fdf4, #dcfce7)')
                    : (isDark ? 'linear-gradient(to right, #1e293b, #334155)' : 'linear-gradient(to right, #f1f5f9, #e2e8f0)'),
                color: isDecl ? (isDark ? '#4ade80' : '#166534') : (isDark ? '#fff' : '#475569'),
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px'
            }}>
                <Activity size={14} strokeWidth={2.5} />
                <span>{isBuiltin ? '' : getHeaderLabel()}</span>

                {!isDecl && isStandalone && (
                    <>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="flow-in"
                            className="handle-flow"
                            style={{ left: '-6px', top: '24px' }}
                        />
                        {!data.isReturn && (
                            <Handle
                                type="source"
                                position={Position.Right}
                                id="flow-next"
                                className="handle-flow"
                                style={{ right: '-6px', top: '24px' }}
                            />
                        )}
                    </>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                    {isDecl && isAsync && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(124, 58, 237, 0.2)',
                            color: '#a78bfa',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: 800
                        }}>
                            <Clock size={10} /> ASYNC
                        </div>
                    )}
                    {!isDecl && isAwait && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(234, 179, 8, 0.2)',
                            color: '#facc15',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: 800
                        }}>
                            <Clock size={10} /> AWAIT
                        </div>
                    )}
                    {isDecl && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(76,175,80,0.2)',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: 800
                        }}>
                            <Hash size={10} /> {data.usageCount ?? 0}
                        </div>
                    )}
                    <span style={{ color: identityColor, fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace' }}>
                        {(data.label ?? '').replace('Definition: ', '')}()
                    </span>
                    {/* Reference Handles */}
                    {isDecl ? (
                        <>
                            <Handle type="source" position={Position.Top} id="ref-source" className="handle-data" style={{ top: '-10px', right: '10px', background: '#4caf50' }} />
                            <Handle type="target" position={Position.Top} id="ref-target" className="handle-data" style={{ top: '-10px', left: '10px', opacity: 0, pointerEvents: 'none' }} />
                        </>
                    ) : (
                        <Handle type="target" position={Position.Top} id="ref-target" className="handle-data" style={{ top: '-10px', right: '10px', background: isBuiltin ? '#f7df1e' : '#4caf50' }} />
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="node-content">
                {isDecl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                            <input
                                type="checkbox"
                                checked={!!isAsync}
                                onChange={(e) => updateNodeData(id, { isAsync: e.target.checked })}
                                style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: isDark ? '#ddd' : '#555', fontWeight: 600 }}>Async Function</span>
                        </div>
                        {args.length > 0 && (
                            <div style={{ padding: '12px', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                                <div style={{ fontSize: '0.65rem', color: isDark ? '#81c784' : '#4caf50', marginBottom: '8px', fontWeight: 800, letterSpacing: '0.05em' }}>Arguments</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {args.map((arg) => (
                                        <div key={`arg-${arg}`} style={{ background: 'rgba(76,175,80,0.1)', color: '#81c784', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'monospace' }}>{arg}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                if (addFunctionCall) {
                                    addFunctionCall(data.label?.replace('Definition: ', '') ?? '', data.args);
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                background: 'rgba(76,175,80,0.1)',
                                border: '2px dashed #4caf50',
                                borderRadius: '12px',
                                padding: '12px',
                                color: '#4caf50',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(76,175,80,0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(76,175,80,0.1)'}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <Plus size={16} /> Add Call Reference
                        </button>
                    </div>
                )}
                {!isDecl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {args.map((arg, i) => {
                            const value = getArgValue(i);
                            const argKey = `${arg}-pos-${i}`;
                            return (
                                <div key={argKey} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Handle type="target" position={Position.Left} id={`arg-${i}`} className="handle-data target" style={{ left: '-12px' }} />
                                        <span style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{arg}</span>
                                    </div>
                                    {value !== null && (
                                        <div style={{ fontSize: '0.9rem', background: isDark ? 'rgba(0,0,0,0.3)' : '#f1f5f9', padding: '4px 10px', borderRadius: '6px', color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 800, fontFamily: 'monospace' }}>{value}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Action / Return Info */}
            <div style={{
                background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
                borderTop: `1px solid var(--border-node)`,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Return Value Section (if standalone call) */}
                {!isDecl && !isConsoleLog && (
                    <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: data.hasReturn ? 1 : 0.5 }}>
                            <div style={{ fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Return Value</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {returnValue !== null && <span style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: 800 }}>{returnValue}</span>}
                                <Handle type="source" position={Position.Right} id="return" className="handle-data" style={{ right: '-8px' }} />
                            </div>
                        </div>
                        {isStandalone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, paddingTop: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={!!isAwait}
                                    onChange={(e) => updateNodeData(id, { isAwait: e.target.checked })}
                                    style={{ accentColor: '#eab308', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: isDark ? '#fbbf24' : '#d97706', fontWeight: 700 }}>Await Result</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Scope Entrance Action */}
                {hasBody && (
                    <button
                        onClick={handleEnterScope}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
                            border: 'none',
                            color: '#4caf50',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',

                            letterSpacing: '0.05em',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)'}
                    >
                        <ExternalLink size={14} />
                        Inside Logic
                    </button>
                )}
            </div>
        </div>
    );
});

FunctionCallNode.displayName = 'FunctionCallNode';
