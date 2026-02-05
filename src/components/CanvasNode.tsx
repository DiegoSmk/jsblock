import { memo, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useStore } from '../store/useStore';
import { Presentation, Play, Pause, RotateCcw } from 'lucide-react';

import type { AppNodeData } from '../types/store';

interface CanvasShape {
    type: 'circle' | 'rect' | 'text' | 'line';
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    color?: string;
    text?: string;
    x2?: number; // for line
    y2?: number; // for line
}

export const CanvasNode = memo(({ data, id }: { id: string, data: AppNodeData }) => {
    const theme = useStore((state) => state.theme);
    const runtimeValues = useStore((state) => state.runtimeValues);
    const isSimulating = useStore((state) => state.isSimulating);
    const toggleSimulation = useStore((state) => state.toggleSimulation);
    const runExecution = useStore((state) => state.runExecution);

    const isDark = theme === 'dark';
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Look for data in runtimeValues. Priority: node-specific ID > generic 'canvasData'
    const drawData = (runtimeValues[id] ?? runtimeValues.canvasData) as CanvasShape[] | null;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!drawData || !Array.isArray(drawData)) {
            ctx.fillStyle = isDark ? '#444' : '#ccc';
            ctx.font = '12px Inter';
            ctx.fillText('Waiting for canvasData...', 10, 20);
            return;
        }

        drawData.forEach(shape => {
            ctx.fillStyle = shape.color ?? (isDark ? '#fff' : '#000');
            ctx.strokeStyle = shape.color ?? (isDark ? '#fff' : '#000');
            ctx.lineWidth = 2;
            ctx.beginPath();

            switch (shape.type) {
                case 'circle':
                    ctx.arc(shape.x, shape.y, shape.radius ?? 5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'rect':
                    ctx.fillRect(shape.x, shape.y, shape.width ?? 10, shape.height ?? 10);
                    break;
                case 'text':
                    ctx.font = '12px Inter';
                    ctx.fillText(shape.text ?? '', shape.x, shape.y);
                    break;
                case 'line':
                    ctx.moveTo(shape.x, shape.y);
                    ctx.lineTo(shape.x2 ?? shape.x, shape.y2 ?? shape.y);
                    ctx.stroke();
                    break;
            }
        });
    }, [drawData, isDark]);

    return (
        <div className="premium-node" style={{ minWidth: '400px', paddingBottom: '0' }}>
            <div className="node-header" style={{
                background: isDark ? 'linear-gradient(to right, #1e293b, #334155)' : 'linear-gradient(to right, #f1f5f9, #e2e8f0)',
                color: isDark ? '#fff' : '#475569',
                borderTopLeftRadius: '11px',
                borderTopRightRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <Presentation size={14} strokeWidth={2.5} />
                <span>{data.label ?? 'Canvas Viewer'}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); runExecution(); }}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.7 }}
                        title="Reset/Step"
                    >
                        <RotateCcw size={12} />
                    </button>
                    <span style={{ color: isSimulating ? '#10b981' : '#64748b', fontSize: '0.6rem', fontWeight: 700 }}>
                        {isSimulating ? 'Live' : 'Idle'}
                    </span>
                </div>
            </div>

            <div className="node-content" style={{ padding: '0', position: 'relative' }}>
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={250}
                    style={{
                        width: '100%',
                        height: '250px',
                        background: isDark ? '#000' : '#f8fafc',
                        display: 'block'
                    }}
                />

                {/* Internal Simulation Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleSimulation(); }}
                    style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: isSimulating ? '#ef4444' : '#10b981',
                        border: 'none',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 10
                    }}
                    className="sim-btn"
                >
                    {isSimulating ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
                </button>
            </div>

            <style>{`
                .sim-btn:hover {
                    transform: scale(1.1);
                    filter: brightness(1.1);
                }
                .sim-btn:active {
                    transform: scale(0.95);
                }
            `}</style>

            <Handle
                type="target"
                position={Position.Left}
                id="input"
                className="handle-data"
                style={{ top: '50%', background: '#10b981' }}
            />
        </div>
    );
});

CanvasNode.displayName = 'CanvasNode';
