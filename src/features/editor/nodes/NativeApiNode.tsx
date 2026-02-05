import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../../../store/useStore';
import { Cpu } from 'lucide-react';

export const NativeApiNode = memo(() => {
    const theme = useStore((state) => state.theme);
    const isDark = theme === 'dark';

    return (
        <div style={{
            padding: '12px 20px',
            borderRadius: '12px',
            background: isDark ? '#f7df1e' : '#f7df1e', // JS Yellow is iconic, keeps it bright
            color: '#000', // Best contrast for JS yellow
            minWidth: '180px',
            boxShadow: '0 8px 32px rgba(247, 223, 30, 0.3)',
            border: '2px solid rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 800,
            fontSize: '0.85rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} />
                <span style={{ letterSpacing: '0.05em' }}>JS Runtime API</span>
            </div>
            <div style={{
                fontSize: '0.7rem',
                opacity: 0.7,
                fontWeight: 600,
                textAlign: 'center'
            }}>
                Native Language Features
            </div>

            {/* Output for reference lines */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="ref-source"
                className="handle-data"
                style={{
                    bottom: '-6px',
                    background: '#f7df1e',
                }}
            />
        </div>
    );
});

NativeApiNode.displayName = 'NativeApiNode';
