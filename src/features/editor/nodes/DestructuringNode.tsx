import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../../../store/useStore';
import { Split } from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';

import type { AppNodeData } from '../types';

export const DestructuringNode = memo(({ data, id }: { id: string, data: AppNodeData }) => {
    const theme = useStore((state) => state.theme);
    const isDark = theme === 'dark';

    const keys = data.destructuringKeys ?? [];

    return (
        <div className="premium-node" style={{ minWidth: '200px' }}>
            <div className="node-header" style={{
                background: isDark ? 'linear-gradient(to right, #4c1d95, #6d28d9)' : 'linear-gradient(to right, #e9d5ff, #d8b4fe)',
                color: isDark ? '#fff' : '#581c87',
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px'
            }}>
                <Split size={14} strokeWidth={2.5} />
                <span>Destructuring</span>
            </div>

            <div className="node-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#d8b4fe' : '#7e22ce' }}>
                        {data.destructuringSource ?? 'Object'}
                    </span>
                    <Tooltip content={data.typeAnnotation ?? 'Source Object'} side="top">
                        <Handle
                            type="target"
                            position={Position.Top}
                            id="input"
                            className="handle-data"
                            style={{
                                top: '-25px',
                                background: '#a855f7'
                            }}
                        />
                    </Tooltip>
                </div>

                {keys.map((key) => (
                    <div key={`${id}-key-${key}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#e9d5ff' : '#6b21a8' }}>{key}</span>
                        <Tooltip content="Extracted Value" side="right">
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={key}
                                className="handle-data source"
                                style={{
                                    right: '-16px',
                                    background: '#a855f7'
                                }}
                            />
                        </Tooltip>
                    </div>
                ))}
            </div>
        </div>
    );
});

DestructuringNode.displayName = 'DestructuringNode';
