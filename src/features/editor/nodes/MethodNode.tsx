import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../../../store/useStore';
import { Code, ExternalLink } from 'lucide-react';
import type { AppNodeData } from '../types';

export const MethodNode = memo(({ data }: { data: AppNodeData }) => {
    const theme = useStore((state) => state.theme);
    const navigateInto = useStore((state) => state.navigateInto);
    const isDark = theme === 'dark';

    const handleEnterScope = () => {
        const scope = data.scopes?.body;
        if (scope) {
            navigateInto(scope.id, scope.label);
        }
    };

    const isStatic = !!data.isStatic;
    const kind = (data.kind as string) || 'method'; // constructor, method, get, set

    // Style logic
    const borderColor = isStatic ? '#a855f7' : '#0ea5e9'; // Purple for static, Blue for instance
    const bgColor = isDark
        ? (isStatic ? 'rgba(168, 85, 247, 0.1)' : 'rgba(14, 165, 233, 0.1)')
        : (isStatic ? 'rgba(233, 213, 255, 0.4)' : 'rgba(224, 242, 254, 0.5)');

    return (
        <div style={{
            minWidth: '250px',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            background: isDark ? '#1e1e1e' : '#fff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                background: bgColor,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: `1px solid ${borderColor}`
            }}>
                <Code size={14} color={borderColor} />
                <span style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: isDark ? '#fff' : '#334155'
                }}>
                    {data.label}
                </span>

                {isStatic && (
                    <span style={{
                        fontSize: '0.65rem',
                        background: borderColor,
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        marginLeft: 'auto'
                    }}>
                        STATIC
                    </span>
                )}
                {kind !== 'method' && !isStatic && (
                    <span style={{
                        fontSize: '0.65rem',
                        background: '#64748b',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 800,
                        marginLeft: 'auto',
                        textTransform: 'uppercase'
                    }}>
                        {kind}
                    </span>
                )}
            </div>

            {/* Arguments */}
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.args && data.args.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {data.args.map((arg) => (
                            <div key={`arg-${arg}`} style={{
                                background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                color: isDark ? '#94a3b8' : '#64748b',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace'
                            }}>
                                {arg}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.8rem', color: isDark ? '#666' : '#999', fontStyle: 'italic' }}>
                        No arguments
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div style={{
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                padding: '8px'
            }}>
                <button
                    onClick={handleEnterScope}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: borderColor,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <ExternalLink size={12} />
                    Open Implementation
                </button>
            </div>

            {/* Connection Handles */}
            <Handle type="target" position={Position.Top} id="ref-target" className="handle-data" style={{ background: borderColor }} />
            <Handle type="source" position={Position.Bottom} id="ref-source" className="handle-data" style={{ background: borderColor }} />
        </div>
    );
});

MethodNode.displayName = 'MethodNode';
