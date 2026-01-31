import { Handle, Position } from '@xyflow/react';
import { useStore } from '../store/useStore';
import { Box } from 'lucide-react';

export const VariableNode = ({ data, id }: { id: string, data: { label: string, value: string, nestedCall?: { name: string, args: string[] } } }) => {
    const theme = useStore((state) => state.theme);
    const runtimeValues = useStore((state) => state.runtimeValues);
    const updateNodeData = useStore((state) => (state as any).updateNodeData);
    const isDark = theme === 'dark';

    const isComputed = data.value !== undefined && (data.value.includes(' ') || data.value === '(computed)');
    const hasNested = !!data.nestedCall || isComputed;
    const liveValue = runtimeValues[data.label];

    // Improved display logic: Runtime Value > Formatted Expression > Static Value
    const displayValue = liveValue !== undefined ? String(liveValue) : data.value;
    const isShowingExpression = liveValue === undefined && isComputed;

    return (
        <div className="premium-node" style={{ minWidth: '350px' }}>
            <div className="node-header" style={{
                background: isDark ? 'linear-gradient(to right, #1e293b, #334155)' : 'linear-gradient(to right, #f1f5f9, #e2e8f0)',
                color: isDark ? '#fff' : '#475569',
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px'
            }}>
                <Box size={14} strokeWidth={2.5} />
                <span>Variable</span>
                <span style={{ marginLeft: 'auto', color: '#38bdf8' }}>{data.label}</span>
            </div>

            <div className="node-content">
                {hasNested ? (
                    <div style={{
                        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                        borderRadius: '10px',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        padding: '15px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: data.nestedCall ? '12px' : '0', position: 'relative' }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#f472b6' }}>
                                {data.nestedCall ? `${data.nestedCall.name}()` : 'Calculation'}
                                <Handle
                                    type="target"
                                    position={Position.Top}
                                    id="ref-target"
                                    className="handle-data"
                                    style={{
                                        top: '-10px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: data.nestedCall
                                            ? (['console', 'Math', 'JSON', 'Array', 'Object'].some(p => data.nestedCall?.name.startsWith(p)) || ['alert', 'prompt', 'confirm'].includes(data.nestedCall?.name)
                                                ? '#f7df1e' // Native = Yellow
                                                : '#4caf50') // Custom Function = Green
                                            : '#f472b6', // Calculation = Pink
                                    }}
                                />
                            </div>
                            <div style={{
                                fontSize: isShowingExpression ? '0.9rem' : '1.1rem',
                                color: isShowingExpression ? (isDark ? '#81c784' : '#4caf50') : (isDark ? '#38bdf8' : '#0284c7'),
                                fontWeight: 800,
                                opacity: isShowingExpression ? 0.8 : 1,
                                fontFamily: isShowingExpression ? 'monospace' : 'inherit'
                            }}>
                                = {displayValue}
                            </div>
                        </div>

                        {data.nestedCall && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.nestedCall.args.map((arg, i) => (
                                    <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <Handle
                                            type="target"
                                            position={Position.Left}
                                            id={`nested-arg-${i}`}
                                            className="handle-data"
                                            style={{ left: '-12px', background: '#f472b6' }}
                                        />
                                        <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700,  letterSpacing: '0.05em' }}>{arg}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>

                        {/* Static Definition Input (Always reflects what is typed) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>Initial Value</span>
                            <input
                                value={data.value}
                                onChange={(e) => updateNodeData(id, { value: e.target.value })}
                                onKeyDown={(e) => e.stopPropagation()}
                                style={{
                                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                    color: isDark ? '#f8fafc' : '#0f172a',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    width: '140px',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    textAlign: 'right',
                                    transition: 'all 0.2s'
                                }}
                            />
                        </div>

                        {/* Dynamic Runtime Badge (Only shows if different or if defined) */}
                        {liveValue !== undefined && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '4px',
                                paddingTop: '12px',
                                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                            }}>
                                <span style={{ fontSize: '0.8rem', color: '#f472b6', fontWeight: 800, textTransform: 'uppercase' }}>Runtime Value</span>
                                <div style={{
                                    background: '#f472b6',
                                    color: 'white',
                                    padding: '3px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    minWidth: '50px',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 6px -1px rgba(244, 114, 182, 0.3)'
                                }}>
                                    {String(liveValue)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                id="output"
                className="handle-data"
                style={{
                    right: '-8px',
                    top: '50%',
                    // Default grey via CSS class for output
                }}
            />
        </div>
    );
};
