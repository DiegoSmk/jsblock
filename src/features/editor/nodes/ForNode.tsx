import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../../../store/useStore';
import { Repeat, ExternalLink } from 'lucide-react';

import type { AppNodeData } from '../types';

export const ForNode = memo(({ data }: { id: string, data: AppNodeData }) => {
    const theme = useStore((state) => state.theme);
    const navigateInto = useStore((state) => state.navigateInto);
    const isDark = theme === 'dark';

    const handleEnterScope = (flowHandle: string) => {
        const scope = data.scopes?.[flowHandle];
        if (scope) {
            navigateInto(scope.id, scope.label);
        }
    };

    return (
        <div className="premium-node" style={{ minWidth: '220px' }}>
            {/* Header / Flow Entry */}
            <div className="node-header" style={{
                background: isDark ? 'linear-gradient(to right, #00796b, #00897b)' : 'linear-gradient(to right, #00897b, #26a69a)',
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px'
            }}>
                <Repeat size={14} strokeWidth={2.5} />
                <span>For Loop</span>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="flow-in"
                    className="handle-flow"
                    style={{ left: '-6px', top: '24px' }}
                />
            </div>

            <div className="node-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                {/* Initialization Input */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', padding: '8px', borderRadius: '8px' }}>
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="init"
                        className="handle-data target"
                        style={{
                            left: '-18px',
                        }}
                    />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.9, letterSpacing: '0.05em' }}>Init</span>
                </div>

                {/* Condition Input */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', padding: '8px', borderRadius: '8px' }}>
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="test"
                        className="handle-data target"
                        style={{
                            left: '-18px',
                        }}
                    />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.9, letterSpacing: '0.05em' }}>Test</span>
                </div>

                {/* Update Input */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', padding: '8px', borderRadius: '8px' }}>
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="update"
                        className="handle-data target"
                        style={{
                            left: '-18px',
                        }}
                    />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.9, letterSpacing: '0.05em' }}>Update</span>
                </div>

                <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '5px 0' }} />

                {/* Flow Outputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Loop Body Path */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            onClick={() => handleEnterScope('flow-body')}
                            disabled={!data.scopes?.['flow-body']}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: data.scopes?.['flow-body'] ? 'pointer' : 'default',
                                color: '#26a69a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                opacity: data.scopes?.['flow-body'] ? 1 : 0.4,
                                padding: '6px 8px',
                                borderRadius: '6px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => data.scopes?.['flow-body'] && (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <ExternalLink size={12} />
                            Do (Body)
                        </button>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="flow-body"
                            className="handle-flow"
                            style={{
                                right: '-6px',
                                borderLeftColor: '#26a69a',
                            }}
                        />
                    </div>

                    {/* Exit Path */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>Exit</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="flow-exit"
                            className="handle-flow"
                            style={{
                                right: '-6px',
                                borderLeftColor: '#94a3b8',
                            }}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
});

ForNode.displayName = 'ForNode';
