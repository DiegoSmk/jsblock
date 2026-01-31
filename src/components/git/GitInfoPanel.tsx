import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { ScrollArea } from '../ui/ScrollArea';
import { PanelSection } from './PanelSection';
import { EmptyState } from './EmptyState';
import { GitPanelConfig } from './GitPanelConfig';
import { BarChart3, Calendar, Clock, Users, TrendingUp, Settings2 } from 'lucide-react';
import { Tooltip } from '../Tooltip';

interface GitInfoPanelProps {
    isDark: boolean;
    logs: any[];
}

const StatBox: React.FC<{
    title: string;
    value: string | number;
    isDark: boolean;
    isCompact?: boolean;
    tooltip?: string;
}> = ({ title, value, isDark, isCompact = false, tooltip }) => {
    const [isHovered, setIsHovered] = useState(false);

    const content = (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                flex: 1,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                padding: isCompact ? '4px 6px' : '6px 10px',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1px',
                minWidth: 0,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                cursor: tooltip ? 'help' : 'default',
                border: `1px solid ${isHovered ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'transparent'}`
            }}
        >
            <span style={{ fontSize: isCompact ? '0.55rem' : '0.6rem', color: isDark ? '#aaa' : '#666', fontWeight: 500, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{title}</span>
            <span style={{ fontSize: isCompact ? '0.8rem' : '0.9rem', fontWeight: 700, color: isDark ? '#fff' : '#333' }}>{value}</span>
        </div>
    );

    return tooltip ? <Tooltip content={tooltip} side="top">{content}</Tooltip> : content;
};

const Heatmap: React.FC<{ isDark: boolean; logs: any[] }> = ({ isDark, logs }) => {
    const data = useMemo(() => {
        const heatmap: Record<string, number> = {};
        logs.forEach(commit => {
            try {
                const date = new Date(commit.date);
                if (isNaN(date.getTime())) return;
                const key = date.toISOString().split('T')[0];
                heatmap[key] = (heatmap[key] || 0) + 1;
            } catch (e) { }
        });

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
                const count = heatmap[dayKey] || 0;
                week.push({ date: dayKey, count, dayObj: new Date(currentDate) });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeks.push(week);
        }

        const months = weeks.map((week, i) => {
            const date = week[0].dayObj;
            const prevWeek = weeks[i - 1];
            const prevDate = prevWeek ? prevWeek[0].dayObj : null;
            if (!prevDate || date.getMonth() !== prevDate.getMonth()) {
                return { label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), index: i };
            }
            return null;
        }).filter(m => m !== null);

        return { weeks, months };
    }, [logs]);

    const getGithubColor = (count: number) => {
        if (count === 0) return isDark ? '#2d2d2d' : '#ebedf0';
        if (count <= 2) return isDark ? '#0e3a66' : '#cce5ff';
        if (count <= 5) return isDark ? '#1a5c99' : '#99caff';
        if (count <= 10) return isDark ? '#2580cc' : '#4dabf7';
        return isDark ? '#0070f3' : '#0070f3';
    };

    const cellSize = 10;
    const cellGap = 3;

    return (
        <div style={{ padding: '16px', fontSize: '0.65rem', userSelect: 'none', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px`, marginTop: '20px', color: isDark ? '#666' : '#999', fontSize: '0.6rem', paddingTop: `${cellSize + cellGap}px`, flexShrink: 0 }}>
                        <span style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px` }}>Seg</span>
                        <span style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px`, marginTop: `${cellSize + cellGap}px` }}>Qua</span>
                        <span style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px`, marginTop: `${cellSize + cellGap}px` }}>Sex</span>
                    </div>

                    <div style={{ flex: '0 1 auto', overflowX: 'auto', overflowY: 'hidden' }} className="no-scrollbar">
                        <div style={{ display: 'flex', gap: `${cellGap}px` }}>
                            {data.weeks.map((week, wIndex) => {
                                const month = data.months.find(m => m.index === wIndex);
                                return (
                                    <div key={wIndex} style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px` }}>
                                        <div style={{ height: '16px', position: 'relative', fontSize: '0.6rem', color: isDark ? '#888' : '#777', fontWeight: 600 }}>
                                            {month && <div style={{ position: 'absolute', left: 0, bottom: '2px', whiteSpace: 'nowrap' }}>{month.label}</div>}
                                        </div>
                                        {week.map((day: any) => (
                                            <Tooltip key={day.date} content={<div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, marginBottom: '2px' }}>{day.count} contribuições</div><div style={{ opacity: 0.8, fontSize: '0.7rem' }}>{new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>} side="top" delay={0}>
                                                <div
                                                    style={{ width: `${cellSize}px`, height: `${cellSize}px`, borderRadius: '2px', backgroundColor: getGithubColor(day.count), cursor: day.count > 0 ? 'pointer' : 'default', transition: 'transform 0.1s' }}
                                                    onMouseEnter={(e) => { if (day.count > 0) e.currentTarget.style.transform = 'scale(1.2)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                                />
                                            </Tooltip>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px', color: isDark ? '#666' : '#999', fontSize: '0.6rem' }}>
                    <span style={{ opacity: 0.8 }}>Menos</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                        {[0, 2, 5, 8, 15].map(c => (
                            <div key={c} style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getGithubColor(c), border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }} />
                        ))}
                    </div>
                    <span style={{ opacity: 0.8 }}>Mais</span>
                </div>
            </div>
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
};

export const GitInfoPanel: React.FC<GitInfoPanelProps> = ({ isDark, logs = [] }) => {
    const { git, gitPanelConfig } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(600);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) setContainerWidth(entries[0].contentRect.width);
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const isSmall = containerWidth < 400;
    const isMedium = containerWidth >= 400 && containerWidth < 600;
    const gridCols = isSmall ? 1 : isMedium ? 2 : 3;

    const authorsData = useMemo(() => {
        const authors: Record<string, { count: number; email: string }> = {};
        logs.forEach(commit => {
            const name = commit.author || 'Desconhecido';
            if (!authors[name]) authors[name] = { count: 0, email: '' };
            authors[name].count++;
        });
        return Object.entries(authors).sort((a, b) => b[1].count - a[1].count).map(([name, data]) => ({ name, ...data }));
    }, [logs]);

    const hourlyStats = useMemo(() => {
        const stats = new Array(24).fill(0);
        logs.forEach((l) => {
            const d = new Date(l.date);
            if (!isNaN(d.getTime())) stats[d.getHours()]++;
        });
        const max = Math.max(...stats) || 1;
        return { stats, max };
    }, [logs]);

    const weeklyStats = useMemo(() => {
        const stats = new Array(7).fill(0);
        logs.forEach(l => {
            const d = new Date(l.date);
            if (!isNaN(d.getTime())) stats[d.getDay()]++;
        });
        const max = Math.max(...stats) || 1;
        return { stats, max };
    }, [logs]);

    const isVisible = (id: string) => {
        if (!gitPanelConfig || !gitPanelConfig.sections) return true;
        const section = gitPanelConfig.sections.find(s => s.id === id);
        return section ? section.visible : true;
    };

    const isExpanded = (id: string) => {
        if (!gitPanelConfig || !gitPanelConfig.sections) return true;
        const section = gitPanelConfig.sections.find(s => s.id === id);
        return section ? section.expanded !== false : true;
    };

    const toggleExpanded = (id: string) => {
        if (!gitPanelConfig || !gitPanelConfig.sections) return;
        const sections = gitPanelConfig.sections.map(s =>
            s.id === id ? { ...s, expanded: !isExpanded(id) } : s
        );
        useStore.getState().updateGitPanelConfig({ sections });
    };

    const renderSectionContent = (id: string) => {
        switch (id) {
            case 'overview': return <Heatmap isDark={isDark} logs={logs} />;
            case 'stats': return (
                <div style={{ padding: isSmall ? '12px' : '16px', display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: isSmall ? '8px' : '10px' }}>
                    <StatBox title="Branches" value={git.branches?.length || 0} isDark={isDark} isCompact={isSmall} tooltip="Total de ramificações no projeto" />
                    <StatBox title="Commits" value={logs.length} isDark={isDark} isCompact={isSmall} tooltip="Histórico total de versões" />
                    <StatBox title="Stashes" value={git.stashes?.length || 0} isDark={isDark} isCompact={isSmall} tooltip="Alterações guardadas temporariamente" />
                    <StatBox title="Arquivos" value={git.stats?.fileCount || 0} isDark={isDark} isCompact={isSmall} tooltip="Arquivos rastreados pelo Git" />
                    <StatBox title="Tamanho .git" value={git.stats?.repoSize || '-'} isDark={isDark} isCompact={isSmall} tooltip="Tamanho dos metadados e histórico" />
                    <StatBox title="Projeto" value={git.stats?.projectSize || '-'} isDark={isDark} isCompact={isSmall} tooltip="Tamanho total da pasta de trabalho" />
                </div>
            );
            case 'weekly': return (
                <div style={{ padding: '16px', display: 'flex', alignItems: 'flex-end', height: '60px', gap: '4px', justifyContent: 'space-between' }}>
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => {
                        const count = weeklyStats.stats[i] || 0;
                        const height = (count / weeklyStats.max) * 100;
                        return (
                            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                                <div style={{ width: '100%', height: '40px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                                    <div
                                        title={`${count} commits em ${day}`}
                                        style={{ width: '100%', height: `${height}%`, background: isDark ? '#4dabf7' : '#0070f3', opacity: 0.8, transition: 'height 0.3s ease', cursor: 'pointer' }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.6rem', color: isDark ? '#888' : '#777' }}>{isSmall ? day[0] : day}</span>
                            </div>
                        );
                    })}
                </div>
            );
            case 'hourly': return (
                <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '2px', justifyContent: 'space-between' }}>
                        {hourlyStats.stats.map((count, hour) => {
                            const height = (count / hourlyStats.max) * 100;
                            const showLabel = hour % 6 === 0;
                            return (
                                <div key={hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                                    <div style={{ width: '100%', height: '40px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: '2px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                                        <div
                                            title={`${count} commits às ${hour}h`}
                                            style={{ width: '100%', height: `${height}%`, background: isDark ? '#fbbf24' : '#f59e0b', opacity: 0.8, transition: 'height 0.3s ease', cursor: 'pointer' }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.5rem', color: isDark ? '#888' : '#777', opacity: showLabel ? 1 : 0 }}>{hour}h</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
            case 'contributors': return (
                <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {authorsData.slice(0, 10).map((author, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isDark ? '#333' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.7rem', color: isDark ? '#aaa' : '#555', flexShrink: 0 }}>{author.name[0].toUpperCase()}</div>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? '#ddd' : '#333' }}>{author.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ height: '6px', width: '60px', background: isDark ? '#333' : '#eee', borderRadius: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${(author.count / (logs.length || 1)) * 100}%`, background: isDark ? '#4ade80' : '#22c55e' }} /></div>
                                <span style={{ color: isDark ? '#888' : '#777', width: '20px', textAlign: 'right' }}>{author.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            );
            default: return null;
        }
    };

    if (!git.isInitialized) {
        return <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: isDark ? '#1a1a1a' : '#fff' }} />;
    }

    if (!logs || logs.length === 0) {
        return <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: isDark ? '#1a1a1a' : '#fff' }}><EmptyState isDark={isDark} type={git.isRepo ? "no-commits" : "no-repo"} /></div>;
    }

    const sections = [
        { id: 'overview', title: 'Visão Geral', icon: TrendingUp, tooltip: 'Mapa de Calor de contribuições' },
        { id: 'stats', title: 'Estatísticas', icon: BarChart3, tooltip: 'Métricas reais do repositório' },
        { id: 'weekly', title: 'Atividade Semanal', icon: Calendar, tooltip: 'Distribuição por dia da semana' },
        { id: 'hourly', title: 'Horários de Pico', icon: Clock, tooltip: 'Análise de produtividade 24h' },
        { id: 'contributors', title: 'Ranking de Contribuidores', icon: Users, tooltip: 'Liderança de commits por autor' }
    ];

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative', background: isDark ? '#1a1a1a' : '#fff' }}>
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', backdropFilter: 'blur(10px)', zIndex: 20 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: isDark ? '#555' : '#999' }}>Informações Analíticas</span>
                <button onClick={() => setShowSettings(!showSettings)} style={{ background: showSettings ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: showSettings ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#666' : '#999'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', outline: 'none' }} title="Configurar visualização das seções"><Settings2 size={16} /></button>
            </div>
            <ScrollArea visibility="hover">
                <div style={{ paddingBottom: '20px' }}>
                    {sections.map((section, index) => (
                        isVisible(section.id) && (
                            <PanelSection
                                key={section.id}
                                id={section.id}
                                icon={section.icon}
                                title={section.title}
                                tooltip={section.tooltip}
                                isDark={isDark}
                                animationDelay={index * 0.05}
                                count={section.id === 'contributors' ? authorsData.length : undefined}
                                isOpen={isExpanded(section.id)}
                                onToggle={() => toggleExpanded(section.id)}
                            >
                                {renderSectionContent(section.id)}
                            </PanelSection>
                        )
                    ))}
                </div>
            </ScrollArea>
            {showSettings && <GitPanelConfig isDark={isDark} onClose={() => setShowSettings(false)} />}
        </div>
    );
};
