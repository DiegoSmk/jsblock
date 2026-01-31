import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { SectionHeader } from './SharedComponents';
import { Tooltip } from '../Tooltip';

interface GitInfoPanelProps {
    isDark: boolean;
    logs: any[];
}

export const GitInfoPanel: React.FC<GitInfoPanelProps> = ({ isDark, logs }) => {
    const { openedFolder } = useStore();

    // Reutilizando a lógica do heatmap do CommitHistory
    const heatmapData = useMemo(() => {
        const data: Record<string, number> = {};
        logs.forEach(commit => {
            try {
                const date = new Date(commit.date);
                if (isNaN(date.getTime())) return;
                const key = date.toISOString().split('T')[0];
                data[key] = (data[key] || 0) + 1;
            } catch (e) { }
        });
        return data;
    }, [logs]);

    const renderHeatmap = () => {
        const weeks = [];
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - (20 * 7));

        while (startDate.getDay() !== 0) {
            startDate.setDate(startDate.getDate() - 1);
        }

        let currentDate = new Date(startDate);
        while (currentDate <= today) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                const dayKey = currentDate.toISOString().split('T')[0];
                const count = heatmapData[dayKey] || 0;
                week.push({ date: dayKey, count, dayObj: new Date(currentDate) });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeks.push(week);
        }

        const getGithubColor = (count: number) => {
            if (count === 0) return isDark ? '#2d2d2d' : '#ebedf0';
            if (count <= 2) return isDark ? '#0e3a66' : '#cce5ff';
            if (count <= 5) return isDark ? '#1a5c99' : '#99caff';
            if (count <= 10) return isDark ? '#2580cc' : '#4dabf7';
            return isDark ? '#0070f3' : '#0070f3';
        };

        const cellSize = 10;
        const cellGap = 3;

        const months = weeks.map((week, i) => {
            const date = week[0].dayObj;
            const prevWeek = weeks[i - 1];
            const prevDate = prevWeek ? prevWeek[0].dayObj : null;

            if (!prevDate || date.getMonth() !== prevDate.getMonth()) {
                return {
                    label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
                    index: i
                };
            }
            return null;
        }).filter(m => m !== null);

        return (
            <div style={{ padding: '10px 0', fontSize: '0.65rem', userSelect: 'none', display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: `${cellGap}px`,
                            marginTop: '20px',
                            color: isDark ? '#666' : '#999',
                            fontSize: '0.6rem',
                            paddingTop: `${cellSize + cellGap}px`
                        }}>
                            <span style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px` }}>Seg</span>
                            <span style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px`, marginTop: `${cellSize + cellGap}px` }}>Qua</span>
                            <span style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px`, marginTop: `${cellSize + cellGap}px` }}>Sex</span>
                        </div>

                        <div style={{ flex: 1, overflowX: 'auto' }} className="no-scrollbar">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', height: '16px', position: 'relative', marginBottom: '4px' }}>
                                    {months.map((m: any) => (
                                        <div
                                            key={m.index}
                                            style={{
                                                position: 'absolute',
                                                left: `${m.index * (cellSize + cellGap)}px`,
                                                color: isDark ? '#888' : '#777',
                                                fontSize: '0.65rem'
                                            }}
                                        >
                                            {m.label}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: `${cellGap}px` }}>
                                    {weeks.map((week, wIndex) => (
                                        <div key={wIndex} style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px` }}>
                                            {week.map((day) => (
                                                <Tooltip
                                                    key={day.date}
                                                    content={
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                                                                {day.count} contribuições
                                                            </div>
                                                            <div style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                                                                {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                            </div>
                                                        </div>
                                                    }
                                                    side="top"
                                                    delayDuration={0}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${cellSize}px`,
                                                            height: `${cellSize}px`,
                                                            borderRadius: '2px',
                                                            backgroundColor: getGithubColor(day.count),
                                                            cursor: day.count > 0 ? 'pointer' : 'default',
                                                            transition: 'transform 0.1s',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (day.count > 0) e.currentTarget.style.transform = 'scale(1.2)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                    />
                                                </Tooltip>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px', color: isDark ? '#666' : '#999', fontSize: '0.6rem' }}>
                        <span>Menos</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getGithubColor(0) }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getGithubColor(2) }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getGithubColor(5) }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getGithubColor(8) }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getGithubColor(15) }} />
                        </div>
                        <span>Mais</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionHeader
                title="Informações do Repositório"
                count={-1} // -1 to hide count badge if preferred, or use a meaningful count
                isOpen={true}
                isDark={isDark}
            />
            <div style={{ padding: '0 16px', borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}` }}>
                {renderHeatmap()}
            </div>
        </div>
    );
};
