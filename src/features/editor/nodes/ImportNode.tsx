import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../../../store/useStore';
import { Import } from 'lucide-react';

import type { AppNodeData } from '../../../types/store';

export const ImportNode = memo(({ data, id }: { id: string, data: AppNodeData }) => {
    const theme = useStore((state) => state.theme);
    const isDark = theme === 'dark';

    interface Specifier {
        type: 'named' | 'default' | 'namespace';
        local: string;
        imported?: string;
    }
    const specifiers = (data.specifiers as Specifier[]) ?? [];

    return (
        <div className="premium-node" style={{ minWidth: '300px' }}>
            <div className="node-header" style={{
                background: isDark ? 'linear-gradient(to right, #1e293b, #334155)' : 'linear-gradient(to right, #f1f5f9, #e2e8f0)',
                color: isDark ? '#fff' : '#475569',
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px'
            }}>
                <Import size={14} strokeWidth={2.5} />
                <span>Import</span>
                <span style={{ marginLeft: 'auto', color: '#38bdf8' }}>{data.source as string}</span>
            </div>

            <div className="node-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {specifiers.map((s) => (
                        <div key={`${id}-spec-${s.local}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                            <span style={{ fontSize: '0.9rem', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>
                                {s.type === 'default' ? 'default' : (s.type === 'namespace' ? '*' : s.imported)}
                                {s.local !== s.imported && s.local !== 'default' && ` as ${s.local}`}
                                {s.type === 'default' && ` as ${s.local}`}
                            </span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={s.local}
                                className="handle-data source"
                                style={{ right: '-12px', background: '#38bdf8' }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

ImportNode.displayName = 'ImportNode';
