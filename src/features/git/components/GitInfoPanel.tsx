import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useStore } from '../../../components/../../store/useStore';
import type { GitLogEntry } from '../../../components/../../types/store';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '../../../components/ui/ScrollArea';
import { PanelSection } from './PanelSection';
import { EmptyState } from './EmptyState';
import { GitPanelConfig } from './GitPanelConfig';
import { BarChart3, Calendar, Clock, Users, TrendingUp, Settings2, Tag, Trash2 } from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';

interface GitInfoPanelProps {
    isDark: boolean;
    logs: GitLogEntry[];
    hideHeader?: boolean;
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

const Heatmap: React.FC<{ isDark: boolean; logs: GitLogEntry[] }> = ({ isDark, logs }) => {
    const { t, i18n } = useTranslation();
    const data = useMemo(() => {
        const heatmap: Record<string, number> = {};
        logs.forEach(commit => {
            try {
                const date = new Date(commit.date);
                if (isNaN(date.getTime())) return;
                const key = date.toISOString().split('T')[0];
                heatmap[key] = (heatmap[key] || 0) + 1;
            } catch {
                // Ignore parsing errors
            }
        });

        const weeks: { date: string; count: number; dayObj: Date }[][] = [];
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - (20 * 7));

        while (startDate.getDay() !== 0) {
            startDate.setDate(startDate.getDate() - 1);
        }

        const currentDate = new Date(startDate);
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
            if (date.getMonth() !== prevDate?.getMonth()) {
                return { label: date.toLocaleDateString(i18n.language, { month: 'short' }).replace('.', ''), index: i };
            }
            return null;
        }).filter(m => m !== null);

        return { weeks, months };
    }, [logs, i18n.language]);

    const getGithubColor = (count: number) => {
        if (count === 0) return isDark ? '#2d2d2d' : '#ebedf0';
        if (count <= 2) return isDark ? '#064e3b' : '#bbf7d0'; // Green-900 / Green-200
        if (count <= 5) return isDark ? '#166534' : '#86efac'; // Green-800 / Green-300
        if (count <= 10) return isDark ? '#15803d' : '#4ade80'; // Green-700 / Green-400
        return isDark ? '#22c55e' : '#16a34a'; // Green-500 / Green-600
    };

    const cellSize = 10;
    const cellGap = 3;

    return (
        <div style={{ padding: '16px', fontSize: '0.65rem', userSelect: 'none', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px`, marginTop: '20px', color: isDark ? '#666' : '#999', fontSize: '0.6rem', paddingTop: `${cellSize + cellGap}px`, flexShrink: 0 }}>
                        <span style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px` }}>{t('git.common.days.mon')}</span>
                        <span style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px`, marginTop: `${cellSize + cellGap}px` }}>{t('git.common.days.wed')}</span>
                        <span style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px`, marginTop: `${cellSize + cellGap}px` }}>{t('git.common.days.fri')}</span>
                    </div>

                    <div style={{ flex: '0 1 auto', overflowX: 'auto', overflowY: 'hidden' }} className="no-scrollbar">
                        <div style={{ display: 'flex', gap: `${cellGap}px` }}>
                            {data.weeks.map((week, wIndex) => {
                                const month = data.months.find(m => m.index === wIndex);
                                return (
                                    <div key={week[0]?.date ?? `week-${wIndex}`} style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px` }}>
                                        <div style={{ height: '16px', position: 'relative', fontSize: '0.6rem', color: isDark ? '#888' : '#777', fontWeight: 600 }}>
                                            {month && <div style={{ position: 'absolute', left: 0, bottom: '2px', whiteSpace: 'nowrap' }}>{month.label}</div>}
                                        </div>
                                        {week.map((day) => (
                                            <Tooltip key={day.date} content={<div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, marginBottom: '2px' }}>{day.count} {t('git.info.heatmap.contributions')}</div><div style={{ opacity: 0.8, fontSize: '0.7rem' }}>{new Date(day.date + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>} side="top" delay={0}>
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
                    <span style={{ opacity: 0.8 }}>{t('git.info.heatmap.less')}</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                        {[0, 2, 5, 8, 15].map(c => (
                            <div key={c} style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: getGithubColor(c), border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }} />
                        ))}
                    </div>
                    <span style={{ opacity: 0.8 }}>{t('git.info.heatmap.more')}</span>
                </div>
            </div>
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
};

export const GitInfoPanel: React.FC<GitInfoPanelProps> = ({ isDark, logs = [], hideHeader = false }) => {
    const { git, gitPanelConfig, gitDeleteTag, setConfirmationModal } = useStore();
    const { t } = useTranslation();
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
            const name = commit.author || t('git.common.unknown_author');
            if (!authors[name]) authors[name] = { count: 0, email: '' };
            authors[name].count++;
        });
        return Object.entries(authors).sort((a, b) => b[1].count - a[1].count).map(([name, data]) => ({ name, ...data }));
    }, [logs, t]);

    const hourlyStats = useMemo(() => {
        const stats: number[] = Array.from({ length: 24 }, () => 0);
        logs.forEach((l) => {
            const d = new Date(l.date);
            if (!isNaN(d.getTime())) stats[d.getHours()]++;
        });
        const max = Math.max(...stats) || 1;
        return { stats, max };
    }, [logs]);

    const weeklyStats = useMemo(() => {
        const stats: number[] = Array.from({ length: 7 }, () => 0);
        logs.forEach(l => {
            const d = new Date(l.date);
            if (!isNaN(d.getTime())) stats[d.getDay()]++;
        });
        const max = Math.max(...stats) || 1;
        return { stats, max };
    }, [logs]);

    const sectionDefs = useMemo(() => [
        { id: 'overview', title: t('git.info.sections.overview'), icon: TrendingUp, tooltip: t('git.info.tooltips.overview') },
        { id: 'stats', title: t('git.info.sections.stats'), icon: BarChart3, tooltip: t('git.info.tooltips.stats') },
        { id: 'weekly', title: t('git.info.sections.weekly'), icon: Calendar, tooltip: t('git.info.tooltips.weekly') },
        { id: 'hourly', title: t('git.info.sections.hourly'), icon: Clock, tooltip: t('git.info.tooltips.hourly') },
        { id: 'contributors', title: t('git.info.sections.contributors'), icon: Users, tooltip: t('git.info.tooltips.contributors') },
        { id: 'tags', title: t('git.info.sections.tags'), icon: Tag, tooltip: t('git.info.tooltips.tags') }
    ], [t]);

    const isVisible = (id: string) => {
        if (!gitPanelConfig?.sections) return true;
        const section = gitPanelConfig.sections.find(s => s.id === id);
        return section ? section.visible : true;
    };

    const isExpanded = (id: string) => {
        if (!gitPanelConfig?.sections) return true;
        const section = gitPanelConfig.sections.find(s => s.id === id);
        return section ? section.expanded !== false : true;
    };

    const toggleExpanded = (id: string) => {
        const currentConfig = gitPanelConfig || { sections: [] };
        let sections = currentConfig.sections || [];

        const existingSection = sections.find(s => s.id === id);

        if (existingSection) {
            sections = sections.map(s =>
                s.id === id ? { ...s, expanded: !(s.expanded !== false) } : s
            );
        } else {
            // If it doesn't exist in config, it means it's currently using default (Open/True).
            // So we want to add it as Closed/False.
            const label = sectionDefs.find(s => s.id === id)?.title ?? id;
            sections = [...sections, { id, visible: true, expanded: false, label }];
        }

        useStore.getState().updateGitPanelConfig({ sections });
    };

    const renderSectionContent = (id: string) => {
        switch (id) {
            case 'overview': return <Heatmap isDark={isDark} logs={logs} />;
            case 'stats': return (
                <div style={{ padding: isSmall ? '12px' : '16px', display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: isSmall ? '8px' : '10px' }}>
                    <StatBox title={t('git.info.stats.branches')} value={git.branches?.length || 0} isDark={isDark} isCompact={isSmall} tooltip={t('git.info.stats.tooltips.branches')} />
                    <StatBox title={t('git.info.stats.commits')} value={logs.length} isDark={isDark} isCompact={isSmall} tooltip={t('git.info.stats.tooltips.commits')} />
                    <StatBox title={t('git.info.stats.stashes')} value={git.stashes?.length || 0} isDark={isDark} isCompact={isSmall} tooltip={t('git.info.stats.tooltips.stashes')} />
                    <StatBox title={t('git.info.stats.files')} value={git.stats?.fileCount || 0} isDark={isDark} isCompact={isSmall} tooltip={t('git.info.stats.tooltips.files')} />
                    <StatBox title={t('git.info.stats.git_size')} value={git.stats?.repoSize || '-'} isDark={isDark} isCompact={isSmall} tooltip={t('git.info.stats.tooltips.git_size')} />
                    <StatBox title={t('git.info.stats.project_size')} value={git.stats?.projectSize || '-'} isDark={isDark} isCompact={isSmall} tooltip={t('git.info.stats.tooltips.project_size')} />
                </div>
            );
            case 'weekly': return (
                <div style={{ padding: '16px', display: 'flex', alignItems: 'flex-end', height: '60px', gap: '4px', justifyContent: 'space-between' }}>
                    {[
                        t('git.common.days.sun'),
                        t('git.common.days.mon'),
                        t('git.common.days.tue'),
                        t('git.common.days.wed'),
                        t('git.common.days.thu'),
                        t('git.common.days.fri'),
                        t('git.common.days.sat')
                    ].map((day, i) => {
                        const count = weeklyStats.stats[i] ?? 0;
                        const height = (count / weeklyStats.max) * 100;
                        return (
                            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                                <div style={{ width: '100%', height: '40px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                                    <div
                                        title={`${count} commits`}
                                        style={{
                                            width: '100%',
                                            height: `${height}%`,
                                            background: isDark
                                                ? 'linear-gradient(to top, #15803d, #4ade80)'
                                                : 'linear-gradient(to top, #16a34a, #86efac)',
                                            opacity: count === weeklyStats.max ? 1 : 0.8,
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            borderRadius: '2px 2px 0 0',
                                            boxShadow: count === weeklyStats.max ? (isDark ? '0 0 10px rgba(59, 130, 246, 0.4)' : '0 0 8px rgba(0, 112, 243, 0.3)') : 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                            e.currentTarget.style.filter = 'brightness(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = count === weeklyStats.max ? '1' : '0.8';
                                            e.currentTarget.style.filter = 'none';
                                        }}
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
                                // eslint-disable-next-line react/no-array-index-key
                                <div key={hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                                    <div style={{ width: '100%', height: '40px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: '2px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                                        <div
                                            title={`${count} commits às ${hour}h`}
                                            style={{
                                                width: '100%',
                                                height: `${height}%`,
                                                background: isDark
                                                    ? 'linear-gradient(to top, #15803d, #4ade80)'
                                                    : 'linear-gradient(to top, #16a34a, #86efac)',
                                                opacity: count === hourlyStats.max ? 1 : 0.8,
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                borderRadius: '1px 1px 0 0',
                                                boxShadow: count === hourlyStats.max ? (isDark ? '0 0 10px rgba(251, 191, 36, 0.4)' : '0 0 8px rgba(245, 158, 11, 0.3)') : 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                                e.currentTarget.style.filter = 'brightness(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = count === hourlyStats.max ? '1' : '0.8';
                                                e.currentTarget.style.filter = 'none';
                                            }}
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
                    {authorsData.slice(0, 10).map((author) => (
                        <div key={author.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isDark ? '#333' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.7rem', color: isDark ? '#aaa' : '#555', flexShrink: 0 }}>{author.name[0]}</div>
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
            case 'tags': return (
                <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {!git.tags || git.tags.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: isDark ? '#666' : '#999', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            {t('git.info.tags.empty')}
                        </div>
                    ) : (
                        git.tags.map((tag) => (
                            <div key={tag.name} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px',
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderRadius: '6px',
                                fontSize: '0.8rem'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Tag size={12} color={isDark ? '#eab308' : '#ca8a04'} />
                                        <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#333' }}>{tag.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: isDark ? '#777' : '#888' }}>
                                        <span style={{ fontFamily: 'monospace' }}>{tag.hash.substring(0, 7)}</span>
                                        {tag.date && <span>• {new Date(tag.date).toLocaleDateString()}</span>}
                                    </div>
                                    {tag.message && (
                                        <div style={{ fontSize: '0.7rem', color: isDark ? '#aaa' : '#666', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {tag.message}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setConfirmationModal({
                                            isOpen: true,
                                            title: t('git.info.tags.delete_title') ?? 'Excluir Tag',
                                            message: t('git.info.tags.delete_confirm', { tag: tag.name }),
                                            confirmLabel: t('app.common.delete') ?? 'Excluir',
                                            cancelLabel: t('app.common.cancel') ?? 'Cancelar',
                                            variant: 'danger',
                                            onConfirm: () => {
                                                void gitDeleteTag(tag.name);
                                                setConfirmationModal(null);
                                            },
                                            onCancel: () => setConfirmationModal(null)
                                        });
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: isDark ? '#ef4444' : '#dc2626',
                                        opacity: 0.6,
                                        padding: '4px',
                                        transition: 'opacity 0.2s',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                    title={t('git.info.tags.delete_tooltip')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
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

    return (
        <div
            ref={containerRef}
            className="animate-entrance"
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                background: isDark ? '#1a1a1a' : '#fff',
                opacity: 0
            }}
        >
            {!hideHeader && (
                <div style={{ padding: '8px 16px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', backdropFilter: 'blur(10px)', zIndex: 20 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: isDark ? '#555' : '#999' }}>{t('git.info.title')}</span>
                    <button onClick={() => setShowSettings(!showSettings)} style={{ background: showSettings ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: showSettings ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#666' : '#999'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', outline: 'none' }} title={t('git.info.settings_tooltip')}><Settings2 size={16} /></button>
                </div>
            )}
            <ScrollArea visibility="hover">
                <div style={{ paddingBottom: '20px' }}>
                    {sectionDefs.map((section, index) => (
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
            </ScrollArea >
            {showSettings && <GitPanelConfig isDark={isDark} onClose={() => setShowSettings(false)} />}
        </div >
    );
};
