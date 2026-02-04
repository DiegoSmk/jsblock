import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../store/useStore';
import { Shield, ExternalLink } from 'lucide-react';

import type { AppNodeData } from '../types/store';

export const TryCatchNode = memo(({ data }: { data: AppNodeData }) => {
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
        <div className="premium-node" style={{ minWidth: '240px' }}>
            {/* Header */}
            <div className="node-header" style={{
                background: isDark ? '#512da8' : '#5e35b1',
                color: '#fff',
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px'
            }}>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="flow-in"
                    className="handle-flow"
                    style={{
                        left: '-6px',
                        top: '18px',
                        borderLeftColor: '#fff'
                    }}
                />
                <Shield size={16} />
                <span>Try / Catch</span>
            </div>

            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {[
                    { h: 'flow-try', c: '#4caf50', l: 'Try Block' },
                    { h: 'flow-catch', c: '#f44336', l: 'Catch Block' },
                    { h: 'flow-finally', c: '#9e9e9e', l: 'Finally' }
                ].map(item => (
                    <div key={item.h} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            onClick={() => handleEnterScope(item.h)}
                            disabled={!data.scopes?.[item.h]}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: data.scopes?.[item.h] ? 'pointer' : 'default',
                                color: item.c,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                opacity: data.scopes?.[item.h] ? 1 : 0.3,
                                padding: '4px',
                                borderRadius: '4px'
                            }}
                        >
                            <ExternalLink size={14} />
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
                ))}
            </div>

            {/* Main Flow Continuation */}
            <Handle
                type="source"
                position={Position.Right}
                id="flow-next"
                className="handle-flow"
                style={{ right: '-6px', bottom: '12px' }}
            />
        </div>
    );
});

TryCatchNode.displayName = 'TryCatchNode';
