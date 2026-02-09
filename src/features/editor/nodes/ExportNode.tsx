import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../../../store/useStore';
import { Share2 } from 'lucide-react';

import type { AppNodeData } from '../types';

export const ExportNode = memo(({ data, id }: { id: string, data: AppNodeData }) => {
    const theme = useStore((state) => state.theme);
    const isDark = theme === 'dark';

    interface Specifier {
        local: string;
        exported: string;
    }
    const specifiers = (data.specifiers as Specifier[]) ?? [];
    const exportType = (data.exportType as string) || 'named';

    return (
        <div className="premium-node" style={{ minWidth: '250px' }}>
            <div className="node-header" style={{
                background: isDark ? 'linear-gradient(to right, #4c1d95, #7c3aed)' : 'linear-gradient(to right, #ddd6fe, #a78bfa)',
                color: isDark ? '#fff' : '#1e1b4b',
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px'
            }}>
                <Share2 size={14} strokeWidth={2.5} />
                <span>{data.label}</span>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.65rem',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                }}>
                    {exportType}
                </span>
            </div>

            <div className="node-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {specifiers.map((s) => (
                        <div key={`${id}-spec-${s.exported}`} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'relative',
                            padding: '4px 0'
                        }}>
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={s.exported === 'default' ? 'handle-default-export' : s.exported}
                                className="handle-data target"
                                style={{ left: '-12px', background: '#a78bfa' }}
                            />
                            <span style={{
                                fontSize: '0.9rem',
                                color: isDark ? '#f8fafc' : '#0f172a',
                                fontWeight: 600,
                                marginLeft: '8px'
                            }}>
                                {s.local}
                                {s.exported !== s.local && s.exported !== 'default' && ` as ${s.exported}`}
                                {s.exported === 'default' && exportType === 'default' && s.local !== '(expression)' && ' (default)'}
                            </span>
                        </div>
                    ))}
                    {specifiers.length === 0 && (
                        <div style={{
                            fontSize: '0.8rem',
                            color: isDark ? '#64748b' : '#94a3b8',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            padding: '10px'
                        }}>
                            Empty Export
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

ExportNode.displayName = 'ExportNode';
