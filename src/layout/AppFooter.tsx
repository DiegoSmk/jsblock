import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, BellOff, ListX, ChevronDown, Cpu, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';

export const AppFooter: React.FC = () => {
    const { t } = useTranslation();
    const {
        theme,
        notifications,
        unreadNotificationsCount,
        doNotDisturb,
        markNotificationsAsRead,
        clearNotifications,
        toggleDoNotDisturb,
        currentRuntime,
        setRuntime,
        availableRuntimes,
        checkAvailability,
        isExecuting,
        isBenchmarking,
        forceLayout,
        systemStats
    } = useStore();

    const isDark = theme === 'dark';
    const [showNotifications, setShowNotifications] = useState(false);
    const [showRuntimeSelector, setShowRuntimeSelector] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const runtimeRef = useRef<HTMLDivElement>(null);

    const bgColor = isDark ? '#1e1e1e' : '#f3f4f6';
    const borderColor = isDark ? '#2d2d2d' : '#d1d1d1';
    const cyanColor = '#4fc3f7';

    useEffect(() => {
        checkAvailability();
    }, [checkAvailability]);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
            setShowNotifications(false);
        }
        if (runtimeRef.current && !runtimeRef.current.contains(event.target as Node)) {
            setShowRuntimeSelector(false);
        }
    }, []);

    useEffect(() => {
        if (showNotifications || showRuntimeSelector) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications, showRuntimeSelector, handleClickOutside]);

    const handleToggleNotifications = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showNotifications) {
            markNotificationsAsRead();
        }
        setShowNotifications(!showNotifications);
        setShowRuntimeSelector(false);
    };

    const handleToggleRuntime = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowRuntimeSelector(!showRuntimeSelector);
        setShowNotifications(false);
    };

    const renderRuntimeOption = (id: 'node' | 'bun' | 'deno', label: string, desc: string) => {
        const isAvailable = availableRuntimes[id];
        const isActive = currentRuntime === id;

        return (
            <div
                onClick={() => isAvailable && setRuntime(id)}
                style={{
                    padding: '10px 12px',
                    cursor: isAvailable ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    opacity: isAvailable ? 1 : 0.4,
                    background: isActive ? (isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(79, 195, 247, 0.05)') : 'transparent',
                    transition: 'all 0.15s ease'
                }}
                className={isAvailable ? "hover-item" : ""}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: isActive ? cyanColor : 'inherit' }}>
                        {label} {isActive && '•'}
                    </span>
                    <span style={{ fontSize: '9px', opacity: 0.5 }}>{isAvailable ? desc : 'Not installed'}</span>
                </div>
                {isActive ? (
                    <CheckCircle2 size={12} color={cyanColor} />
                ) : (
                    !isAvailable && <AlertCircle size={12} opacity={0.5} />
                )}
            </div>
        );
    };

    return (
        <footer
            className={`app-footer ${isDark ? 'dark' : 'light'}`}
            style={{
                background: bgColor,
                borderTop: `1px solid ${borderColor}`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '22px'
            }}
        >
            <div className="footer-left" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0 12px',
                    color: isExecuting ? cyanColor : 'inherit',
                    height: '100%',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    borderRight: `1px solid ${borderColor}`,
                    background: isExecuting
                        ? (isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(79, 195, 247, 0.05)')
                        : 'transparent',
                    minWidth: '94px',
                    opacity: isExecuting ? 1 : 0.4,
                    transition: 'all 0.3s ease',
                    userSelect: 'none'
                }}>
                    {isExecuting || isBenchmarking ? (
                        <RefreshCw size={12} style={{ animation: 'spin 2s linear infinite' }} />
                    ) : (
                        <CheckCircle2 size={12} />
                    )}
                    <span>{isBenchmarking ? 'Benchmarking' : (isExecuting ? 'Running' : 'Ready')}</span>
                </div>

                {(isExecuting || isBenchmarking) && systemStats.cpu > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0 10px',
                        height: '100%',
                        fontSize: '10px',
                        fontWeight: 600,
                        borderRight: `1px solid ${borderColor}`,
                        color: systemStats.cpu > 80 ? '#f87171' : (isDark ? '#cbd5e1' : '#475569'),
                        transition: 'all 0.3s ease',
                        background: systemStats.cpu > 80 ? 'rgba(248, 113, 113, 0.05)' : 'transparent'
                    }}>
                        <Cpu size={11} style={{ opacity: 0.7 }} />
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>CPU {systemStats.cpu}%</span>
                    </div>
                )}

                <div
                    ref={runtimeRef}
                    onClick={handleToggleRuntime}
                    style={{
                        padding: '0 12px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        borderRight: `1px solid ${borderColor}`,
                        background: showRuntimeSelector ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                        fontSize: '11px',
                        fontWeight: 500,
                        position: 'relative'
                    }}
                    className="footer-item"
                >
                    <div style={{ display: 'flex', alignItems: 'center', height: '12px' }}>
                        <Cpu size={12} style={{ opacity: 0.7 }} />
                    </div>
                    <span style={{
                        opacity: 0.9,
                        lineHeight: '12px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {currentRuntime === 'node' ? 'Node.js' : currentRuntime.charAt(0).toUpperCase() + currentRuntime.slice(1)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', height: '10px' }}>
                        <ChevronDown size={10} style={{ opacity: 0.5, transform: showRuntimeSelector ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>

                    {showRuntimeSelector && (
                        <div
                            className="notification-popover"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'absolute',
                                bottom: 'calc(100% + 8px)',
                                left: '6px',
                                width: '220px',
                                background: isDark ? '#1e1e1e' : '#fff',
                                border: `1px solid ${borderColor}`,
                                borderRadius: '6px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                zIndex: 1000,
                                overflow: 'hidden',
                                opacity: 0,
                                cursor: 'default'
                            }}
                        >
                            <div style={{
                                padding: '10px 12px',
                                fontSize: '10px',
                                fontWeight: 700,
                                opacity: 0.5,
                                letterSpacing: '0.05em',
                                borderBottom: `1px solid ${borderColor}`,
                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                            }}>
                                Select runtime
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {renderRuntimeOption('node', 'Node.js', 'Stable, Standard')}
                                {renderRuntimeOption('bun', 'Bun', 'Fast, Ultra-low latency')}
                                {renderRuntimeOption('deno', 'Deno', 'Secure, Modern')}
                            </div>
                        </div>
                    )}
                </div>

                <div
                    onClick={() => forceLayout()}
                    style={{
                        padding: '0 12px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 500,
                        opacity: 0.8
                    }}
                    className="footer-item hover-item"
                    title={t('app.layout')}
                >
                    <RefreshCw size={12} />
                    <span>{t('app.layout')}</span>
                </div>
            </div>

            <div className="footer-right" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <div
                    ref={popoverRef}
                    className="footer-item notification-trigger"
                    style={{
                        height: '100%',
                        padding: '0 12px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: showNotifications ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
                        borderLeft: `1px solid ${borderColor}`,
                        position: 'relative'
                    }}
                >
                    <div
                        onClick={handleToggleNotifications}
                        style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}
                    >
                        <Bell size={14} color={unreadNotificationsCount > 0 ? cyanColor : 'currentColor'} />
                        {unreadNotificationsCount > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                right: '10px',
                                width: '6px',
                                height: '6px',
                                background: cyanColor,
                                borderRadius: '50%',
                                border: `1px solid ${bgColor}`
                            }} />
                        )}
                    </div>

                    {showNotifications && (
                        <div
                            className="notification-popover"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'absolute',
                                bottom: 'calc(100% + 8px)',
                                right: '6px',
                                width: '320px',
                                background: isDark ? '#1e1e1e' : '#fff',
                                border: `1px solid ${borderColor}`,
                                borderRadius: '6px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                zIndex: 1000,
                                overflow: 'hidden',
                                cursor: 'default',
                                opacity: 0
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px',
                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                borderBottom: notifications.length > 0 ? `1px solid ${borderColor}` : 'none'
                            }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.6, letterSpacing: '0.1em' }}>
                                    {notifications.length > 0 ? 'Notifications' : 'No new notifications'}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ListX
                                        size={14}
                                        cursor="pointer"
                                        style={{ opacity: 0.6 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearNotifications();
                                        }}
                                        className="hover-cyan"
                                    />
                                    {doNotDisturb ? (
                                        <BellOff
                                            size={14}
                                            cursor="pointer"
                                            color={cyanColor}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleDoNotDisturb();
                                            }}
                                        />
                                    ) : (
                                        <Bell
                                            size={14}
                                            cursor="pointer"
                                            style={{ opacity: 0.6 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleDoNotDisturb();
                                            }}
                                            className="hover-cyan"
                                        />
                                    )}
                                    <ChevronDown
                                        size={14}
                                        cursor="pointer"
                                        style={{ opacity: 0.6 }}
                                        onClick={() => setShowNotifications(false)}
                                        className="hover-cyan"
                                    />
                                </div>
                            </div>

                            {notifications.length > 0 ? (
                                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            style={{
                                                padding: '12px',
                                                borderBottom: `1px solid ${isDark ? '#262626' : '#f0f0f0'}`,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                background: notif.read ? 'transparent' : (isDark ? 'rgba(79, 195, 247, 0.04)' : 'rgba(79, 195, 247, 0.02)')
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: 800,
                                                    letterSpacing: '0.05em',
                                                    color: notif.type === 'error' ? '#f87171' : (notif.type === 'success' ? '#4ade80' : cyanColor)
                                                }}>
                                                    {notif.type.toUpperCase()}
                                                </span>
                                                <span style={{ fontSize: '9px', opacity: 0.4 }}>
                                                    {(() => {
                                                        const timestamp = notif.timestamp ?? Date.now();
                                                        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                    })()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '12px', opacity: 0.9, lineHeight: '1.5' }}>
                                                {notif.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.2 }}>
                                    <Bell size={32} strokeWidth={1} />
                                    <span style={{ fontSize: '11px', fontWeight: 500 }}>All caught up</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .hover-item:hover {
                    background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} !important;
                }
                .hover-cyan:hover {
                    color: ${cyanColor} !important;
                    opacity: 1 !important;
                }
            `}</style>
        </footer>
    );
};
