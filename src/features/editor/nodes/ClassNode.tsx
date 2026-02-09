import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../../../store/useStore';
import { Box, Layers } from 'lucide-react';
import type { AppNodeData } from '../types';

export const ClassNode = memo(({ data }: { data: AppNodeData }) => {
    const theme = useStore((state) => state.theme);
    const isDark = theme === 'dark';

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minWidth: '300px',
            minHeight: '200px',
            border: `2px solid ${isDark ? '#4ade80' : '#16a34a'}`,
            borderRadius: '12px',
            background: isDark ? 'rgba(20, 83, 45, 0.2)' : 'rgba(220, 252, 231, 0.5)',
            boxSizing: 'border-box',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                background: isDark ? 'linear-gradient(to right, #14532d, #166534)' : 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                color: isDark ? '#4ade80' : '#166534',
                padding: '10px 16px',
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px',
                borderBottom: `1px solid ${isDark ? '#4ade80' : '#16a34a'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: 800,
                fontSize: '1rem',
                letterSpacing: '0.05em'
            }}>
                <Box size={16} />
                <span>Class: {data.label}</span>
                {typeof data.extends === 'string' && (
                    <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: 'auto' }}>
                        extends <span style={{ textDecoration: 'underline' }}>{data.extends}</span>
                    </span>
                )}
            </div>

            {/* Body */}
            <div style={{ flex: 1, padding: '20px', position: 'relative' }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.1,
                    pointerEvents: 'none'
                }}>
                    <Layers size={64} />
                </div>
            </div>

            {/* Connection Handles */}
            <Handle type="target" position={Position.Top} id="ref-target" className="handle-data" style={{ background: isDark ? '#4ade80' : '#16a34a' }} />
            <Handle type="source" position={Position.Bottom} id="ref-source" className="handle-data" style={{ background: isDark ? '#4ade80' : '#16a34a' }} />
        </div>
    );
});

ClassNode.displayName = 'ClassNode';
