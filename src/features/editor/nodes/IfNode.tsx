import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../../../store/useStore';
import { ExternalLink, Split } from 'lucide-react';

import type { AppNodeData } from '../types';

export const IfNode = memo(({ data }: { id: string, data: AppNodeData }) => {
    const theme = useStore((state) => state.theme);
    const navigateInto = useStore((state) => state.navigateInto);
    const isDark = theme === 'dark';

    const handleEnterScope = (flowHandle: string) => {
        const scopes = data.scopes ?? {};
        const scope = scopes[flowHandle];
        if (scope) {
            navigateInto(scope.id, scope.label);
        }
    };

    return (
        <div className="premium-node" style={{ minWidth: '220px' }}>
            {/* Header */}
            <div className="node-header" style={{
                background: isDark ? 'linear-gradient(to right, #d35400, #e67e22)' : 'linear-gradient(to right, #e67e22, #f39c12)',
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px'
            }}>
                <Split size={14} strokeWidth={2.5} />
                <span>If Condition</span>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="flow-in"
                    className="handle-flow"
                    style={{ left: '-6px', top: '24px' }}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="flow-next"
                    className="handle-flow"
                    style={{ right: '-6px', top: '24px' }}
                />
            </div>

            <div className="node-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Condition Input */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '8px' }}>
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="condition"
                        className="handle-data target"
                        style={{
                            left: '-18px',
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#f48fb1' : '#ad1457', letterSpacing: '0.05em' }}>Condition</span>
                </div>

                {/* Flow Outputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[{ h: 'flow-true', c: '#4caf50', l: 'True' }, { h: 'flow-false', c: '#94a3b8', l: 'False' }].map(item => {
                        const scope = data.scopes?.[item.h];
                        const hasScope = !!scope;
                        return (
                            <div key={item.h} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    onClick={() => handleEnterScope(item.h)}
                                    disabled={!hasScope}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: hasScope ? 'pointer' : 'default',
                                        color: item.c,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        opacity: hasScope ? 1 : 0.4,
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => hasScope && (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <ExternalLink size={12} />
                                    {item.l}
                                </button>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={item.h}
                                    className="handle-flow"
                                    style={{
                                        right: '-6px',
                                        borderLeftColor: item.c,
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

IfNode.displayName = 'IfNode';
