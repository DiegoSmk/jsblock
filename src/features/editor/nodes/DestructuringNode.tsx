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
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    marginBottom: '10px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? '#d8b4fe' : '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {data.destructuringSource ?? 'Source Object'}
                    </span>
                    <Tooltip content={data.typeAnnotation ?? 'Source Object'} side="top">
                        <Handle
                            type="target"
                            position={Position.Top}
                            id="input"
                            className="handle-data"
                            style={{
                                top: '-25px',
                                background: '#a855f7',
                                width: '12px',
                                height: '12px'
                            }}
                        />
                    </Tooltip>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {keys.map((key) => (
                        <div key={`${id}-key-${key}`} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'relative',
                            padding: '6px 10px',
                            background: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(126, 34, 206, 0.05)',
                            borderRadius: '6px',
                            border: `1px solid ${isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(126, 34, 206, 0.1)'}`
                        }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', color: isDark ? '#e9d5ff' : '#6b21a8' }}>{key}</span>
                            <Tooltip content={`Value of '${key}'`} side="right">
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={key}
                                    className="handle-data source"
                                    style={{
                                        right: '-16px',
                                        background: '#a855f7',
                                        width: '10px',
                                        height: '10px',
                                        border: `2px solid ${isDark ? '#1e1e1e' : '#fff'}`
                                    }}
                                />
                            </Tooltip>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

DestructuringNode.displayName = 'DestructuringNode';
