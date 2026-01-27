
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../store/useStore';
import { Sparkles } from 'lucide-react';

export const LiteralNode = ({ id, data }: { id: string, data: { label: string, value: string, type: 'number' | 'string' | 'boolean' } }) => {
    const theme = useStore((state) => state.theme);
    const updateNodeData = useStore((state) => (state as any).updateNodeData);
    const promoteToVariable = useStore((state) => (state as any).promoteToVariable);
    const isDark = theme === 'dark';

    const isNumber = data.type === 'number';
    const isBoolean = data.type === 'boolean';

    // Color scheme: muted tones for a professional look
    const getColors = () => {
        if (isNumber) {
            return {
                border: isDark ? '#546e7a' : '#607d8b',
                gradient: isDark
                    ? 'linear-gradient(135deg, #37474f 0%, #263238 100%)'
                    : 'linear-gradient(135deg, #90a4ae 0%, #78909c 100%)',
                buttonGradient: isDark
                    ? 'linear-gradient(135deg, #00897b 0%, #00695c 100%)'
                    : 'linear-gradient(135deg, #4db6ac 0%, #26a69a 100%)',
                buttonBorder: isDark ? '#00897b' : '#26a69a',
                shadow: isDark
                    ? '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                text: '#fff',
                handle: '#78909c'
            };
        } else if (isBoolean) {
            return {
                border: isDark ? '#7e57c2' : '#9575cd',
                gradient: isDark
                    ? 'linear-gradient(135deg, #5e35b1 0%, #4527a0 100%)'
                    : 'linear-gradient(135deg, #b39ddb 0%, #9575cd 100%)',
                buttonGradient: isDark
                    ? 'linear-gradient(135deg, #8e24aa 0%, #6a1b9a 100%)'
                    : 'linear-gradient(135deg, #ba68c8 0%, #ab47bc 100%)',
                buttonBorder: isDark ? '#8e24aa' : '#ab47bc',
                shadow: isDark
                    ? '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                text: '#fff',
                handle: '#9575cd'
            };
        } else {
            return {
                border: isDark ? '#8d6e63' : '#a1887f',
                gradient: isDark
                    ? 'linear-gradient(135deg, #6d4c41 0%, #5d4037 100%)'
                    : 'linear-gradient(135deg, #bcaaa4 0%, #a1887f 100%)',
                buttonGradient: isDark
                    ? 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)'
                    : 'linear-gradient(135deg, #ffb74d 0%, #ffa726 100%)',
                buttonBorder: isDark ? '#f57c00' : '#ffa726',
                shadow: isDark
                    ? '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                text: '#fff',
                handle: '#a1887f'
            };
        }
    };

    const colors = getColors();

    return (
        <div style={{
            padding: '8px',
            border: `2px solid ${colors.border}`,
            borderRadius: '12px',
            background: isDark
                ? 'linear-gradient(135deg, #1a2332 0%, #1e1e1e 100%)'
                : 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
            color: isDark ? '#ddd' : '#333',
            width: '50px',
            height: '50px',
            boxShadow: colors.shadow,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.2s ease',
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = isDark
                    ? '0 6px 18px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.08)'
                    : '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = colors.shadow;
            }}
        >
            {/* Magic Wand Icon (Top-left corner) */}
            <button
                onClick={() => promoteToVariable(id, data.value, data.type)}
                style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    background: colors.buttonGradient,
                    border: `1px solid ${colors.buttonBorder}`,
                    borderRadius: '4px',
                    padding: '3px',
                    cursor: 'pointer',
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                    width: '18px',
                    height: '18px',
                }}
                title="Convert to Variable"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'rotate(15deg) scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
                }}
            >
                <Sparkles size={10} />
            </button>

            {/* Editable Value */}
            <input
                value={data.value}
                onChange={(e) => updateNodeData(id, { value: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                style={{
                    background: colors.gradient,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '1rem',
                    fontWeight: 900,
                    width: '32px',
                    height: '32px',
                    outline: 'none',
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)';
                }}
            />

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="output"
                className="handle-data"
                style={{
                    right: '-8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                }}
            />
        </div>
    );
};
