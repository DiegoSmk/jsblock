import React from 'react';
import { NOTE_PALETTE } from '../constants/design';
import {
    Spline,
    Activity,
    CornerDownRight,
    ArrowRight,
    X,
    RotateCcw
} from 'lucide-react';

import type { EdgeCustomStyle } from '../types/store';

interface EdgeStylePopupProps {
    currentStyle: EdgeCustomStyle;
    onUpdate: (updates: EdgeCustomStyle) => void;
    onClose: () => void;
    isDark: boolean;
}

export const EdgeStylePopup: React.FC<EdgeStylePopupProps> = ({ currentStyle, onUpdate, onClose, isDark }) => {

    // Helper to determine active stroke style
    const getStrokeStyle = () => {
        if (!currentStyle.strokeDasharray) return 'solid';
        if (currentStyle.strokeDasharray === '5 5') return 'dashed';
        if (currentStyle.strokeDasharray === '1 5') return 'dotted';
        return 'solid';
    };

    const activeStrokeStyle = getStrokeStyle();

    const styles = {
        container: {
            background: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px',
            width: '240px',
            animation: 'fadeIn 0.2s ease-out'
        },
        section: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '6px'
        },
        label: {
            fontSize: '0.75rem',
            fontWeight: 600,
            color: isDark ? '#aaa' : '#666',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px'
        },
        row: {
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap' as const
        },
        iconBtn: (active: boolean) => ({
            background: active ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'transparent',
            border: `1px solid ${active ? (isDark ? '#fff' : '#000') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
            borderRadius: '6px',
            padding: '6px',
            cursor: 'pointer',
            color: isDark ? '#fff' : '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            transition: 'all 0.15s ease'
        }),
        colorBtn: (color: string, active: boolean) => ({
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: color,
            border: active ? `2px solid ${isDark ? '#fff' : '#000'}` : '2px solid transparent',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
        })
    };

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#fff' : '#000' }}>Estilo de Conexão</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => onUpdate({ type: undefined, stroke: undefined, strokeWidth: undefined, strokeDasharray: undefined })}
                        title="Restaurar Padrão"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDark ? '#aaa' : '#666',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', padding: 0 }}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Curve Type */}
            <div style={styles.section}>
                <span style={styles.label}>Tipo de Curva</span>
                <div style={styles.row}>
                    <button title="Bezier" style={styles.iconBtn(currentStyle.type === 'default' || currentStyle.type === 'bezier')} onClick={() => onUpdate({ type: 'default' })}>
                        <Spline size={16} />
                    </button>
                    <button title="Smooth Step" style={styles.iconBtn(currentStyle.type === 'smoothstep')} onClick={() => onUpdate({ type: 'smoothstep' })}>
                        <Activity size={16} />
                    </button>
                    <button title="Step" style={styles.iconBtn(currentStyle.type === 'step')} onClick={() => onUpdate({ type: 'step' })}>
                        <CornerDownRight size={16} />
                    </button>
                    <button title="Straight" style={styles.iconBtn(currentStyle.type === 'straight')} onClick={() => onUpdate({ type: 'straight' })}>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* Stroke Style */}
            <div style={styles.section}>
                <span style={styles.label}>Estilo de Linha</span>
                <div style={styles.row}>
                    <button title="Animada (Padrão)" style={styles.iconBtn(currentStyle.animated !== false)} onClick={() => onUpdate({ strokeDasharray: undefined, animated: true })}>
                        <style>
                            {`
                                @keyframes march-ants {
                                    to {
                                        background-position: 100% 0;
                                    }
                                }
                            `}
                        </style>
                        <div style={{
                            width: '100%',
                            height: '2px',
                            background: 'linear-gradient(90deg, currentColor 50%, transparent 50%)',
                            backgroundSize: '8px 100%',
                            animation: 'march-ants 1.5s infinite linear'
                        }} />
                    </button>
                    <button title="Sólida" style={styles.iconBtn(activeStrokeStyle === 'solid' && currentStyle.animated === false)} onClick={() => onUpdate({ strokeDasharray: undefined, animated: false })}>
                        <div style={{ width: '100%', height: '2px', background: 'currentColor' }} />
                    </button>
                    <button title="Tracejada" style={styles.iconBtn(activeStrokeStyle === 'dashed' && currentStyle.animated === false)} onClick={() => onUpdate({ strokeDasharray: '5 5', animated: false })}>
                        <div style={{ width: '100%', height: '2px', background: 'linear-gradient(to right, currentColor 50%, transparent 50%)', backgroundSize: '10px 100%' }} />
                    </button>
                    <button title="Pontilhada" style={styles.iconBtn(activeStrokeStyle === 'dotted' && currentStyle.animated === false)} onClick={() => onUpdate({ strokeDasharray: '1 5', animated: false })}>
                        <div style={{ width: '100%', height: '2px', background: 'linear-gradient(to right, currentColor 20%, transparent 20%)', backgroundSize: '6px 100%' }} />
                    </button>
                </div>
            </div>

            {/* Width */}
            <div style={styles.section}>
                <span style={styles.label}>Espessura</span>
                <div style={styles.row}>
                    {[1, 2, 3, 4, 6].map(w => (
                        <button
                            key={w}
                            style={styles.iconBtn(currentStyle.strokeWidth === w)}
                            onClick={() => onUpdate({ strokeWidth: w })}
                        >
                            <div style={{ width: '100%', height: `${w}px`, background: 'currentColor', borderRadius: '1px' }} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Colors */}
            <div style={styles.section}>
                <span style={styles.label}>Cor</span>
                <div style={styles.row}>
                    <button
                        title="Cor Padrão"
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: !currentStyle.stroke || currentStyle.stroke === (isDark ? '#4fc3f7' : '#0070f3') ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                            border: !currentStyle.stroke || currentStyle.stroke === (isDark ? '#4fc3f7' : '#0070f3') ? `2px solid ${isDark ? '#fff' : '#000'}` : `1px dashed ${isDark ? '#aaa' : '#666'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#fff' : '#000',
                            transition: 'all 0.1s',
                            position: 'relative'
                        }}
                        onClick={() => onUpdate({ stroke: undefined })}
                    >
                        <div style={{ width: '12px', height: '2px', background: 'currentColor', transform: 'rotate(45deg)' }} />
                    </button>
                    {Object.values(NOTE_PALETTE).map(color => (
                        <button
                            key={color}
                            style={styles.colorBtn(color, currentStyle.stroke === color)}
                            onClick={() => onUpdate({ stroke: color })}
                            title={color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
