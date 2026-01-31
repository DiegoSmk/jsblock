import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { SectionHeader } from './SharedComponents';
import { Tooltip } from '../Tooltip';

interface GitInfoPanelProps {
    isDark: boolean;
    logs: any[];
}

const StatBox: React.FC<{ title: string; value: string | number; isDark: boolean; colSpan?: number }> = ({ title, value, isDark, colSpan = 1 }) => (
    <div style={{
        flex: 1,
        gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        padding: '8px 12px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px'
    }}>
        <span style={{ fontSize: '0.65rem', color: isDark ? '#aaa' : '#666', fontWeight: 500, textAlign: 'center' }}>{title}</span>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? '#fff' : '#333' }}>{value}</span>
    </div>
);

export const GitInfoPanel: React.FC<GitInfoPanelProps> = ({ isDark, logs }) => {
    const { git } = useStore();

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

    const authorsData = useMemo(() => {
        const authors: Record<string, { count: number; email: string }> = {};
        logs.forEach(commit => {
            const name = commit.author;
            if (!authors[name]) {
                authors[name] = { count: 0, email: '' };
            }
            authors[name].count++;
        });
        return Object.entries(authors)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([name, data]) => ({ name, ...data }));
    }, [logs]);

    const hourlyStats = useMemo(() => {
        const stats = new Array(24).fill(0);
        logs.forEach((l) => {
            const d = new Date(l.date);
            if (!isNaN(d.getTime())) {
                stats[d.getHours()]++;
            }
        });
        const max = Math.max(...stats) || 1;
        return { stats, max };
    }, [logs]);

    const weeklyStats = useMemo(() => {
        const stats = new Array(7).fill(0);
        logs.forEach(l => {
            const d = new Date(l.date);
            if (!isNaN(d.getTime())) {
                stats[d.getDay()]++;
            }
        });
        const max = Math.max(...stats) || 1;
        return { stats, max };
    }, [logs]);

    const renderHeatmap = () => {
        const weeks: any[] = [];
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

                        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }} className="no-scrollbar">
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
                                            {week.map((day: any) => (
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
                                                    delay={0}
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
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

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
                title="Visão Geral"
                count={-1}
                isOpen={true}
                isDark={isDark}
            />
            <div style={{ padding: '0 16px', borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}` }}>
                {renderHeatmap()}
            </div>

            <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <StatBox title="Branches" value={git.branches.length} isDark={isDark} />
                    <StatBox title="Commits" value={logs.length} isDark={isDark} />
                    <StatBox title="Stash" value={git.stashes.length} isDark={isDark} />
                    <StatBox title="Arquivos" value={git.stats?.fileCount || 0} isDark={isDark} />
                    <StatBox title="Tamanho da pasta .git" value={git.stats?.repoSize || '-'} isDark={isDark} />
                    <StatBox title="Tamanho do Projeto" value={git.stats?.projectSize || '-'} isDark={isDark} />
                </div>
            </div>

            <SectionHeader
                title="Atividade por Dia da Semana"
                count={-1}
                isOpen={true}
                isDark={isDark}
            />
            <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '4px', justifyContent: 'space-between' }}>
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => {
                        const count = weeklyStats.stats[i];
                        const height = (count / weeklyStats.max) * 100;

                        return (
                            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                                <div style={{
                                    width: '100%',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div
                                        title={`${count} commits`}
                                        style={{
                                            width: '100%',
                                            height: `${height}%`,
                                            background: isDark ? '#4dabf7' : '#0070f3',
                                            opacity: 0.8,
                                            transition: 'height 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.6rem', color: isDark ? '#888' : '#777' }}>{day}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <SectionHeader
                title="Horários de Pico"
                count={-1}
                isOpen={true}
                isDark={isDark}
            />
            <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#eee'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '2px', justifyContent: 'space-between' }}>
                    {hourlyStats.stats.map((count, hour) => {
                        const height = (count / hourlyStats.max) * 100;
                        const showLabel = hour % 6 === 0;

                        return (
                            <div key={hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                                <div style={{
                                    width: '100%',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                }}>
                                    <div
                                        title={`${count} commits às ${hour}h`}
                                        style={{
                                            width: '100%',
                                            height: `${height}%`,
                                            background: isDark ? '#fbbf24' : '#f59e0b',
                                            opacity: 0.8,
                                            transition: 'height 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.5rem', color: isDark ? '#888' : '#777', opacity: showLabel ? 1 : 0 }}>{hour}h</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <SectionHeader
                title="Principais Colaboradores"
                count={authorsData.length}
                isOpen={true}
                isDark={isDark}
            />
            <div style={{ padding: '8px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {authorsData.map((author, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: isDark ? '#333' : '#e0e0e0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 600, fontSize: '0.7rem', color: isDark ? '#aaa' : '#555'
                                }}>
                                    {(author.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <span style={{ color: isDark ? '#ddd' : '#333' }}>{author.name || 'Desconhecido'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    height: '6px', width: '60px', borderRadius: '3px',
                                    background: isDark ? '#333' : '#eee', overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min((author.count / logs.length) * 100, 100)}%`,
                                        background: isDark ? '#4ade80' : '#22c55e'
                                    }} />
                                </div>
                                <span style={{ color: isDark ? '#888' : '#777', width: '24px', textAlign: 'right' }}>{author.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
