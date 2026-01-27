
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';

export const SwitchNode = ({ id, data }: { id: string, data: any }) => {
    const theme = useStore((state) => state.theme);
    const updateNodeData = useStore((state) => (state as any).updateNodeData);
    const navigateInto = useStore((state) => state.navigateInto);
    const updateNodeInternals = useUpdateNodeInternals();
    const isDark = theme === 'dark';

    const cases = data.cases || [];

    const handleEnterScope = (flowHandle: string) => {
        const scope = data.scopes?.[flowHandle];
        if (scope) {
            navigateInto(scope.id, scope.label);
        }
    };

    const addCase = () => {
        const newCase = `case-${cases.length + 1}`;
        updateNodeData(id, { cases: [...cases, newCase] });
        setTimeout(() => updateNodeInternals(id), 0);
    };

    const removeCase = (index: number) => {
        const newCases = [...cases];
        newCases.splice(index, 1);
        updateNodeData(id, { cases: newCases });
        setTimeout(() => updateNodeInternals(id), 0);
    };

    useEffect(() => {
        updateNodeInternals(id);
    }, [cases.length, updateNodeInternals, id]);

    return (
        <div className="premium-node" style={{ minWidth: '240px' }}>
            {/* Header */}
            <div className="node-header" style={{
                background: isDark ? '#8e24aa' : '#9c27b0',
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
                        top: '20px',
                        borderLeftColor: '#fff'
                    }}
                />
                <span>Switch Case</span>
            </div>

            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Discriminant Input */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: isDark ? '#333' : '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="discriminant"
                        className="handle-data"
                        style={{
                            left: '-18px',
                            background: '#9c27b0',
                        }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#ce93d8' : '#7b1fa2' }}>Value to Check</span>
                </div>

                <div style={{ height: '1px', background: isDark ? '#333' : '#eee', margin: '5px 0' }} />

                {/* Cases List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cases.map((caseVal: string, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: isDark ? '#2d2d2d' : '#f5f5f5',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem'
                                }}>
                                    <input
                                        value={caseVal}
                                        onChange={(e) => {
                                            const newCases = [...cases];
                                            newCases[i] = e.target.value;
                                            updateNodeData(id, { cases: newCases });
                                        }}
                                        style={{
                                            width: '50px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: isDark ? '#fff' : '#000',
                                            borderBottom: '1px solid #777',
                                            fontSize: '0.8rem',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => handleEnterScope(`case-${i}`)}
                                    disabled={!data.scopes?.[`case-${i}`]}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: data.scopes?.[`case-${i}`] ? 'pointer' : 'default',
                                        color: isDark ? '#ce93d8' : '#9c27b0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: data.scopes?.[`case-${i}`] ? 1 : 0.3
                                    }}
                                >
                                    <ExternalLink size={14} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <button
                                    onClick={() => removeCase(i)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ff5252',
                                        cursor: 'pointer',
                                        marginRight: '15px',
                                        opacity: 0.6
                                    }}
                                >
                                    <Trash2 size={12} />
                                </button>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={`case-${i}`}
                                    className="handle-flow"
                                    style={{
                                        right: '-6px',
                                        borderLeftColor: '#fff',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Case Button */}
                <button
                    onClick={addCase}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '6px',
                        background: 'rgba(156, 39, 176, 0.1)',
                        border: '1px dashed #9c27b0',
                        color: '#ba68c8',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    <Plus size={14} /> Add Case
                </button>
            </div>
        </div>
    );
};
